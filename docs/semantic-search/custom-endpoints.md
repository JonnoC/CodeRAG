# Custom OpenAI Endpoint Configuration

This guide explains how to configure CodeRAG to work with OpenAI-compatible APIs, including LLM Studio, Azure OpenAI, and other local or enterprise deployments.

## Overview

Many services provide OpenAI-compatible APIs that can be used with CodeRAG's semantic search:

- **🏠 LLM Studio**: Local OpenAI-compatible server
- **☁️ Azure OpenAI**: Microsoft's enterprise OpenAI service
- **🔧 Ollama with OpenAI compatibility**: Using Ollama's OpenAI-compatible endpoint
- **🏢 Enterprise deployments**: Custom organizational OpenAI proxies

## Supported Endpoints

### LLM Studio
Local LLM serving with OpenAI API compatibility.

```bash
# Download and run LLM Studio
# Default endpoint: http://localhost:1234/v1

SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=not-needed
OPENAI_BASE_URL=http://localhost:1234/v1
EMBEDDING_MODEL=text-embedding-3-small
```

### Azure OpenAI
Microsoft's enterprise OpenAI service.

```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=your-azure-api-key
OPENAI_BASE_URL=https://your-resource.openai.azure.com
EMBEDDING_MODEL=text-embedding-3-small
```

### Ollama with OpenAI Compatibility
Ollama can serve an OpenAI-compatible endpoint.

```bash
# Start Ollama with OpenAI compatibility
ollama serve --port 11434

SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
EMBEDDING_MODEL=nomic-embed-text
```

### Enterprise Proxy
Custom organizational OpenAI proxy or gateway.

```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=your-enterprise-key
OPENAI_BASE_URL=https://openai-proxy.yourcompany.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## Configuration Steps

### 1. Identify Your Endpoint

Determine the base URL and authentication requirements for your service:

- **LLM Studio**: Usually `http://localhost:1234/v1`
- **Azure OpenAI**: `https://YOUR-RESOURCE.openai.azure.com`
- **Custom proxy**: Provided by your administrator

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Required: Set provider to openai
SEMANTIC_SEARCH_PROVIDER=openai

# Required: API key (may be placeholder for some services)
OPENAI_API_KEY=your-api-key-here

# Required: Custom base URL
OPENAI_BASE_URL=https://your-custom-endpoint.com/v1

# Required: Model name (must be supported by endpoint)
EMBEDDING_MODEL=text-embedding-3-small
```

### 3. Verify Model Compatibility

Ensure your endpoint supports embedding models:

```bash
# Test endpoint connectivity (replace URL)
curl -H "Authorization: Bearer your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"model": "text-embedding-3-small", "input": "test"}' \
     https://your-endpoint.com/v1/embeddings
```

### 4. Initialize and Test

```bash
# Build and initialize
npm run build
node build/index.js --tool initialize_semantic_search

# Test with a small embedding generation
node build/index.js --tool update_embeddings --project-id test --limit 1
```

## Provider-Specific Configurations

### LLM Studio Setup

1. **Install LLM Studio**: Download from [lmstudio.ai](https://lmstudio.ai)
2. **Load embedding model**: Download a supported embedding model
3. **Start server**: Enable "Local Server" with OpenAI compatibility
4. **Configure CodeRAG**:

```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://localhost:1234/v1
EMBEDDING_MODEL=text-embedding-3-small  # Or whatever model you loaded
```

### Azure OpenAI Setup

1. **Create Azure OpenAI resource**: Through Azure portal
2. **Deploy embedding model**: Deploy text-embedding-3-small or similar
3. **Get credentials**: Note API key and endpoint URL
4. **Configure CodeRAG**:

```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=your-azure-key
OPENAI_BASE_URL=https://your-resource.openai.azure.com
EMBEDDING_MODEL=text-embedding-3-small
```

### Local OpenAI Proxy

For organizations running OpenAI proxies:

```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=your-org-api-key
OPENAI_BASE_URL=https://openai.yourcompany.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

## Model Compatibility

### Supported Embedding Models

Most OpenAI-compatible endpoints support these models:

| Model | Dimensions | Best For |
|-------|------------|----------|
| `text-embedding-3-small` | 1536 | General use, cost-effective |
| `text-embedding-3-large` | 3072 | Higher quality, more expensive |
| `text-embedding-ada-002` | 1536 | Legacy, widely supported |

### Custom Models

Some endpoints may provide custom models:

```bash
# Use custom model name
EMBEDDING_MODEL=custom-embedding-model

# May need to specify dimensions manually
EMBEDDING_DIMENSIONS=768
```

## Troubleshooting

### Authentication Issues

```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     $OPENAI_BASE_URL/models

# For Azure, check key format and endpoint
```

### Model Not Found

```bash
# List available models
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     $OPENAI_BASE_URL/models

# Update EMBEDDING_MODEL to match available model
```

### Connection Errors

```bash
# Verify base URL format (must end with /v1 usually)
OPENAI_BASE_URL=https://your-endpoint.com/v1

# Check network connectivity
ping your-endpoint.com
```

### SSL/Certificate Issues

```bash
# For local development with self-signed certificates
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Better: Add proper certificates or use HTTP for local testing
OPENAI_BASE_URL=http://localhost:1234/v1
```

## Security Considerations

### API Key Management
- Store keys securely using environment variables
- Avoid committing keys to version control
- Use key rotation practices

### Network Security
- Use HTTPS endpoints in production
- Implement proper firewall rules
- Consider VPN for sensitive deployments

### Data Privacy
- Understand where your code is being processed
- Review endpoint provider's privacy policies
- Consider on-premises solutions for sensitive code

## Performance Optimization

### Batching
```bash
# Adjust batch size based on endpoint limits
EMBEDDING_BATCH_SIZE=100  # Default
EMBEDDING_BATCH_SIZE=50   # If rate limited
```

### Rate Limiting
```bash
# Some endpoints have different rate limits
EMBEDDING_MAX_TOKENS=8000  # Adjust if needed
```

### Monitoring
- Monitor API usage and costs
- Set up alerts for quota limits
- Track embedding generation performance

## Example Configurations

### Complete LLM Studio Setup
```bash
# .env file for LLM Studio
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=not-required
OPENAI_BASE_URL=http://localhost:1234/v1
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
EMBEDDING_BATCH_SIZE=50
SIMILARITY_THRESHOLD=0.7
```

### Enterprise Azure Setup
```bash
# .env file for Azure OpenAI
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=abc123def456ghi789
OPENAI_BASE_URL=https://mycompany.openai.azure.com
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
EMBEDDING_BATCH_SIZE=100
SIMILARITY_THRESHOLD=0.7
```

## Next Steps

- [Ollama Setup Guide](ollama-setup.md)
- [Performance Guide](performance-guide.md) *(coming soon)*
- [Main Semantic Search Documentation](../semantic-search.md)