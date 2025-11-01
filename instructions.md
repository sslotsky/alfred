Perfect! Let me update the server to use Ollama
instead.Perfect! Updated to use Ollama. Here's what changed:

**🔧 Setup:**

1. **Install Ollama** (if you haven't):

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

2. **Pull a model**:

```bash
ollama pull llama3
# or try: llama3.1, mistral, qwen2.5, etc.
```

3. **Install dependencies**:

```bash
npm install @modelcontextprotocol/sdk
```

4. **Run it**:

```bash
node server.js
```

**⚙️ Configuration:** You can customize via environment
variables:

```bash
export OLLAMA_API_URL=http://localhost:11434  # default
export OLLAMA_MODEL=llama3  # or mistral, qwen2.5, etc.
```

The server now calls your local Ollama instance instead of
the Anthropic API - completely private and free! 🎉
