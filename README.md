# [@yohoho_bot](https://t.me/yohoho_bot) Telegram bot code
This is the code for the echo bot I've built. Got tired of trying to figure out chat ids, user ids, forwards, etc. So you can forward (or send) any message to this bot and get a response with literally the update message bot received from Telegram with all the info

# Installation and local launch
1. Clone this repo: `git clone https://github.com/backmeupplz/yohoho`
2. Create `.env` with the environment variables listed below
3. Run `yarn install` in the root folder
4. Run `yarn start`

And you should be good to go! Feel free to fork and submit pull requests. Thanks!

# Environment variables
* `TOKEN` — Telegram bot token
* `USERNAME` — Telegram bot username

Also, please, consider looking at `.env.sample`.

# Continuous integration
Any commit pushed to master gets deployed to @yohoho_bot via [CI Ninja](https://github.com/backmeupplz/ci-ninja).

# License
MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
