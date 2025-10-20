/*
  Adapter library for the LightRAG API.
*/

// Public npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class LightRAGAdapter {
  constructor () {
    // Encapsulate dependencies

    // Bind 'this' object to all methods.
    this.queryLightRAG = this.queryLightRAG.bind(this)
    this.getChunksFromLightRAG = this.getChunksFromLightRAG.bind(this)
  }

  // This method will query LightRAG and have LightRAG automatically generate 
  // a response from the LLM.
  async queryLightRAG (prompt) {
    try {
      // console.log('queryLightRAG() config: ', config)

      const url = `${config.ragUrl}/query` // Query RAG + LLM generation
      // const url = `${config.ragUrl}/query/data` // Query RAG only
      console.log('url: ', url)

      const response = await axios.post(url, {
        query: prompt,
        mode: 'mix'
      })
      // console.log('response.data: ', JSON.stringify(response.data, null, 2))
      // console.log('response.data (shape): ', response.data)

      

      return response.data.response
    } catch (err) {
      console.error('Error in adapters/lightrag.js/queryLightRAG()')
      throw err
    }
  }

  // This method will retrieve 20 chunks of data from LightRAG. It will return
  // a string with the chunks formatted in it, as subcomponent of a prompt.
  async getChunksFromLightRAG (prompt) {
    try {
      // console.log('queryLightRAG() config: ', config)

      // const url = `${config.ragUrl}/query` // Query RAG + LLM generation
      const url = `${config.ragUrl}/query/data` // Query RAG only
      console.log('url: ', url)

      const response = await axios.post(url, {
        query: prompt,
        mode: 'mix'
      })
      // console.log('response.data: ', JSON.stringify(response.data, null, 2))
      // console.log('response.data (shape): ', response.data)

      if(response.data.status !== 'success') {
        throw new Error('Error in adapters/lightrag.js/getChunksFromLightRAG()')
      }

      let ragResult = ''
      for(let i=0; i < response.data.data.chunks.length; i++) {
        const thisChunk = response.data.data.chunks[i].content

        // Generate a source string for the chunk, based on the source file path.
        const source = response.data.data.chunks[i].file_path.replace('/home/trout/llm/ben-training-data/knowledge/shared/', '')
        
        ragResult += `\n\n**Chunk ${i + 1} of ${response.data.data.chunks.length}**\n**Source:** ${source}\n${thisChunk}`
      }
      
      return ragResult
    } catch (err) {
      console.error('Error in adapters/lightrag.js/getChunksFromLightRAG()')
      throw err
    }
  }
}

export default LightRAGAdapter
