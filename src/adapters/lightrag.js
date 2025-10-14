/*
  Adapter library for the LightRAG API.
*/

// Public npm libraries
import axios from 'axios'

// Local libraries
import config from '../../config/index.js'

class LightRAGAdapter {
  // constructor () {
  //   // Encapsulate dependencies
  // }

  async queryLightRAG (prompt) {
    try {
      // console.log('queryLightRAG() config: ', config)

      const url = `${config.ragUrl}/query`
      console.log('url: ', url)

      const response = await axios.post(url, {
        query: prompt,
        mode: 'mix'
      })
      // console.log('response: ', response.data)
      return response.data.response
    } catch (err) {
      console.error('Error in adapters/lightrag.js/queryLightRAG()')
      throw err
    }
  }
}

export default LightRAGAdapter
