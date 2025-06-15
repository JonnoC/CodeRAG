# Installation & Setup Guide

This guide covers the prerequisites, installation, and configuration of CodeRAG.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Neo4J Database**: Version 5.11 or higher (required for vector indexes and semantic search)
- **Git**: For cloning the repository

## Installation

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/JonnoC/CodeRAG.git
cd CodeRAG

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Neo4j Database Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Project Configuration
PROJECT_ISOLATION_STRATEGY=shared_db
DEFAULT_PROJECT_ID=default
CROSS_PROJECT_ANALYSIS=false
MAX_PROJECTS_SHARED_DB=100

# Semantic Search Configuration (Optional)
# Options: openai, local, disabled
SEMANTIC_SEARCH_PROVIDER=disabled

# OpenAI Configuration (required if SEMANTIC_SEARCH_PROVIDER=openai)
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Embedding Model Configuration
# EMBEDDING_MODEL=text-embedding-3-small
# EMBEDDING_MAX_TOKENS=8000
# EMBEDDING_BATCH_SIZE=100
# SIMILARITY_THRESHOLD=0.7

# Optional: Server configuration
SERVER_PORT=3000
LOG_LEVEL=info
```

### Semantic Search Setup (Optional)

To enable semantic code search with natural language queries:

1. **Get an OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Update your `.env` file:**
   ```env
   SEMANTIC_SEARCH_PROVIDER=openai
   OPENAI_API_KEY=sk-your-openai-api-key-here
   EMBEDDING_MODEL=text-embedding-3-small
   ```

3. **Ensure Neo4j 5.11+** for vector index support (required for semantic search)

4. **Initialize semantic search** after first project scan:
   ```bash
   npm run build
   node build/index.js --tool initialize_semantic_search
   ```

For detailed semantic search configuration, see the [Semantic Search Guide](semantic-search.md).

## Neo4J Database Setup

CodeRAG requires a running Neo4J instance. Here are several setup options:

### Option 1: Neo4J Desktop (Recommended for Development)

1. Download [Neo4J Desktop](https://neo4j.com/download/)
2. Install and create a new project
3. Create a new database with:
   - Name: `coderag` (or your preference)
   - Password: Set a secure password
   - Version: 5.11+
4. Start the database
5. Note the connection details (usually `bolt://localhost:7687`)

### Option 2: Docker

```bash
# Run Neo4J in Docker
docker run \
    --name neo4j-coderag \
    -p 7474:7474 -p 7687:7687 \
    -d \
    -v $HOME/neo4j/data:/data \
    -v $HOME/neo4j/logs:/logs \
    -v $HOME/neo4j/import:/var/lib/neo4j/import \
    -v $HOME/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/your_password \
    neo4j:5.12
```

### Option 3: Neo4J AuraDB (Cloud)

1. Sign up at [Neo4J Aura](https://neo4j.com/cloud/aura/)
2. Create a free instance
3. Note the connection URI and credentials
4. Update your `.env` file with the cloud connection details

## Running CodeRAG

CodeRAG supports two modes of operation:

### STDIO Mode (Default - for MCP Clients)

This mode is used when integrating with MCP-compatible AI tools:

```bash
# Start in STDIO mode
npm start

# Or use the built version
npm run start:built
```

### HTTP/SSE Mode (for HTTP API access)

This mode provides an HTTP endpoint for web-based access:

```bash
# Start HTTP server on port 3000
npm start -- --sse --port 3000

# Or specify a different port
npm start -- --sse --port 8080
```

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Verification

To verify your installation:

1. **Test Neo4J Connection**: Ensure your Neo4J instance is running and accessible
2. **Build Success**: Run `npm run build` without errors
3. **STDIO Mode**: Run `npm start` and verify it starts without connection errors
4. **HTTP Mode**: Run `npm start -- --sse --port 3000` and visit `http://localhost:3000/health`

## Next Steps

- [Integration with AI Tools](ai-integration.md) - Connect CodeRAG to your preferred AI assistant
- [Scanner Usage](scanner-usage.md) - Learn how to scan your codebase
- [Multi-Project Management](multi-project-management.md) - Manage multiple codebases
