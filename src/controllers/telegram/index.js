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
    this.bot = new TelegramBot(config.telegramBotToken, {
      polling: true,
      request: {
        agentOptions: {
          keepAlive: true,
          family: 4
        }
      }
    })
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
# Overview
You are a helpful tech-support agent. Your job is to answer technical questions.
You will be given a list of documents from your RAG knowledge database to help
answer the question, but those documents may not be relevant to the question.
Use your internal knowledge to answer the question, and only use the documents
when they seem relevant to the question being asked.

Question: ${parsedMsg}

## Writing Guidelines
- If the question is not related to technology, or if the input is not an explicit
or implied question, then you can ignore the prompt and not respond.

- If you do not know the answer, then respond that you do not know. Do not make up
an answer or hallucinate an answer.

${ragResponse}
`
      console.log('completePrompt: ', completePrompt)

      const response = await this.adapters.ollama.promptLlm(completePrompt)
      console.log('\nFinal ollama response:\n', response)

      console.log('Original Telegram msg: ', msg)

      // const chatId = msg.chat.id
      // console.log('chatId: ', chatId)
      // this.bot.sendMessage(chatId, response)

      const opts = {
        reply_to_message_id: msg.message_id
      }

      this.bot.sendMessage(msg.chat.id, response, opts)
    } catch (error) {
      console.error('Error in processMsg:', error)
      this.bot.sendMessage(msg.chat.id, 'Sorry, there was an error processing your request. Please try again later.')
    }
  }
}

export default TelegramController
