# Ben AI v3

This is my third major attempt at trying to create a tech-support chat bot. The goal is to create a system with the following subcomponents:
- Telegram interface for chat (this repository)
- RAG Database with semantic text search ([chroma-rag](https://github.com/christroutner/chroma-rag))
- Web search query and HTML to Markdown conversion.
- Ollama API interface for LLM inference

The RAG database will be loaded with information about Bitcoin, JavaScript, and all the code bases I've created (like the [Cash Stack](https://cashstack.info)). People should be able to ask it for detailed answers and code examples about all that code.

This repository is forked from [ipfs-service-provider](https://github.com/Permissionless-Software-Foundation/ipfs-service-provider). It creates a REST API server that also functions as Telegram bot. It also provides a central piece of software upon which the other features can be built.

## License
MIT

