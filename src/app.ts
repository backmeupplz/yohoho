import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })

import { Bot } from 'grammy'

const bot = new Bot(process.env.TOKEN)
bot.start()

bot.use((ctx, next) => {
  ctx.reply(`\`\`\` ${JSON.stringify(ctx.update, undefined, 2)}\`\`\``, {
    parse_mode: 'MarkdownV2',
  })
  next()
})
