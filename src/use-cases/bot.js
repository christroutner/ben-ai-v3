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
    this.hallucinationCheck = this.hallucinationCheck.bind(this)
    this.promptWithFeedback = this.promptWithFeedback.bind(this)

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
      console.log('\nStage 1 Ollama response:\n', response)

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

  async hallucinationCheck (inObj = {}) {
    try {
      const { response1 } = inObj

      const ragResponse = await this.adapters.lightrag.getChunksFromLightRAG(response1)
      // console.log('ragResponse: ', ragResponse)

      const hallucinationCheckPrompt = `
Your job is to skeptically review a response from a large language model (LLM). You will be 
provided with a response from an LLM, and a list of documents from your RAG 
knowledge base.

You will need to critically review the response and determine if it is 
consistent with the information in the documents. You will need to make
a boolean decision about whether the response is hallucinating or not.

If it is hallucinating, then you will need to provide a critique of the 
response. Your response should be limited to a single paragraph summary,
explaining the main reason why you think the response contains
hallucinations.

You will also need to provide a summary of the pertinent details from the documents
that are relevant to the response. This will help the LLM understand the context of
the response and help it correct the hallucinations.


The response from the LLM is:
${response1}

The documents from the RAG knowledge base are:
${ragResponse}

Your response should be formatted in a valid JSON block like this:
\`\`\`json
{
  "isHallucinating": <boolean>,
  "critique": "<string>",
  "pertinentDetails": "<string>"
}
\`\`\`

Your response should include the valid JSON block and nothing else.
`

      const hallucinationCheckResponse = await this.adapters.ollama.promptLlm(hallucinationCheckPrompt)
      console.log('hallucinationCheckResponse: ', hallucinationCheckResponse)

      return hallucinationCheckResponse
    } catch (err) {
      console.error('Error in use-cases/bot.js/halucinationCheck()')
      throw err
    }
  }

  async promptWithFeedback (inObj = {}) {
    try {
      const { prompt, lastResponse, hallucinationFeedback, pertinentDetails } = inObj
      // console.log('promptWithFeedback() prompt: ', prompt)
      // console.log('promptWithFeedback() lastResponse: ', lastResponse)
      // console.log('promptWithFeedback() hallucinationFeedback: ', hallucinationFeedback)

      const ragResponse = await this.adapters.lightrag.getChunksFromLightRAG(prompt)

      const newPrompt = `
# Overview
You are a helpful tech-support agent. Your job is to answer technical questions.
You have already answered a question, but the answer was determined to contain
hallucinations. You will be given the question, the original answer, and a critique
of the answer. Your job is to rewrite the answer to the question, correcting the
hallucinations in the original answer.

To help you correct the hallucinations, you will be given a list of documents from
your RAG knowledge base. These may or may not be relevant to the question, but
they may provide helpful information to help you correct the hallucinations in the
original answer.

## Writing Guidelines
- If the question is not related to technology, or if the input is not an explicit
or implied question, then you can ignore the prompt and not respond.

- If you do not know the answer, then respond that you do not know. Do not make up
an answer or hallucinate an answer.

- Do not reference the chunks from the RAG Knowledge Base in your response. The user
can not see the chunks, so it sounds awkward when you reference them. The chunks are
part of *your* knowledge, so if you need to reference them, use the first person. Do
not mention the RAG database at all in your response.

- Do not reference the critique. The user can not see the critique, so it sounds awkward
when you reference it. Do not mention the critique at all in your response. Do not
mention that you've re-written the response. Do not mention inaccuracies in the 
previous answer. Just take the critique into consideration when formulating a 
new response.

The question is:
${prompt}

The original answer is:
${lastResponse}

The critique of the answer is:
${hallucinationFeedback}

The pertinent details from the documents that are relevant to the response:
${pertinentDetails}

## RAG Knowledge Base
${ragResponse}

## Task Objective

Your task is to follow the Writing Guidelines above, and use the information from
the RAG Knowledge Base to answer the prompt from the user.

**Prompt from the user:**
${prompt}
`
      console.log('newPrompt: ', newPrompt)

      const response = await this.adapters.ollama.promptLlm(newPrompt)
      console.log('\nStage 2 Ollama response:\n', response)

      return response
    } catch (err) {
      console.error('Error in use-cases/bot.js/promptWithFeedback()')
      throw err
    }
  }
}

export default BotUseCases
