// Get environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import { Telegraf } from 'telegraf'
// Setup the bot
const bot = new Telegraf(process.env.TOKEN)
// Setup the reply middleware
bot.use((ctx) =>
  ctx.replyWithHTML(
    `<code>${JSON.stringify((<any>ctx).update, undefined, 2)}</code>`
  )
)
// Catch errors
bot.catch(console.error)
// Start bot
bot.launch().then(() => {
  console.log('Bot started')
})
