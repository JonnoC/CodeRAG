# OpenAI Provider Setup Guide

This guide shows how to configure CodeRAG's semantic search with OpenAI's embedding API for high-quality, cloud-based semantic search.

## Overview

The OpenAI provider offers:

- **🏆 Highest Quality**: State-of-the-art embedding models
- **⚡ Fast Processing**: Optimized cloud infrastructure  
- **🔄 Easy Setup**: Simple API key configuration
- **📈 Scalable**: Handles large codebases efficiently

## Prerequisites

- **OpenAI Account**: Sign up at [openai.com](https://openai.com)
- **API Key**: Generated from OpenAI dashboard
- **Neo4j 5.11+**: Vector index support required
- **CodeRAG Project**: Already scanned into Neo4j

## Setup Steps

### 1. Get OpenAI API Key

1. **Create Account**: Visit [platform.openai.com](https://platform.openai.com)
2. **Generate API Key**: Go to API Keys section
3. **Set Usage Limits**: Configure spending limits for safety
4. **Copy Key**: Save the key securely (starts with `sk-`)

### 2. Configure CodeRAG

Add to your `.env` file:

```bash
# OpenAI Provider Configuration
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here

# Model Selection (optional - defaults to text-embedding-3-small)
EMBEDDING_MODEL=text-embedding-3-small

# Processing Configuration (optional)
EMBEDDING_BATCH_SIZE=100
EMBEDDING_MAX_TOKENS=8000
SIMILARITY_THRESHOLD=0.7
```

### 3. Initialize Vector Indexes

```bash
# Build the project
npm run build

# Initialize Neo4j vector indexes
node build/index.js --tool initialize_semantic_search
```

### 4. Generate Embeddings

```bash
# Generate embeddings for your project
node build/index.js --tool update_embeddings --project-id your-project

# Or update embeddings for all projects
node build/index.js --tool update_embeddings
```

## Model Selection

### Available Models

| Model | Dimensions | Cost | Quality | Best For |
|-------|------------|------|---------|----------|
| `text-embedding-3-small` | 1536 | Lower | Very Good | General use, cost-effective |
| `text-embedding-3-large` | 3072 | Higher | Excellent | High-precision requirements |
| `text-embedding-ada-002` | 1536 | Medium | Good | Legacy compatibility |

### Recommendations

#### For Most Projects
```bash
EMBEDDING_MODEL=text-embedding-3-small
```
- **Cost-effective**: ~5x cheaper than large model
- **Fast processing**: Lower token consumption
- **Excellent quality**: Suitable for most code search tasks

#### For Large Enterprise Codebases
```bash
EMBEDDING_MODEL=text-embedding-3-large
```
- **Highest quality**: Better semantic understanding
- **Complex code**: Better at understanding intricate relationships
- **Critical applications**: When search quality is paramount

#### For Legacy Compatibility
```bash
EMBEDDING_MODEL=text-embedding-ada-002
```
- **Proven stability**: Well-tested model
- **Consistent results**: Predictable behavior
- **Migration path**: Easy upgrade to newer models

## Configuration Options

### Basic Configuration
```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-3-small
```

### Performance Tuning
```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-3-small

# Optimize for speed
EMBEDDING_BATCH_SIZE=100        # Max batch size
EMBEDDING_MAX_TOKENS=8000       # Max tokens per request

# Adjust similarity threshold
SIMILARITY_THRESHOLD=0.7        # 0.6-0.8 recommended range
```

### Cost Optimization
```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
EMBEDDING_MODEL=text-embedding-3-small  # Most cost-effective

# Reduce batch size to control costs
EMBEDDING_BATCH_SIZE=50
EMBEDDING_MAX_TOKENS=4000

# Higher threshold = fewer results = lower query costs
SIMILARITY_THRESHOLD=0.8
```

## Usage Examples

### Basic Semantic Search
```bash
# Find functions that validate input
node build/index.js --tool semantic_search --query "validate user input"

# Search for error handling code
node build/index.js --tool semantic_search --query "error handling exception logging"
```

### Advanced Queries
```bash
# Find similar code to a specific function
node build/index.js --tool get_similar_code --node-id "myapp:UserService.validateEmail" --limit 5

# Search within specific node types
node build/index.js --tool semantic_search --query "authentication" --node-types "Method,Function"

# Project-specific search
node build/index.js --tool semantic_search --query "database connection" --project-id "backend-api"
```

## Cost Management

### Understanding Costs

OpenAI charges per token processed:

- **text-embedding-3-small**: $0.00002 / 1K tokens
- **text-embedding-3-large**: $0.00013 / 1K tokens
- **text-embedding-ada-002**: $0.00010 / 1K tokens

### Cost Estimation

For a typical TypeScript project:

```
Medium project (50k lines): ~$2-5 for initial embeddings
Large project (200k lines): ~$8-20 for initial embeddings
Enterprise (1M lines): ~$40-100 for initial embeddings
```

### Cost Optimization Strategies

1. **Use Smaller Model**: `text-embedding-3-small` for most use cases
2. **Batch Processing**: Max batch size for efficiency
3. **Selective Updates**: Only update changed code
4. **Token Limits**: Set appropriate `EMBEDDING_MAX_TOKENS`

```bash
# Cost-optimized configuration
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=100
EMBEDDING_MAX_TOKENS=4000
```

## Performance Optimization

### Batch Processing
```bash
# Optimize batch size based on project size
EMBEDDING_BATCH_SIZE=100  # Large projects
EMBEDDING_BATCH_SIZE=50   # Medium projects  
EMBEDDING_BATCH_SIZE=25   # Small projects or rate limiting
```

### Token Management
```bash
# Balance quality vs cost
EMBEDDING_MAX_TOKENS=8000   # High quality, higher cost
EMBEDDING_MAX_TOKENS=4000   # Balanced
EMBEDDING_MAX_TOKENS=2000   # Cost-optimized
```

### API Rate Limits

OpenAI has rate limits that may affect large projects:

- **Tier 1**: 3 RPM, 40k TPM
- **Tier 2**: 3,500 RPM, 90k TPM  
- **Tier 3+**: Higher limits based on usage

## Troubleshooting

### API Key Issues
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check key format (should start with sk-)
echo $OPENAI_API_KEY
```

### Rate Limiting
```bash
# Reduce batch size if rate limited
EMBEDDING_BATCH_SIZE=25

# Error: "Rate limit exceeded"
# Solution: Wait and retry, or upgrade OpenAI tier
```

### Model Not Found
```bash
# Verify model name
EMBEDDING_MODEL=text-embedding-3-small  # Correct
EMBEDDING_MODEL=text-embedding-small     # Incorrect

# List available models
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### Connection Issues
```bash
# Check network connectivity
curl https://api.openai.com/v1/models

# Verify firewall settings
# Check proxy configuration if behind corporate firewall
```

## Security Best Practices

### API Key Security
- **Environment Variables**: Never commit keys to code
- **Secure Storage**: Use secure secret management
- **Key Rotation**: Rotate keys regularly
- **Minimal Permissions**: Use API keys with minimal required scope

### Data Privacy
- **Code Transmission**: Your code is sent to OpenAI for embedding
- **Data Retention**: Review OpenAI's data usage policies
- **Sensitive Code**: Consider local alternatives for highly sensitive code

### Network Security
- **HTTPS Only**: OpenAI API uses HTTPS by default
- **Corporate Proxies**: Configure proxy settings if required
- **Firewall Rules**: Allow outbound HTTPS to api.openai.com

## Next Steps

- [Custom Endpoints Guide](custom-endpoints.md) - For LLM Studio, Azure OpenAI
- [Ollama Setup Guide](ollama-setup.md) - For local, privacy-focused alternative
- [Performance Guide](performance-guide.md) *(coming soon)*
- [Main Semantic Search Documentation](../semantic-search.md)

## Comparison with Other Providers

| Feature | OpenAI | Ollama |
|---------|--------|--------|
| **Quality** | ✅ Excellent | 🟡 Good |
| **Setup** | ✅ Simple | 🟡 Moderate |
| **Cost** | ❌ Pay per use | ✅ Free |
| **Privacy** | ❌ External API | ✅ Local |
| **Performance** | ✅ Fast | 🟡 Hardware dependent |
| **Reliability** | ✅ High | 🟡 Good |