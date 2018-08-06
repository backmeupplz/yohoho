// Get environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })

// Dependencies
import { Telegraf, ContextMessageUpdate } from 'telegraf'
const telegraf = require('telegraf')

// Setup the bot
const bot: Telegraf<ContextMessageUpdate> = new telegraf(process.env.TOKEN, {
  username: process.env.USERNAME,
  channelMode: true,
})
bot.startPolling()

// Setup the reply middleware
bot.use((ctx, next) => {
  ctx.replyWithMarkdown(`\`\`\` ${JSON.stringify((<any>ctx).update, undefined, 2)}\`\`\``)
  // Continue bot execution
  next()
})