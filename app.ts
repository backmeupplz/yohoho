import { Bot } from 'grammy'

const token = process.env.TOKEN
if (!token) {
  throw new Error('TOKEN is not defined in .env file')
}

const bot = new Bot(token)
bot.start()

bot.use((ctx, next) => {
  ctx.reply(`\`\`\` ${JSON.stringify(ctx.update, undefined, 2)}\`\`\``, {
    parse_mode: 'MarkdownV2',
  })
  next()
})
