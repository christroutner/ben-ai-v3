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
    try {
      console.log('Received message:', msg)

      const rawMsg = msg.text
      const parsedMsg = rawMsg.slice(3) // Remove the /q prefix.
      console.log('parsedMsg: ', parsedMsg)

      const ragResponse = await this.adapters.rag.queryRag(parsedMsg)
      console.log('RAG response:', ragResponse)

      const completePrompt = `
You are a helpful tech-support agent. You are given a question and a list of documents.
Your job is to answer the question using the documents.

Question: ${parsedMsg}

${ragResponse}
`
      console.log('completePrompt: ', completePrompt)

      const response = await this.adapters.ollama.promptLlm(completePrompt)
      console.log('\nFinal ollama response:\n', response)

      console.log('Original Telegram msg: ', msg)

      const chatId = msg.chat.id
      console.log('chatId: ', chatId)
      this.bot.sendMessage(chatId, response)
    } catch (error) {
      console.error('Error in processMsg:', error)
      this.bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your request. Please try again later.')
    }
  }
}

export default TelegramController
