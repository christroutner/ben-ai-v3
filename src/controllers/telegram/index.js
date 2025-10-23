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

    try {
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
    } catch (err) {
      console.error('Error in controllers/telegram/index.js/constructor(): ', err)
    }
  }

  // Triggers when a user prefaces a message with /q.
  async processMsg (msg) {
    try {
      console.log('controllers/telegram/index.js/processMsg() received message:', msg)

      const rawMsg = msg.text
      const parsedMsg = rawMsg.slice(3) // Remove the /q prefix.
      console.log('parsedMsg: ', parsedMsg)
      console.log(' ')

      const response1 = await this.useCases.bot.handleIncomingPrompt({ prompt: parsedMsg, telegramMsg: msg })

      const refinedResponse = await this.useCases.bot.refineResponse({ prompt: parsedMsg, originalResponse: response1 })

      // Try sending with Markdown first, fallback to plain text if it fails
      await this.sendTelegramMessage(msg.chat.id, refinedResponse, msg.message_id)

      return true
    } catch (error) {
      console.error('Error in processMsg:', error)

      const opts = {
        reply_to_message_id: msg.message_id
      }
      this.bot.sendMessage(msg.chat.id, `Sorry, there was an error processing your request: ${error.message}. Please try again later.`, opts)
        .catch(err => console.error('Failed to send error message:', err))
    }
  }

  // Helper method to send Telegram messages with automatic fallback
  async sendTelegramMessage (chatId, message, replyToMessageId) {
    const optsWithMarkdown = {
      reply_to_message_id: replyToMessageId,
      parse_mode: 'Markdown'
    }

    try {
      // Try with Markdown parsing first
      await this.bot.sendMessage(chatId, message, optsWithMarkdown)
      console.log('Message sent successfully with Markdown')
    } catch (error) {
      // If it's a Telegram parsing error, retry without Markdown
      if (error.code === 'ETELEGRAM' && error.message.includes("can't parse entities")) {
        console.warn('Markdown parsing failed, retrying as plain text')
        console.warn('Error details:', error.message)

        const optsPlainText = {
          reply_to_message_id: replyToMessageId
        }

        try {
          await this.bot.sendMessage(chatId, message, optsPlainText)
          console.log('Message sent successfully as plain text')
        } catch (retryError) {
          console.error('Failed to send message even as plain text:', retryError)
          throw retryError
        }
      } else {
        // Re-throw if it's a different type of error
        throw error
      }
    }
  }
}

export default TelegramController
