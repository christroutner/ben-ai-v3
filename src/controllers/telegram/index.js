/*
  This file is the main entry point for the Telegram bot.
*/

// Public npm libraries
import TelegramBot from 'node-telegram-bot-api'

// Private libraries
import config from '../../../config/index.js'

class TelegramController {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Telegram Bot Controller libraries.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Telegram Bot Controller libraries.'
      )
    }
    if (!config.telegramBotToken) {
      throw new Error('Telegram bot token is required as env var TELEGRAM_BOT_TOKEN.')
    }

    // Bind 'this' object to all methods.
    this.processMsg = this.processMsg.bind(this)

    // Initialize the bot.
    this.bot = new TelegramBot(config.telegramBotToken, { polling: true })
    this.bot.onText(/\/q/, this.processMsg)
  }

  // Triggers when a user prefaces a message with /q.
  async processMsg (msg) {
    console.log('Received message:', msg)

    const rawMsg = msg.text
    const parsedMsg = rawMsg.slice(3) // Remove the /q prefix.

    const response = await this.adapters.ollama.promptLlm(parsedMsg)

    this.bot.sendMessage(msg.chat.id, response)
  }
}

export default TelegramController
