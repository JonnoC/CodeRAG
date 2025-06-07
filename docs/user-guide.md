# CodeRAG User Guide

CodeRAG is a powerful MCP (Model Context Protocol) Server that creates a graph database representation of your codebase using Neo4J. This enables advanced code analysis, relationship mapping, and AI-powered insights about your code structure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Neo4J Database Setup](#neo4j-database-setup)
4. [Running CodeRAG](#running-coderag)
5. [Integration with AI Tools](#integration-with-ai-tools)
6. [Using the Scanner](#using-the-scanner)
7. [MCP Prompts Guide](#mcp-prompts-guide)
8. [Available Tools](#available-tools)
9. [Code Quality Metrics](#code-quality-metrics)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: Version 18 or higher
- **Neo4J Database**: Version 4.4 or higher
- **Git**: For cloning the repository

## Installation & Setup

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
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Optional: Server configuration
SERVER_PORT=3000
LOG_LEVEL=info
```

## Neo4J Database Setup

CodeRAG requires a running Neo4J instance. Here are several setup options:

### Option 1: Neo4J Desktop (Recommended for Development)

1. Download [Neo4J Desktop](https://neo4j.com/download/)
2. Install and create a new project
3. Create a new database with:
   - Name: `coderag` (or your preference)
   - Password: Set a secure password
   - Version: 4.4+ or 5.x
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

## Integration with AI Tools

CodeRAG integrates with AI coding assistants through two methods:
1. **STDIO Mode** - Direct MCP integration (recommended)
2. **SSE Mode** - HTTP Server-Sent Events for web-based tools

### Claude Code Integration

#### Option 1: STDIO Mode (Recommended)

1. **Create MCP Configuration**

Create or update your Claude Code MCP configuration file:

**On macOS/Linux:** `~/.claude/mcp_servers.json`
**On Windows:** `%APPDATA%\Claude\mcp_servers.json`

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

2. **Restart Claude Code**

After adding the configuration, restart Claude Code to load the MCP server.

3. **Verify Connection**

In Claude Code, you should now see CodeRAG tools available. Test with:
```
Use the get_project_summary tool to show me an overview of my codebase.
```

#### Option 2: SSE Mode (HTTP Integration)

For web-based tools or custom integrations:

1. **Start CodeRAG in SSE Mode**

```bash
# Start HTTP server
npm start -- --sse --port 3000

# The server will be available at http://localhost:3000
```

2. **HTTP API Endpoints**

- **List Tools:** `GET /mcp/tools`
- **Call Tool:** `POST /mcp/tools/{tool_name}`
- **List Prompts:** `GET /mcp/prompts`
- **Get Prompt:** `GET /mcp/prompts/{prompt_name}`
- **Health Check:** `GET /health`

3. **Example HTTP Usage**

```bash
# List available tools
curl http://localhost:3000/mcp/tools

# Get project summary
curl -X POST http://localhost:3000/mcp/tools/get_project_summary \
  -H "Content-Type: application/json" \
  -d '{}'

# Scan a directory
curl -X POST http://localhost:3000/mcp/tools/scan_dir \
  -H "Content-Type: application/json" \
  -d '{
    "directory_path": "/path/to/project",
    "clear_existing": true
  }'
```

4. **JavaScript/Web Integration**

```javascript
// Example web integration
class CodeRAGClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async listTools() {
    const response = await fetch(`${this.baseUrl}/mcp/tools`);
    return response.json();
  }

  async callTool(toolName, params = {}) {
    const response = await fetch(`${this.baseUrl}/mcp/tools/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return response.json();
  }

  async getProjectSummary() {
    return this.callTool('get_project_summary');
  }

  async scanDirectory(path, options = {}) {
    return this.callTool('scan_dir', {
      directory_path: path,
      ...options
    });
  }
}

// Usage
const client = new CodeRAGClient();
const summary = await client.getProjectSummary();
console.log(summary);
```

### Windsurf Integration

#### Option 1: STDIO Mode (Recommended)

1. **Add to Windsurf MCP Config**

Edit your Windsurf MCP configuration:

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

2. **Using with Windsurf**

Once configured, you can ask Windsurf to:
- "Scan my current project with CodeRAG"
- "Show me the inheritance hierarchy for MyClass"
- "Find all architectural issues in this codebase"

#### Option 2: SSE Mode (HTTP Integration)

1. **Start CodeRAG HTTP Server**

```bash
npm start -- --sse --port 3000
```

2. **Configure Windsurf for HTTP**

If Windsurf supports HTTP MCP servers, configure it to connect to:
- **URL:** `http://localhost:3000`
- **Protocol:** Server-Sent Events (SSE)

3. **Manual HTTP Integration**

You can also make direct HTTP calls from Windsurf's terminal or scripts:

```bash
# From Windsurf terminal
curl -X POST http://localhost:3000/mcp/tools/get_project_summary \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Cursor Integration

#### Option 1: STDIO Mode (Recommended)

1. **MCP Configuration for Cursor**

Add to your Cursor MCP settings:

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

#### Option 2: SSE Mode (HTTP Integration)

1. **Start CodeRAG HTTP Server**

```bash
npm start -- --sse --port 3000
```

2. **Custom Integration with Cursor**

Create a custom tool or extension in Cursor that connects to the HTTP API:

```typescript
// Example Cursor extension integration
interface CodeRAGTool {
  callTool(name: string, params: any): Promise<any>;
}

class CursorCodeRAGClient implements CodeRAGTool {
  private baseUrl = 'http://localhost:3000';

  async callTool(name: string, params: any = {}) {
    const response = await fetch(`${this.baseUrl}/mcp/tools/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`CodeRAG tool ${name} failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

3. **Manual HTTP Usage in Cursor**

Use Cursor's terminal to make HTTP requests:

```bash
# Analyze current project
curl -X POST http://localhost:3000/mcp/tools/scan_dir \
  -H "Content-Type: application/json" \
  -d '{
    "directory_path": ".",
    "clear_existing": true
  }'
```

### VS Code with Continue.dev

#### Option 1: STDIO Mode (Recommended)

1. **Install Continue.dev Extension**

2. **Configure MCP Server**

Add to your Continue.dev configuration:

```json
{
  "contextProviders": [
    {
      "name": "coderag",
      "params": {
        "serverCommand": "node",
        "serverArgs": ["/path/to/CodeRAG/build/index.js"],
        "serverEnv": {
          "NEO4J_URI": "bolt://localhost:7687",
          "NEO4J_USER": "neo4j",
          "NEO4J_PASSWORD": "your_password"
        }
      }
    }
  ]
}
```

#### Option 2: SSE Mode (HTTP Integration)

1. **Start CodeRAG HTTP Server**

```bash
npm start -- --sse --port 3000
```

2. **VS Code Extension Integration**

Create a VS Code extension that connects to CodeRAG:

```typescript
// VS Code extension code
import * as vscode from 'vscode';

class CodeRAGProvider {
  private baseUrl = 'http://localhost:3000';

  async analyzeCurrentProject() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools/scan_dir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory_path: workspaceFolder.uri.fsPath,
          clear_existing: true
        })
      });

      const result = await response.json();
      
      // Display results in VS Code output panel
      const outputChannel = vscode.window.createOutputChannel('CodeRAG');
      outputChannel.append(JSON.stringify(result, null, 2));
      outputChannel.show();
    } catch (error) {
      vscode.window.showErrorMessage(`CodeRAG analysis failed: ${error}`);
    }
  }
}
```

3. **Manual HTTP Usage in VS Code Terminal**

Use VS Code's integrated terminal:

```bash
# Get project summary
curl -X POST http://localhost:3000/mcp/tools/get_project_summary \
  -H "Content-Type: application/json" \
  -d '{}'

# Find architectural issues
curl -X POST http://localhost:3000/mcp/tools/find_architectural_issues \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Generic HTTP/Web Integration

For any tool that supports HTTP APIs:

#### 1. Start CodeRAG HTTP Server

```bash
npm start -- --sse --port 3000
```

#### 2. API Reference

**Base URL:** `http://localhost:3000`

**Available Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/mcp/tools` | List all available tools |
| POST | `/mcp/tools/{tool_name}` | Execute a specific tool |
| GET | `/mcp/prompts` | List all available prompts |
| GET | `/mcp/prompts/{prompt_name}` | Get a specific prompt |

#### 3. Common HTTP Examples

```bash
# Health check
curl http://localhost:3000/health

# List tools
curl http://localhost:3000/mcp/tools

# Get project summary
curl -X POST http://localhost:3000/mcp/tools/get_project_summary \
  -H "Content-Type: application/json" \
  -d '{}'

# Calculate CK metrics for a class
curl -X POST http://localhost:3000/mcp/tools/calculate_ck_metrics \
  -H "Content-Type: application/json" \
  -d '{"class_id": "com.example.UserService"}'

# Find classes implementing an interface
curl -X POST http://localhost:3000/mcp/tools/find_classes_implementing_interface \
  -H "Content-Type: application/json" \
  -d '{"interface_name": "Repository"}'

# Get inheritance hierarchy
curl -X POST http://localhost:3000/mcp/tools/get_inheritance_hierarchy \
  -H "Content-Type: application/json" \
  -d '{"class_name": "BaseEntity"}'
```

#### 4. Response Format

All HTTP responses follow this format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Response content here..."
    }
  ]
}
```

#### 5. Error Handling

Errors are returned with appropriate HTTP status codes:

```json
{
  "error": {
    "code": "TOOL_ERROR",
    "message": "Detailed error message"
  }
}
```

## Using the Scanner

The codebase scanner is your entry point for populating the Neo4J graph with your code structure.

### Scanning a Project

#### Command Line Scanner

```bash
# Scan a TypeScript/JavaScript project
npm run scan /path/to/your/project

# Scan with specific languages
npm run scan /path/to/your/project -- --languages typescript,javascript

# Include test files
npm run scan /path/to/your/project -- --include-tests

# Clear existing data before scanning
npm run scan /path/to/your/project -- --clear

# Exclude specific directories
npm run scan /path/to/your/project -- --exclude node_modules,dist,build
```

#### Via MCP Tools

Once connected to an AI tool, you can use:

```
Use the scan_dir tool to scan my current project at /path/to/project
```

**Parameters for scan_dir:**
- `directory_path`: Path to your project root
- `languages`: Array of languages (`["typescript", "javascript", "java", "python"]`)
- `exclude_paths`: Paths to exclude (`["node_modules", "dist", "build"]`)
- `include_tests`: Include test files (`true`/`false`)
- `clear_existing`: Clear existing graph data (`true`/`false`)
- `max_depth`: Maximum directory depth to scan (`10`)

### Supported Languages

- **TypeScript** (`.ts`, `.tsx`)
- **JavaScript** (`.js`, `.jsx`)
- **Java** (`.java`)
- **Python** (`.py`)
- **C#** (`.cs`) - *Coming soon*

### What Gets Scanned

The scanner extracts:

**Node Types:**
- Classes and interfaces
- Methods and functions
- Fields and properties
- Packages and modules
- Enums and exceptions

**Relationships:**
- Inheritance (`extends`)
- Interface implementation (`implements`)
- Method calls (`calls`)
- Field references (`references`)
- Containment (`contains`)
- Package membership (`belongs_to`)

## MCP Prompts Guide

CodeRAG includes 4 guided prompts to help you effectively use the tools:

### 1. `analyze_codebase` - Comprehensive Analysis Guide

**Purpose:** Get step-by-step guidance for analyzing your codebase

**Usage:**
```
Use the analyze_codebase prompt for my TypeScript project
```

**What it provides:**
- Instructions for exploring existing graph data
- Steps to understand codebase structure
- Relationship analysis guidance
- Quality assessment workflow

### 2. `setup_code_graph` - Project Setup Guide

**Purpose:** Step-by-step guide to set up a code graph for a new project

**Usage:**
```
Use the setup_code_graph prompt for language=java
```

**What it provides:**
- Scanning instructions
- Validation steps
- Structure analysis guidance
- Relationship exploration tips

### 3. `find_dependencies` - Dependency Analysis

**Purpose:** Guide to find class dependencies and method calls

**Usage:**
```
Use the find_dependencies prompt for target_class=UserService
```

**What it provides:**
- Instructions to find what a class depends on
- Steps to find what depends on the class
- Coupling analysis guidance
- Visualization approaches

### 4. `analyze_inheritance` - Inheritance Analysis

**Purpose:** Guide to analyze inheritance hierarchies and interface implementations

**Usage:**
```
Use the analyze_inheritance prompt for class_or_interface=BaseRepository
```

**What it provides:**
- Hierarchy mapping instructions
- Implementation discovery steps
- Design pattern identification
- Architecture evaluation guidance

### Using Prompts Effectively

1. **Start with setup_code_graph** when working with a new project
2. **Use analyze_codebase** for general exploration
3. **Use find_dependencies** when investigating specific classes
4. **Use analyze_inheritance** when working with OOP designs

## Available Tools

CodeRAG provides 18 powerful tools for code analysis:

### Core CRUD Operations

| Tool | Description |
|------|-------------|
| `add_node` | Add a new code node (class, method, etc.) |
| `update_node` | Update an existing node |
| `get_node` | Retrieve a node by ID |
| `delete_node` | Delete a node |
| `add_edge` | Add a relationship edge |
| `get_edge` | Retrieve an edge by ID |
| `delete_edge` | Delete an edge |

### Search & Discovery

| Tool | Description |
|------|-------------|
| `find_nodes_by_type` | Find all nodes of a specific type |
| `search_nodes` | Search nodes by name or description |
| `find_edges_by_source` | Find all edges from a source node |

### Relationship Analysis

| Tool | Description |
|------|-------------|
| `find_classes_calling_method` | Find classes that call a specific method |
| `find_classes_implementing_interface` | Find classes implementing an interface |
| `get_inheritance_hierarchy` | Get complete inheritance hierarchy |

### Quality & Metrics

| Tool | Description |
|------|-------------|
| `calculate_ck_metrics` | Calculate Chidamber & Kemerer metrics |
| `calculate_package_metrics` | Calculate package-level metrics |
| `find_architectural_issues` | Detect architectural problems |
| `get_project_summary` | Get overall project quality summary |

### Scanning Tools

| Tool | Description |
|------|-------------|
| `add_file` | Parse and add a single source file |
| `scan_dir` | Scan entire directory/project |

## Code Quality Metrics

CodeRAG calculates comprehensive quality metrics:

### CK Metrics Suite

**WMC (Weighted Methods per Class)**
- Measures: Complexity of a class
- Good: < 15, Warning: 15-30, Critical: > 30

**DIT (Depth of Inheritance Tree)**
- Measures: Inheritance depth
- Good: < 3, Warning: 3-4, Critical: > 4

**NOC (Number of Children)**
- Measures: Number of direct subclasses
- Good: < 5, Warning: 5-7, Critical: > 7

**CBO (Coupling Between Objects)**
- Measures: Number of classes a class depends on
- Good: < 5, Warning: 5-10, Critical: > 10

**RFC (Response for Class)**
- Measures: Number of methods that can be executed
- Good: < 20, Warning: 20-30, Critical: > 30

**LCOM (Lack of Cohesion in Methods)**
- Measures: How well methods work together
- Good: < 0.3, Warning: 0.3-0.7, Critical: > 0.7

### Package Metrics

**Afferent Coupling (Ca)**
- Number of classes outside the package that depend on classes inside

**Efferent Coupling (Ce)**
- Number of classes inside the package that depend on classes outside

**Instability (I)**
- Ce / (Ca + Ce) - Measures resistance to change

**Abstractness (A)**
- Number of abstract classes / Total classes

**Distance from Main Sequence (D)**
- |A + I - 1| - Measures balance between stability and abstractness

### Architectural Issues Detection

- **Circular Dependencies**: Packages that depend on each other
- **God Classes**: Classes with too many responsibilities
- **High Coupling**: Classes with excessive dependencies
- **Unstable Dependencies**: Depending on unstable packages

## Troubleshooting

### Common Issues

#### 1. Neo4J Connection Failed

**Error:** `Failed to connect to Neo4J`

**Solutions:**
- Verify Neo4J is running: Check Neo4J Desktop or `docker ps`
- Check connection details in `.env` file
- Verify firewall isn't blocking port 7687
- Test connection: `telnet localhost 7687`

#### 2. MCP Server Not Found

**Error:** AI tool can't find CodeRAG

**Solutions:**
- Verify MCP configuration file path and syntax
- Check file permissions on the configuration
- Ensure the built files exist: `npm run build`
- Check the path in the MCP configuration is absolute

#### 3. Parsing Errors

**Error:** Scanner fails to parse files

**Solutions:**
- Check file encoding (should be UTF-8)
- Verify file syntax is valid
- Check if language is supported
- Review exclude patterns

#### 4. Performance Issues

**Error:** Slow scanning or queries

**Solutions:**
- Add database indexes: The scanner automatically creates basic indexes
- Exclude unnecessary directories (node_modules, dist, etc.)
- Use `max_depth` parameter to limit scan depth
- Consider scanning in smaller chunks

### Debug Mode

Enable detailed logging:

```bash
# Set environment variable
export LOG_LEVEL=debug

# Run with debug output
npm run dev
```

### Database Maintenance

**Clear all data:**
```cypher
MATCH (n) DETACH DELETE n
```

**View database schema:**
```cypher
CALL db.schema.visualization()
```

**Check node counts:**
```cypher
MATCH (n) RETURN labels(n), count(*)
```

### Getting Help

1. **Check the logs** for detailed error messages
2. **Verify your setup** against this guide
3. **Test with a simple project** first
4. **Check Neo4J logs** for database issues
5. **Review AI tool logs** for MCP connection issues

## Example Workflows

### Analyzing a New Project

1. **Scan the project:**
   ```
   Use scan_dir to scan /path/to/my/project with clear_existing=true
   ```

2. **Get overview:**
   ```
   Use get_project_summary to show me the codebase overview
   ```

3. **Find issues:**
   ```
   Use find_architectural_issues to identify problems
   ```

4. **Analyze key classes:**
   ```
   Use calculate_ck_metrics for the main service classes
   ```

### Understanding Dependencies

1. **Find a specific class:**
   ```
   Use search_nodes to find classes containing "Service"
   ```

2. **Analyze its dependencies:**
   ```
   Use find_dependencies prompt for target_class=UserService
   ```

3. **Check coupling:**
   ```
   Use calculate_ck_metrics for the UserService class
   ```

### Exploring Architecture

1. **Map inheritance:**
   ```
   Use analyze_inheritance prompt for class_or_interface=BaseEntity
   ```

2. **Find implementations:**
   ```
   Use find_classes_implementing_interface for Repository
   ```

3. **Check package structure:**
   ```
   Use calculate_package_metrics for com.myapp.service
   ```

---

## Quick Reference Card

### Essential Commands
```bash
# Setup
npm install && npm run build

# Scan project  
npm run scan /path/to/project

# Start STDIO mode
npm start

# Start HTTP mode
npm start -- --sse --port 3000
```

### Key MCP Tools
- `scan_dir` - Scan codebase
- `get_project_summary` - Overview
- `find_architectural_issues` - Find problems
- `calculate_ck_metrics` - Class quality
- `get_inheritance_hierarchy` - Class relationships

### MCP Prompts
- `setup_code_graph` - New project setup
- `analyze_codebase` - General analysis
- `find_dependencies` - Dependency analysis  
- `analyze_inheritance` - Inheritance analysis

This guide should get you started with CodeRAG. The combination of automated scanning, quality metrics, and AI-powered analysis makes it a powerful tool for understanding and improving your codebase architecture.