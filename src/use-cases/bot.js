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
    this.handleIncomingPrompt = this.handleIncomingPrompt.bind(this)
    this.handleIncomingPrompt2 = this.handleIncomingPrompt2.bind(this)

    // State
  }

  // This function is called by the Telegram Controller when a new message is
  // received.
  async handleIncomingPrompt (inObj = {}) {
    try {
      // const { prompt, telegramMsg } = inObj
      const { prompt } = inObj

      // const ragResponse = await this.adapters.rag.queryRag(prompt)
      const ragResponse = await this.adapters.lightrag.getChunksFromLightRAG(prompt)
      // console.log('RAG response:', ragResponse)

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

- Do not reference the chunks from the RAG Knowledge Base in your response. The user
can not see the chunks, so it sounds awkward when you reference them. The chunks are
part of *your* knowledge, so if you need to reference them, use the first person. Do
not mention the RAG database at all in your response.

## RAG Knowledge Base
${ragResponse}

## Task Objective

Your task is to follow the Writing Guidelines above, and use the information from
the RAG Knowledge Base to answer the prompt from the user.

**Prompt from the user:**
${prompt}
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

  async handleIncomingPrompt2 (inObj = {}) {
    try {
      const { prompt } = inObj
      console.log('handleIncomingPrompt2() prompt: ', prompt)

      const ragResponse = await this.adapters.lightrag.queryLightRAG(prompt)
      console.log('ragResponse: ', ragResponse)

      return ragResponse
    } catch (err) {
      console.error('Error in use-cases/bot.js/handleIncomingPrompt2()')
      throw err
    }
  }
}

export default BotUseCases
