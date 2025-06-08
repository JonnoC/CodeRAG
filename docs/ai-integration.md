# AI Tool Integration Guide

CodeRAG integrates with AI coding assistants through two connection methods:

## 🌟 SSE Mode (Recommended)
**Full MCP tools + REST API + Web-friendly**
- All 24 MCP tools via HTTP Server-Sent Events
- Additional REST API endpoints for direct access
- Works with web-based tools and modern MCP clients
- Better for production deployments

## STDIO Mode  
**Traditional MCP via stdin/stdout**
- Direct process communication
- Simpler for basic setups
- Limited to command-line MCP clients

---

## Quick Start with Claude Code

### SSE Mode (Recommended)

**Step 1: Start CodeRAG Server**
```bash
npm start -- --sse --port 3000
```

**Step 2: Configure Claude Code**

Add to your MCP configuration file:
- **macOS/Linux:** `~/.claude/mcp_servers.json`
- **Windows:** `%APPDATA%\Claude\mcp_servers.json`

```json
{
  "mcpServers": {
    "coderag": {
      "url": "http://localhost:3000/sse",
      "transport": "sse",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

**Step 3: Restart Claude Code**

Test the connection:
```
Use the get_project_summary tool to show me an overview of my codebase.
```

### STDIO Mode (Alternative)

**Step 1: Configure Claude Code**
```json
{
  "mcpServers": {
    "coderag": {
      "command": "node",
      "args": ["/path/to/CodeRAG/build/index.js"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

**Step 2: Restart Claude Code**

---

## Tool Integration by Platform

### Windsurf

**SSE Mode (Recommended)**
1. Start CodeRAG: `npm start -- --sse --port 3000`
2. Configure Windsurf MCP settings:
```json
{
  "servers": {
    "coderag": {
      "url": "http://localhost:3000/sse",
      "transport": "sse",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

**STDIO Mode (Alternative)**
```json
{
  "servers": {
    "coderag": {
      "command": "node",
      "args": ["/path/to/CodeRAG/build/index.js"],
      "cwd": "/path/to/CodeRAG",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

### Cursor

**SSE Mode (Recommended)**
1. Start CodeRAG: `npm start -- --sse --port 3000`
2. Configure Cursor MCP settings:
```json
{
  "mcpServers": {
    "coderag": {
      "url": "http://localhost:3000/sse",
      "transport": "sse",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

**STDIO Mode (Alternative)**
```json
{
  "mcpServers": {
    "coderag": {
      "command": "node",
      "args": ["/path/to/CodeRAG/build/index.js"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your_password"
      }
    }
  }
}
```

### VS Code (Native MCP Support)

VS Code now supports MCP servers natively without requiring Continue.dev or other extensions.

> **Requirements:** VS Code version 1.99+ (March 2025) with GitHub Copilot extension

**SSE Mode (Recommended)**
1. Start CodeRAG: `npm start -- --sse --port 3000`
2. Create `.vscode/mcp.json` in your workspace:
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "neo4j-password",
      "description": "Neo4J Database Password",
      "password": true
    }
  ],
  "servers": {
    "coderag": {
      "type": "sse",
      "url": "http://localhost:3000/sse",
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "${input:neo4j-password}"
      }
    }
  }
}
```

**STDIO Mode (Alternative)**
Create `.vscode/mcp.json` in your workspace:
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "neo4j-password",
      "description": "Neo4J Database Password",
      "password": true
    }
  ],
  "servers": {
    "coderag": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/CodeRAG/build/index.js"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "${input:neo4j-password}"
      }
    }
  }
}
```

**User Settings (Global Configuration)**
Alternatively, add to your VS Code user settings (`settings.json`):
```json
{
  "mcp": {
    "servers": {
      "coderag": {
        "type": "sse",
        "url": "http://localhost:3000/sse",
        "env": {
          "NEO4J_URI": "bolt://localhost:7687",
          "NEO4J_USER": "neo4j",
          "NEO4J_PASSWORD": "your_password"
        }
      }
    }
  }
}
```

**Automatic Discovery (Optional)**
VS Code can automatically discover MCP servers from other tools:
1. Enable: `"chat.mcp.discovery.enabled": true` in settings
2. VS Code will find servers configured in Claude Desktop and other MCP clients

**Using CodeRAG in VS Code**
1. Open GitHub Copilot Chat
2. Use the **MCP: List Servers** command to verify CodeRAG is connected
3. Start using CodeRAG tools: "Use CodeRAG to analyze my project structure"

---

## Available Tools & Endpoints

### MCP Tools (24 Available)
When connected via MCP (SSE or STDIO), you get access to all CodeRAG tools:

**Core Analysis:**
- `get_project_summary` - Project overview and metrics
- `scan_dir` - Scan codebase and populate graph
- `find_architectural_issues` - Detect design problems

**Code Structure:**
- `search_nodes` - Find classes, methods, interfaces
- `find_nodes_by_type` - Filter by entity type
- `get_inheritance_hierarchy` - Class inheritance chains

**Quality Metrics:**
- `calculate_ck_metrics` - Class complexity metrics
- `calculate_package_metrics` - Package design metrics
- `find_deprecated_code` - Locate deprecated elements

**Framework Analysis:**
- `find_nodes_by_annotation` - Find annotated code
- `get_framework_usage` - Framework usage statistics
- `analyze_testing_annotations` - Test coverage analysis

### REST API Endpoints (SSE Mode Only)
Direct HTTP access when using SSE mode:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/metrics/summary` | Project summary |
| GET | `/api/metrics/issues` | Architectural issues |
| GET | `/api/nodes?type=class` | Find classes |
| GET | `/api/nodes?search=UserService` | Search entities |
| POST | `/api/parse/directory` | Scan codebase |

**Example REST Usage:**
```bash
# Get project summary
curl http://localhost:3000/api/metrics/summary

# Scan current directory
curl -X POST http://localhost:3000/api/parse/directory \
  -H "Content-Type: application/json" \
  -d '{
    "project": "my-project",
    "directory_path": ".",
    "clear_existing": true
  }'
```

---

## Environment Configuration

Both modes require these environment variables:

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

Set them either:
1. In your shell: `export NEO4J_PASSWORD=yourpassword`
2. In a `.env` file in the CodeRAG directory
3. In the MCP configuration (as shown above)

---

## Troubleshooting

### Common Issues

**"Neo4J connection failed"**
- Verify Neo4J is running: `docker ps` or check Neo4J Desktop
- Test connection: `curl http://localhost:7474`
- Check credentials in configuration

**"CodeRAG tools not available"**
- Restart your MCP client after configuration changes
- Check the MCP configuration file path
- Verify CodeRAG server is running (SSE mode)
- VS Code: Use **MCP: List Servers** command to verify connection
- VS Code: Ensure GitHub Copilot extension is enabled

**"Port already in use" (SSE mode)**
- Change port: `npm start -- --sse --port 3001`
- Update configurations to use the new port

### Getting Help

1. Check server logs for error messages
2. Test with basic tools like `get_project_summary`
3. Verify Neo4J database has data (scan a project first)

---

## Next Steps

- **[Scanner Usage](scanner-usage.md)** - Learn how to scan your codebase
- **[Available Tools](available-tools.md)** - Explore all CodeRAG tools
- **[MCP Prompts Guide](mcp-prompts.md)** - Use guided prompts for effective analysis