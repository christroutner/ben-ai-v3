/*
  This file is the adapter for the RAG API.
  It is responsible for sending requests to the RAG API and receiving responses.
*/

// Public npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'
import OllamaAdapter from './ollama.js'
import ParseJsonAdapter from './parse-json-from-text.js'

class RAGAdapter {
  constructor () {
    // Encapsulate dependencies
    this.ollama = new OllamaAdapter()
    this.parseJson = new ParseJsonAdapter()

    // Bind 'this' object to all methods.
    this.queryRag = this.queryRag.bind(this)
    this.optimizeQuery = this.optimizeQuery.bind(this)
  }

  async queryRag (query) {
    // Reformat user input into an optimized semantic
    let optimizedQuery = await this.optimizeQuery(query)
    console.log('queryRage() Optimized query:', optimizedQuery)

    // If the query can not be optimized, then use the original query.
    if (!optimizedQuery) {
      optimizedQuery = query
    }

    const response = await axios.post(`${config.ragUrl}/query`, {
      query: optimizedQuery
    })
    console.log('RAG response:', response.data)

    let knowledge = ''

    const documents = response.data.results

    if (documents.length > 0) {
      knowledge = `
## Knowledge Base
${documents.length} documents found in your RAG knowledge base. These may or may not
be relevant to understanding the user's query.

In your response, do not reference the documents. The user can not see the documents,
so it sounds awkward when you reference them. Just use the information in formulating
your answer.

      `

      for (let i = 0; i < documents.length; i++) {
        const document = documents[i]
        console.log(`Document ${i + 1}:`, document)

        knowledge += `

### Document ${i + 1} of ${documents.length}
${document}

`
      }
    }
    console.log('Knowledge:', knowledge)

    // return response.data
    return knowledge
  }

  // Reformat user input into an optimized semantic
  async optimizeQuery (query) {
    try {
      const optimizationPrompt = `
You are a helpful assistant that re-formats user input into an optimized semantic query.
The query you produce will be used to search a RAG knowledge base for relevant information,
so it should be optimized for semantic search of the main topics in the users input

The user input is: 

${query}

Response format should be formatted in a valid JSON block like this:
\`\`\`json
{
  "query": "<string>"
}
\`\`\`
Your response should include the valid JSON block and nothing else.
`

      const llmResponse = await this.ollama.promptLlm(optimizationPrompt)

      let optimizedQuery = null
      let tryCnt = 0

      while (!optimizedQuery && tryCnt < 3) {
        optimizedQuery = this.parseJson.parseJSONObjectFromText(llmResponse)
        console.log('optimizeQuery() Optimized query:', optimizedQuery)
        tryCnt++
      }

      if (!optimizedQuery) {
        return ''
      }

      return optimizedQuery.query
    } catch (err) {
      console.error('Error in rag.js/optimizeQuery')
      throw err
    }
  }
}

export default RAGAdapter
