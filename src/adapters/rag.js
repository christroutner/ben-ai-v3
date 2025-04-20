/*
  This file is the adapter for the RAG API.
  It is responsible for sending requests to the RAG API and receiving responses.
*/

// Public npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'
import OllamaAdapter from './ollama.js'

class RAGAdapter {
  constructor () {
    // Encapsulate dependencies
    this.ollama = new OllamaAdapter()

    // Bind 'this' object to all methods.
    this.queryRag = this.queryRag.bind(this)
    this.optimizeQuery = this.optimizeQuery.bind(this)
  }

  async queryRag (query) {
    // Reformat user input into an optimized semantic
    const optimizedQuery = await this.optimizeQuery(query)
    console.log('Optimized query:', optimizedQuery)

    const response = await axios.post(`${config.ragUrl}/query`, {
      query
    })
    console.log('RAG response:', response.data)

    let knowledge = ''

    const documents = response.data.results.documents

    if (documents.length > 0) {
      knowledge = `
      # Knowledge Base
      ${documents.length} documents found in your RAG knowledge base. These may or may not
      be relevant to understanding the user's query.

      `

      for (let i = 0; i < documents.length; i++) {
        console.log(`Document ${i + 1}:`, documents[i])
      }
    }
    console.log('Knowledge:', knowledge)

    // return response.data
    return ''
  }

  // Reformat user input into an optimized semantic
  async optimizeQuery (query) {
    try {
      const optimizationPrompt = `
      You are a helpful assistant that re-formats user input into an optimized semantic query.
      The query you produce will be used to search a RAG knowledge base for relevant information,
      so it should be optimized for semantic search of the main topics in the users input

      The user input is: ${query}

      The optimized semantic query is:
      `

      const optimizedQuery = await this.ollama.promptLlm(optimizationPrompt)
      return optimizedQuery
    } catch (err) {
      console.error('Error in rag.js/optimizeQuery')
      throw err
    }
  }
}

export default RAGAdapter
