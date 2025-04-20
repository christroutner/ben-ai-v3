# Ben AI v3

This is my third major attempt at trying to create a tech-support chat bot. The goal is to create a system with the following subcomponents:
- Telegram interface for chat (this repository)
- RAG Database with semantic text search ([chroma-rag](https://github.com/christroutner/chroma-rag))
- Web search query and HTML to Markdown conversion.
- Ollama API interface for LLM inference

The RAG database will be loaded with information about Bitcoin, JavaScript, and all the code bases I've created (like the [Cash Stack](https://cashstack.info)). People should be able to ask it for detailed answers and code examples about all that code.

This repository is forked from [ipfs-service-provider](https://github.com/Permissionless-Software-Foundation/ipfs-service-provider). It creates a REST API server that also functions as a Telegram bot. It also provides a central piece of software upon which the other features can be built.

## Installation

In order to run your own version of Ben AI, you'll need to run code in several code repositories. The targeted operating system is Ubuntu v20, with node.js v20, Docker, and Docker Compose all installed.

### Ollama

The LLM powering Ben AI is expected to be running locally using [Ollama](https://ollama.com/). So you'll need Ollama running, with the API endpoint exposed, and LLM models downloaded. I am using a GeForce 3060 with 12GB of VRAM. The following LLM models are currently targeted:

- Chat: llama3.1:8b-instruct-q4_K_M
- RAG Semantic text embedding: nomic-embed-text

### Chroma-RAG

The code for the RAG database is in the [chroma-rag repository](https://github.com/christroutner/chroma-rag). See the README in that repository for how to install and run the Docker container.

### RAG Data

The RAG database is populated with a collection of books, code, notes, and other data. The source of this data is stored in the [ben-training-data repository](https://github.com/christroutner/ben-training-data). The code in this repository is only run once, to populate the database during a new installation.

### ben-ai-v3

To install and run this repository:

- `git clone https://github.com/christroutner/ben-ai-v3`
- `cd ben-ai-v3`
- `npm install`
- `npm start`

Edit the `config/env/common.js` file to customize URLs and other settings.


## License
[MIT](./LICENSE.md)

