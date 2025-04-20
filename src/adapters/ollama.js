/*
  This file is the adapter for the ollama API.
  It is responsible for sending requests to the ollama API and receiving responses.
*/

// Public npm libraries
import { Ollama } from 'ollama'

// Local libraries
import config from '../../config/index.js'

class OllamaAdapter {
  constructor () {
    // Encapsulate dependencies
    this.ollama = new Ollama({
      host: config.ollamaUrl
    })
  }

  async promptLlm (prompt) {
    const response = await this.ollama.chat({
      model: config.ollamaModel,
      messages: [{ role: 'user', content: prompt }]
    })
    console.log('Ollama response:', response)

    return response.message.content
  }
}

export default OllamaAdapter
