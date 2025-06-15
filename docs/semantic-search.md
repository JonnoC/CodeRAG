# Semantic Code Search Guide

CodeRAG's semantic search feature enables natural language code discovery using AI-powered embeddings. Instead of searching for exact text matches, you can find code by functionality and meaning.

## Overview

Semantic search transforms your code into high-dimensional vectors that capture semantic meaning. This allows you to:

- **🔍 Find by Intent**: Search for "functions that validate email addresses" instead of "email" or "validate"
- **🧠 Discover Similar Code**: Find semantically similar functions, classes, and methods
- **🎯 Understand Functionality**: Locate code that performs specific tasks even with different naming conventions
- **⚡ Enhanced Code Discovery**: Combine semantic similarity with existing graph relationships

## Setup

### Prerequisites

- Neo4j 5.11+ (required for vector index support)
- Embedding provider (see provider-specific setup guides)
- CodeRAG project already scanned

### Provider Setup Guides

Choose your preferred embedding provider:

- **🌐 [OpenAI Setup](semantic-search/openai-setup.md)** - Cloud-based, high quality, requires API key
- **🔒 [Ollama Setup](semantic-search/ollama-setup.md)** - Local, privacy-focused, free after setup
- **🏠 [Custom Endpoints](semantic-search/custom-endpoints.md)** - LLM Studio, Azure OpenAI, enterprise deployments

### Quick Configuration Examples

#### OpenAI (Cloud)
```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
EMBEDDING_MODEL=text-embedding-3-small
```

#### Ollama (Local)
```bash
SEMANTIC_SEARCH_PROVIDER=ollama
EMBEDDING_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://localhost:11434
```

#### LLM Studio (Local with OpenAI API)
```bash
SEMANTIC_SEARCH_PROVIDER=openai
OPENAI_API_KEY=not-needed
OPENAI_BASE_URL=http://localhost:1234/v1
EMBEDDING_MODEL=text-embedding-3-small
```

### Initialize and Generate Embeddings

After configuring your provider:

1. **Initialize vector indexes:**
   ```bash
   npm run build
   node build/index.js --tool initialize_semantic_search
   ```

2. **Generate embeddings for existing code:**
   ```bash
   node build/index.js --tool update_embeddings --project-id your-project
   ```

### Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `SEMANTIC_SEARCH_PROVIDER` | Embedding provider | `disabled` | `openai`, `ollama`, `disabled` |
| `OPENAI_API_KEY` | OpenAI API key | - | Required for OpenAI provider |
| `OPENAI_BASE_URL` | Custom OpenAI endpoint | - | For LLM Studio, Azure OpenAI, etc. |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` | For Ollama provider |
| `EMBEDDING_MODEL` | Model for embeddings | Auto-detected | See provider-specific guides |
| `EMBEDDING_DIMENSIONS` | Vector dimensions | Auto-detected | Provider and model dependent |
| `EMBEDDING_MAX_TOKENS` | Max tokens per text | 8000 | Any positive integer |
| `EMBEDDING_BATCH_SIZE` | Batch processing size | 100 | 1-1000 |
| `SIMILARITY_THRESHOLD` | Minimum similarity score | 0.7 | 0.0-1.0 |

## Available Tools

### 1. semantic_search

Search for code using natural language queries.

**Parameters:**
- `query` (required): Natural language description of functionality
- `project_id` (optional): Limit search to specific project
- `node_types` (optional): Filter by code entity types
- `limit` (optional): Maximum results (default: 10)
- `similarity_threshold` (optional): Minimum similarity score
- `include_graph_context` (optional): Include related entities in results
- `max_hops` (optional): Maximum relationship hops for context

**Examples:**
```javascript
// Basic search
{
  "query": "functions that validate email addresses",
  "project_id": "my-web-app",
  "limit": 5
}

// Search with filters
{
  "query": "classes that handle user authentication",
  "node_types": ["class", "interface"],
  "similarity_threshold": 0.8
}

// Search with graph context
{
  "query": "database connection management",
  "include_graph_context": true,
  "max_hops": 2
}
```

### 2. get_similar_code

Find code entities semantically similar to a specific node.

**Parameters:**
- `node_id` (required): ID of the reference code entity
- `project_id` (required): Project containing the reference node
- `limit` (optional): Maximum results (default: 5)

**Example:**
```javascript
{
  "node_id": "UserValidator.validateEmail",
  "project_id": "my-web-app",
  "limit": 10
}
```

### 3. update_embeddings

Generate or refresh embeddings for code entities.

**Parameters:**
- `project_id` (optional): Limit to specific project
- `node_types` (optional): Filter by entity types

**Examples:**
```javascript
// Update all embeddings
{}

// Update specific project
{
  "project_id": "my-web-app"
}

// Update only functions and methods
{
  "node_types": ["function", "method"]
}
```

### 4. initialize_semantic_search

Set up vector indexes and semantic search infrastructure.

**Parameters:** None

**Usage:**
Run once per database to initialize vector search capabilities.

## Usage Examples

### Finding Validation Functions

**Query:**
```
"Find all functions that validate user input data"
```

**What it finds:**
- `validateEmail(email: string)`
- `checkPasswordStrength(password: string)`
- `sanitizeUserInput(input: any)`
- `isValidPhoneNumber(phone: string)`

### Discovering Authentication Code

**Query:**
```
"Show me classes that handle user authentication and login"
```

**What it finds:**
- `AuthService`
- `LoginController` 
- `UserAuthenticator`
- `JwtTokenValidator`

### Finding Database Operations

**Query:**
```
"Functions that interact with database or perform CRUD operations"
```

**What it finds:**
- `UserRepository.save()`
- `DatabaseConnection.execute()`
- `OrderService.createOrder()`
- `ProductDAO.findById()`

### Similar Code Discovery

```javascript
// Find code similar to a specific authentication method
{
  "tool": "get_similar_code",
  "node_id": "AuthService.authenticateUser",
  "project_id": "my-app"
}
```

**Results might include:**
- `LoginService.verifyCredentials()`
- `UserValidator.checkPermissions()`
- `TokenService.validateToken()`

## Best Practices

### 1. Writing Effective Queries

**Good queries:**
- `"functions that validate email addresses"`
- `"classes that handle file uploads"`
- `"methods that process payment transactions"`
- `"utilities for string manipulation"`

**Less effective queries:**
- `"email"` (too vague)
- `"UserService"` (specific naming, use regular search)
- `"function"` (too generic)

### 2. Optimizing Performance

- **Batch Updates**: Update embeddings for entire projects rather than individual files
- **Appropriate Thresholds**: Use similarity threshold 0.6-0.8 for best results
- **Selective Updates**: Only update embeddings for relevant entity types (classes, methods, functions)

### 3. Managing Costs

- **Choose Right Model**: `text-embedding-3-small` offers good performance at lower cost
- **Filter Entity Types**: Focus embeddings on important code entities
- **Batch Processing**: Process multiple entities together to reduce API calls

## Integration with AI Assistants

### Claude Code Integration

When using CodeRAG with Claude Code, semantic search provides enhanced code understanding:

```
User: "Find all the validation functions in my codebase"
Assistant: I'll search for validation functions using semantic search.
[Uses semantic_search tool with query="validation functions"]
```

### Custom Workflows

Combine semantic search with other CodeRAG tools:

1. **Discovery → Analysis**:
   ```
   semantic_search → calculate_ck_metrics → find_architectural_issues
   ```

2. **Similarity → Refactoring**:
   ```
   get_similar_code → analyze duplicate functionality → suggest refactoring
   ```

## Troubleshooting

### Common Issues

**No results returned:**
- Check if embeddings are generated: `update_embeddings`
- Lower similarity threshold
- Try broader query terms

**Poor quality results:**
- Increase similarity threshold
- Use more specific queries
- Ensure embeddings are up to date

**Slow performance:**
- Check Neo4j vector index status
- Reduce batch size for embedding generation
- Consider using smaller embedding model

### Debugging Commands

```bash
# Check embedding status
node build/index.js --tool search_nodes --query "embedding"

# Regenerate embeddings
node build/index.js --tool update_embeddings --project-id your-project

# Test basic search
node build/index.js --tool semantic_search --query "test function"
```

## Cost Considerations

### OpenAI API Costs

Embedding costs depend on:
- **Text volume**: ~$0.0001 per 1K tokens for text-embedding-3-small
- **Entity count**: Typical project: 1000-5000 entities
- **Update frequency**: Initial scan + periodic updates

**Example costs:**
- Small project (1K entities): ~$0.50-2.00 one-time
- Medium project (5K entities): ~$2.50-10.00 one-time  
- Large project (20K entities): ~$10.00-40.00 one-time

### Cost Optimization

1. **Selective Scanning**: Only embed important entity types
2. **Incremental Updates**: Update only changed entities
3. **Model Selection**: Use `text-embedding-3-small` vs `text-embedding-3-large`
4. **Batch Processing**: Maximize batch sizes to reduce API overhead

## Advanced Features

### Hybrid Search

Combine semantic search with graph traversal:

```javascript
{
  "query": "user authentication functions",
  "include_graph_context": true,
  "max_hops": 2
}
```

This finds semantically relevant code AND related entities within 2 relationship hops.

### Multi-Project Search

Search across multiple projects simultaneously:

```javascript
{
  "query": "error handling patterns",
  // No project_id = search all projects
  "limit": 20
}
```

### Custom Similarity Thresholds

Adjust precision vs recall:

- **High precision** (0.8+): Very similar results, fewer matches
- **Balanced** (0.7): Good quality, reasonable quantity  
- **High recall** (0.5-0.6): More matches, potentially less relevant

## Future Enhancements

Coming soon:
- **Local embedding models** for privacy-focused deployments
- **Code-specific embedding models** trained on programming languages
- **Semantic code comparison** for refactoring suggestions
- **Integration with code review workflows**