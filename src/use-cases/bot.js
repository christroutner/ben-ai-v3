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
    this.refineResponse = this.refineResponse.bind(this)
    this.handleIncomingPrompt3 = this.handleIncomingPrompt3.bind(this)

    // State
  }

  // This implementation splits the prompt into three versions:
  // - The original prompt
  // - A 'terse' version that is a concise, focused, single sentence version of the prompt.
  // - A 'verbose' version that is at least a paragram. It a more detailed, technical, and descriptive version of the prompt.
  //
  // Each version is used to retrieve knowledge chunks from LightRAG. The chunks are then
  // filtered by the LLM to determine which chunks are most relevant to the original prompt,
  // and to remove duplicates.
  //
  // A final prompt is built with the refined knowledge chunks, and the final
  // response is returned.
  async handleIncomingPrompt3 (inObj = {}) {
    try {
      const { prompt } = inObj

      // Generate the terse version of the prompt.
      const tersePrompt =
`
Below is a prompt for an LLM. Your task is to generate a terse version of the 
prompt. The terse version should be a concise, focused, single sentence version 
of the prompt.

Here is the original prompt:
${prompt}
`
      const terseResponse = await this.adapters.ollama.promptLlm(tersePrompt)
      console.log('\n\nterseResponse: ', terseResponse)

      // Generate the verbose version of the prompt.
      const verbosePrompt =
`
Below is a prompt for an LLM. Your task is to generate a verbose version of the 
prompt. The verbose version should be a more detailed, technical, and descriptive 
version of the prompt. It should be at least a paragraph long, but less than
five paragraphs long.

Here is the original prompt:
${prompt}
`
      const verboseResponse = await this.adapters.ollama.promptLlm(verbosePrompt)
      console.log('\n\nverboseResponse: ', verboseResponse)

      // Retrieve the knowledge chunks from LightRAG for the three prompts.
      const terseChunks = await this.adapters.lightrag.getChunksFromLightRAG(tersePrompt)
      console.log('\n\nterseChunks: ', terseChunks)
      const verboseChunks = await this.adapters.lightrag.getChunksFromLightRAG(verbosePrompt)
      console.log('\n\nverboseChunks: ', verboseChunks)
      const originalChunks = await this.adapters.lightrag.getChunksFromLightRAG(prompt)
      console.log('\n\noriginalChunks: ', originalChunks)

      const combinedChunks =
`
--- Terse Prompt Knowledge Chunks ---
${terseChunks}
--- Verbose Prompt Knowledge Chunks ---
${verboseChunks}
--- Original Prompt Knowledge Chunks ---
${originalChunks}
`

      // Have the LLM remove duplicates from the combined chunks.
      const removeDuplicatesPrompt =
`
Below is a prompt for an LLM. The prompt was used three different ways to 
retrieve knowledge chunks from a LightRAG knowledge base.
Some chunks may be duplicates.

Your task is to remove duplicates from the knowledge chunks. Reproduce the
chunks faithfully, and do not change the content of the chunks. Simply
remove the chunks that are duplicates.
Do not add any commentary or notes in your response.

Here are the knowledge chunks from the three prompts:
${combinedChunks}
`
      const removeDuplicatesResponse = await this.adapters.ollama.promptLlm(removeDuplicatesPrompt)
      console.log('\n\nremoveDuplicatesResponse: \n', removeDuplicatesResponse)

      // Have the LLM filter the combined chunks.
      const filterChunksPrompt =
`
Below is a prompt for an LLM. The prompt was used three different ways to 
retrieve knowledge chunks from a LightRAG knowledge base.
Some may be irrelevant to the original prompt.
Your task is to filter the knowledge chunks. 
Determine which chunks are relevant to the original prompt.
Remove any chunks that are not relevant to the original prompt.
Reproduce the chunks faithfully, and do not change the content of the chunks. 
Simply remove the chunks that not relevant.
Do not add any commentary or notes in your response.

Here is the original prompt:
${prompt}

Here are the knowledge chunks from the three prompts:
${removeDuplicatesPrompt}

`
      const filterChunksResponse = await this.adapters.ollama.promptLlm(filterChunksPrompt)
      console.log('\n\nfilterChunksResponse: \n', filterChunksResponse)

      // Build the final prompt with the filtered chunks.
      const finalPrompt =
`
# Overview
You are a helpful tech-support agent. Your job is to answer technical questions.
You will be given a list of documents from your RAG knowledge database to help
answer the question.
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
${filterChunksResponse}

## Task Objective

Your task is to follow the Writing Guidelines above, and use the information from
the RAG Knowledge Base to answer the prompt from the user.

**Prompt from the user:**
${prompt}
`
      const finalResponse = await this.adapters.ollama.promptLlm(finalPrompt)
      // console.log('\n\nfinalResponse: \n', finalResponse)

      return finalResponse
    } catch (err) {
      console.error('Error in use-cases/bot.js/handleIncomingPrompt3()')
      throw err
    }
  }

  // This function is called by the Telegram Controller when a new message is
  // received.
  // This implementation retrieves knowledge chunks from LightRAG, and
  // adds those chunks to a prompt for the LLM. It then returns the response
  // from the LLM.
  async handleIncomingPrompt (inObj = {}) {
    try {
      // const { prompt, telegramMsg } = inObj
      const { prompt } = inObj

      // const ragResponse = await this.adapters.rag.queryRag(prompt)
      const ragResponse = await this.adapters.lightrag.getChunksFromLightRAG(prompt)
      // console.log('RAG response:', ragResponse)

      const completePrompt =
`
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

  // This older implementation uses LightRAG to query the RAG knowledge base
  // AND have it answer the prompt directly, based on it's graph database.
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
      const { prompt, response } = inObj

      const ragResponse = await this.adapters.lightrag.getChunksFromLightRAG(response)
      // console.log('ragResponse: ', ragResponse)

      const hallucinationCheckPrompt = `
Your job is to skeptically review a response from a large language model (LLM). You will be 
provided with the original prompt, a response from an LLM, and a list of documents from your RAG 
knowledge base.

You will need to critically review the response and determine if it is 
consistent with the information in the documents. You will need to make
a boolean decision about whether the response is adequately responding 
to the prompt and if the LLM is hallucinating or not.

The response does not have to be exhaustive or perfectly accurate, so
long as it is addressing the user's question. For example, a concise
response is more desirable than an exhaustive, technical answer to a
simple question.

If it is hallucinating, then you will need to provide a critique of the 
response. Your response should be limited to a single paragraph summary,
explaining the main reason why you think the response contains
hallucinations.

You will also need to provide a summary of the pertinent details from the documents
that are relevant to the response. This will help the LLM understand the context of
the response and help it correct the hallucinations.

In the critique and pertinent details, do not reference the documents. The LLM
can not see the same documents as you, so it will confuse the LLM. If there
is data you want to reference, just re-state the data to the LLM can see the
data in your response.

**The original prompt is:**
${prompt}

**The response from the LLM is:**
${response}

**The documents from the RAG knowledge base are:**
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
      // console.log('hallucinationCheckResponse: ', hallucinationCheckResponse)

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

### The question is:
${prompt}

### The original answer is:
${lastResponse}

### The critique of the answer is:
${hallucinationFeedback}

### The pertinent details from the documents that are relevant to the response:
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
      console.log('\n\n\nStage 2 Ollama response:\n', response)

      return response
    } catch (err) {
      console.error('Error in use-cases/bot.js/promptWithFeedback()')
      throw err
    }
  }

  // Loop through a series of hallucination checks and feedback in order to
  // refine the response for accuracy.
  async refineResponse (inObj = {}) {
    try {
      const { prompt, originalResponse } = inObj

      // Be default, if something goes wrong, the output response is the original response.
      let outputResponse = originalResponse

      // Loop through the refinement process 3 times. If the response gets
      // refined before 3 loops, it will exit early.
      let responseToCheck = originalResponse
      for (let i = 0; i < 3; i++) {
        console.log('\n\n\nrefineResponse() i: ', i)

        // Try up to three times to get a valid hallucination check object.
        let hallucinationCheckObj = null
        for (let j = 0; j < 3; j++) {
          console.log('\n\nhallucinationCheck() j: ', j)

          const hallucinationCheckResponse = await this.hallucinationCheck({ prompt, response: responseToCheck })
          hallucinationCheckObj = this.adapters.parseJson.parseJSONObjectFromText(hallucinationCheckResponse)
          console.log('hallucinationCheckObj: ', hallucinationCheckObj)

          if (hallucinationCheckObj) {
            break
          }
        }

        // If the response is hallucinating, then we need to collect data
        // and feed back the criticism to get a new response.
        if (hallucinationCheckObj) {
          // Sometimes the isHallucinating property is a string, so we need to convert it to a boolean.
          let isHallucinating = false
          if (hallucinationCheckObj.isHallucinating === 'true') {
            isHallucinating = true
          } else if (hallucinationCheckObj.isHallucinating === 'false') {
            isHallucinating = false
          } else if (hallucinationCheckObj.isHallucinating) {
            isHallucinating = true
          }
          console.log('isHallucinating: ', isHallucinating)

          if (isHallucinating) {
            // Collect data and feed back the criticism to get a new response.
            const newResponseInput = {
              prompt,
              lastResponse: responseToCheck,
              hallucinationFeedback: hallucinationCheckObj.critique,
              pertinentDetails: hallucinationCheckObj.pertinentDetails
            }

            responseToCheck = await this.promptWithFeedback(newResponseInput)
            // console.log('\n\nresponseToCheck: ', responseToCheck)
          } else {
            // If the hallucination check determines that there is no hallucination,
            // then return the last refined response.
            console.log(`No hallucination, returning last refined response. i: ${i}`)

            outputResponse = responseToCheck
            break
          }
        }
      }

      return outputResponse
    } catch (err) {
      console.error('Error in use-cases/bot.js/refineResponse()')
      throw err
    }
  }
}

export default BotUseCases
