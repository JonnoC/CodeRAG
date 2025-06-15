# Ollama Provider Setup Guide

This guide shows how to set up CodeRAG's semantic search with Ollama for privacy-focused, local embedding generation.

## Overview

The Ollama provider enables local semantic search without sending your code to external services. This approach:

- **🔒 Privacy-First**: Code never leaves your machine
- **💰 Cost-Free**: No API charges after initial setup
- **⚡ Performance**: Direct hardware utilization
- **🌐 Offline**: Works without internet connection

## Prerequisites

- **Ollama installed**: [Download from ollama.ai](https://ollama.ai)
- **Neo4j 5.11+**: Vector index support required
- **Sufficient RAM**: 4GB+ recommended for embedding models

## Installation Steps

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Linux (curl install)
curl -fsSL https://ollama.ai/install.sh | sh

# Windows - Download from ollama.ai
```

### 2. Start Ollama Service

```bash
# Start Ollama server (runs on http://localhost:11434 by default)
ollama serve
```

### 3. Download Embedding Model

```bash
# Recommended: Nomic Embed Text (768 dimensions, optimized for code)
ollama pull nomic-embed-text

# Alternative: MxBai Embed Large (1024 dimensions, higher quality)
ollama pull mxbai-embed-large

# Verify model installation
ollama list
```

### 4. Configure CodeRAG

Add to your `.env` file:

```bash
# Ollama Provider Configuration
SEMANTIC_SEARCH_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text

# Optional: Custom Ollama URL (if not using default)
OLLAMA_BASE_URL=http://localhost:11434

# Auto-detected dimensions (nomic-embed-text: 768, mxbai-embed-large: 1024)
# EMBEDDING_DIMENSIONS=768
```

### 5. Initialize and Generate Embeddings

```bash
# Initialize vector indexes
npm run build
node build/index.js --tool initialize_semantic_search

# Generate embeddings for your project
node build/index.js --tool update_embeddings --project-id your-project
```

## Supported Models

| Model | Dimensions | Memory | Quality | Use Case |
|-------|------------|--------|---------|----------|
| `nomic-embed-text` | 768 | ~1.5GB | High | General code search, balanced performance |
| `mxbai-embed-large` | 1024 | ~2.2GB | Higher | Detailed semantic understanding |

## Configuration Examples

### Basic Setup
```bash
SEMANTIC_SEARCH_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
```

### Custom Ollama Server
```bash
SEMANTIC_SEARCH_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### Performance Tuning
```bash
SEMANTIC_SEARCH_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_BATCH_SIZE=50          # Reduce for lower memory usage
EMBEDDING_MAX_TOKENS=4000        # Adjust based on model limits
```

## Usage

Once configured, use semantic search tools normally:

```bash
# Natural language search
node build/index.js --tool semantic_search --query "functions that validate email addresses"

# Find similar code
node build/index.js --tool get_similar_code --node-id "your-function-id" --limit 5
```

## Performance Optimization

### Hardware Recommendations
- **RAM**: 8GB+ for optimal performance
- **CPU**: Multi-core preferred for batch processing
- **Storage**: SSD for faster model loading

### Batch Processing
```bash
# Reduce batch size for memory-constrained systems
EMBEDDING_BATCH_SIZE=25

# Increase for powerful hardware
EMBEDDING_BATCH_SIZE=100
```

### Model Selection
- **Small projects**: Use `nomic-embed-text` for fast processing
- **Large codebases**: Consider `mxbai-embed-large` for better quality
- **Memory limited**: Stick with `nomic-embed-text`

## Troubleshooting

### Ollama Not Responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Restart Ollama service
pkill ollama
ollama serve
```

### Model Not Found
```bash
# List available models
ollama list

# Pull missing model
ollama pull nomic-embed-text
```

### Memory Issues
```bash
# Reduce batch size in .env
EMBEDDING_BATCH_SIZE=10

# Or use smaller model
EMBEDDING_MODEL=nomic-embed-text  # Instead of mxbai-embed-large
```

### Connection Errors
```bash
# Verify Ollama URL in .env
OLLAMA_BASE_URL=http://localhost:11434

# Check firewall settings if using remote Ollama
```

## Comparison with Other Providers

| Aspect | Ollama | OpenAI |
|--------|--------|--------|
| **Privacy** | ✅ Complete | ❌ External API |
| **Cost** | ✅ Free | ❌ Pay per use |
| **Setup** | 🟡 Moderate | ✅ Simple |
| **Performance** | 🟡 Local hardware | ✅ Optimized |
| **Quality** | 🟡 Good | ✅ Excellent |

## Next Steps

- [Semantic Search Usage Guide](../semantic-search.md)
- [Performance Optimization](performance-guide.md) *(coming soon)*
- [Custom Endpoint Configuration](custom-endpoints.md) *(coming soon)*
- [Troubleshooting Guide](../troubleshooting.md)