/*
  This is the business logic for the AI chat bot.
  This library is activated by the Telegram Controller.
*/

// Public npm libraries

// Local libraries

class BotUseCases {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating Usage Use Cases library.'
      )
    }

    // Bind 'this' object to all subfunctions

    // State
  }

  // This function is called by the Telegram Controller when a new message is
  // received.
  async handleIncomingPrompt (inObj = {}) {
    try {
      // const { prompt, telegramMsg } = inObj
      const { prompt } = inObj

      const ragResponse = await this.adapters.rag.queryRag(prompt)
      console.log('RAG response:', ragResponse)

      const completePrompt = `
# Overview
You are a helpful tech-support agent. Your job is to answer technical questions.
You will be given a list of documents from your RAG knowledge database to help
answer the question, but those documents may not be relevant to the question.
Use your internal knowledge to answer the question, and only use the documents
when they seem relevant to the question being asked.

Question: ${prompt}

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

      return response
    } catch (err) {
      console.error('Error in use-cases/bot.js/handleIncomingPrompt()')
      throw err
    }
  }
}

export default BotUseCases
