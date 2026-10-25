import { readFile, stat, unlink, utimes, writeFile } from 'node:fs/promises'
import { hostname } from 'node:os'
import type { Bot, PollingOptions } from 'grammy'
import type { Update } from 'grammy/types'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Zero-downtime deploys for a long-polling bot. Tugport starts the new container next to the old one,
 * but Telegram serves one getUpdates poller at a time, so the poller holds a lock file on a volume both
 * containers mount (HANDOVER_LOCK). The new container boots, waits for the lock and starts polling as
 * soon as the old one releases it on SIGTERM (or stops refreshing it for 10 s, if it died).
 *
 * `stop` ends polling and confirms every fetched update, so the new poller never gets them again; the
 * lock is released right after it. `drain` then waits for handlers still running before the exit.
 * Without HANDOVER_LOCK (local runs) the bot polls right away.
 */
export async function pollWithHandover(
  start: () => Promise<void> | void,
  stop: () => Promise<unknown>,
  drain: () => Promise<unknown> = async () => {}
) {
  const lock = process.env.HANDOVER_LOCK
  // A restarted container keeps its hostname and pid, so it takes its own lock back at once
  const me = `${hostname()} ${process.pid}`
  const owner = () => (lock ? readFile(lock, 'utf8').catch(() => '') : '')
  let beat: ReturnType<typeof setInterval> | undefined
  if (lock) {
    for (;;) {
      const current = await owner()
      const age = await stat(lock).then(
        (s) => Date.now() - s.mtimeMs,
        () => Infinity
      )
      if (!current || current === me || age > 10000) {
        await writeFile(lock, me)
        // Two waiters can write at once; the last write wins
        await sleep(200)
        if ((await owner()) === me) break
      }
      await sleep(200)
    }
    beat = setInterval(() => {
      const now = new Date()
      utimes(lock, now, now).catch(() => {})
    }, 1000)
    console.log('Holding the polling lock')
  }
  let stopping = false
  const shutdown = async () => {
    if (stopping) return
    stopping = true
    clearInterval(beat)
    // Tugport kills the old container 30 s after SIGTERM
    await Promise.race([stop(), sleep(10000)]).catch(console.error)
    if (lock && (await owner()) === me) await unlink(lock).catch(() => {})
    await Promise.race([drain(), sleep(15000)]).catch(console.error)
    process.exit(0)
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
  return start()
}

/**
 * grammY's `bot.start(options)` under the handover lock. `bot.stop()` aborts the long poll, but its
 * confirming getUpdates repeats the offset just polled, and Telegram holds a getUpdates that repeats
 * the previous one's offset within 3 s for up to 3 s. So while stopping, that call confirms the updates
 * fetched but not yet confirmed at a fresh offset, or is skipped when there are none. `close` runs once
 * the last fetched batch is handled. Resolves when polling ends (and rejects if it fails).
 */
export function startWithHandover(bot: Bot<any>, options?: PollingOptions, close?: () => unknown) {
  // Telegram has confirmed every update before `polled`; `fetched` is the newest update received
  let polled = 0
  let fetched = 0
  let stopping = false
  bot.api.config.use(async (prev, method, payload, signal) => {
    if (method !== 'getUpdates') return prev(method, payload, signal)
    if (stopping) {
      if (fetched < polled) return { ok: true, result: [] } as any
      payload = { ...payload, offset: fetched + 1, timeout: 0 }
    }
    polled = (payload as { offset?: number }).offset ?? 0
    const response = await prev(method, payload, signal)
    if (response.ok) {
      for (const update of response.result as Update[]) fetched = Math.max(fetched, update.update_id)
    }
    return response
  })
  let polling: Promise<void> | undefined
  return pollWithHandover(
    () => (polling = bot.start(options)),
    () => {
      stopping = true
      return bot.stop()
    },
    async () => {
      await polling
      await close?.()
    }
  )
}
