# CodeRAG User Guide

CodeRAG is a powerful MCP (Model Context Protocol) Server that creates a graph database representation of your codebase using Neo4J. This enables advanced code analysis, relationship mapping, and AI-powered insights about your code structure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Neo4J Database Setup](#neo4j-database-setup)
4. [Running CodeRAG](#running-coderag)
5. [Integration with AI Tools](#integration-with-ai-tools)
6. [Using the Scanner](#using-the-scanner)
7. [Multi-Project Management](#multi-project-management)
8. [MCP Prompts Guide](#mcp-prompts-guide)
9. [Available Tools](#available-tools)
10. [Code Quality Metrics](#code-quality-metrics)
11. [Troubleshooting](#troubleshooting)

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

2. **Important Note About HTTP Mode**

⚠️ **HTTP/SSE mode provides REST API endpoints, not MCP tool endpoints.** For MCP tool access, use STDIO mode with your AI assistant.

The HTTP endpoints are for direct API access:
- **Health Check:** `GET /health` 
- **SSE Endpoint:** `GET /sse` (for MCP communication via Server-Sent Events)
- **REST API:** `GET /api/*` (see API Reference section below for full list)

3. **Example HTTP Usage**

```bash
# Health check
curl http://localhost:3000/health

# Get project summary via REST API
curl http://localhost:3000/api/metrics/summary

# Scan a directory via REST API
curl -X POST http://localhost:3000/api/parse/directory \
  -H "Content-Type: application/json" \
  -d '{
    "directory_path": "/path/to/project",
    "languages": ["java"],
    "clear_existing": true
  }'
```

4. **JavaScript/Web Integration**

```javascript
// Example web integration using REST API
class CodeRAGClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async listNodes(type = null, search = null) {
    let url = `${this.baseUrl}/api/nodes`;
    if (type) url += `?type=${type}`;
    if (search) url += `?search=${search}`;
    const response = await fetch(url);
    return response.json();
  }

  async getProjectSummary() {
    const response = await fetch(`${this.baseUrl}/api/metrics/summary`);
    return response.json();
  }

  async scanDirectory(path, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/parse/directory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directory_path: path,
        languages: options.languages || ['java', 'typescript'],
        clear_existing: options.clear_existing || false,
        ...options
      })
    });
    return response.json();
  }

  async getCKMetrics(classId) {
    const response = await fetch(`${this.baseUrl}/api/metrics/ck/${classId}`);
    return response.json();
  }

  async findArchitecturalIssues() {
    const response = await fetch(`${this.baseUrl}/api/metrics/issues`);
    return response.json();
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
curl http://localhost:3000/api/metrics/summary
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
    let url: string;
    let method: string = 'GET';
    let body: string | undefined;

    // Map tool names to correct API endpoints
    switch (name) {
      case 'get_project_summary':
        url = `${this.baseUrl}/api/metrics/summary`;
        break;
      case 'scan_dir':
        url = `${this.baseUrl}/api/parse/directory`;
        method = 'POST';
        body = JSON.stringify(params);
        break;
      case 'find_architectural_issues':
        url = `${this.baseUrl}/api/metrics/issues`;
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const requestOptions: RequestInit = {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
    };
    
    if (body) {
      requestOptions.body = body;
    }

    const response = await fetch(url, requestOptions);
    
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
curl -X POST http://localhost:3000/api/parse/directory \
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
      const response = await fetch(`${this.baseUrl}/api/parse/directory`, {
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
curl http://localhost:3000/api/metrics/summary

# Find architectural issues
curl http://localhost:3000/api/metrics/issues
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
| GET | `/sse` | SSE endpoint for MCP communication |
| GET | `/api/nodes` | List nodes (with optional ?type= or ?search= params) |
| GET | `/api/nodes/{id}` | Get specific node by ID |
| GET | `/api/edges` | List edges (with optional ?source= param) |
| GET | `/api/edges/{id}` | Get specific edge by ID |
| GET | `/api/analysis/inheritance/{className}` | Get inheritance hierarchy |
| GET | `/api/analysis/implementations/{interfaceName}` | Find classes implementing interface |
| GET | `/api/analysis/callers/{methodName}` | Find classes calling method |
| GET | `/api/metrics/ck/{classId}` | Calculate CK metrics for class |
| GET | `/api/metrics/package/{packageName}` | Calculate package metrics |
| GET | `/api/metrics/issues` | Find architectural issues |
| GET | `/api/metrics/summary` | Get project quality summary |
| POST | `/api/parse/file` | Parse and add single file |
| POST | `/api/parse/directory` | Scan and parse directory |

#### 3. Common HTTP Examples

```bash
# Health check
curl http://localhost:3000/health

# List all nodes
curl http://localhost:3000/api/nodes

# Find class nodes
curl "http://localhost:3000/api/nodes?type=class"

# Search for nodes
curl "http://localhost:3000/api/nodes?search=UserService"

# Get specific node
curl http://localhost:3000/api/nodes/com.example.UserService

# Get inheritance hierarchy
curl http://localhost:3000/api/analysis/inheritance/BaseEntity

# Find classes implementing interface
curl http://localhost:3000/api/analysis/implementations/Repository

# Find classes calling method
curl http://localhost:3000/api/analysis/callers/authenticate

# Calculate CK metrics for a class
curl http://localhost:3000/api/metrics/ck/com.example.UserService

# Get package metrics
curl http://localhost:3000/api/metrics/package/com.example.service

# Find architectural issues
curl http://localhost:3000/api/metrics/issues

# Get project summary
curl http://localhost:3000/api/metrics/summary

# Parse a single file
curl -X POST http://localhost:3000/api/parse/file \
  -H "Content-Type: application/json" \
  -d '{"file_path": "/path/to/file.java", "clear_existing": false}'

# Scan a directory
curl -X POST http://localhost:3000/api/parse/directory \
  -H "Content-Type: application/json" \
  -d '{
    "directory_path": "/path/to/project",
    "languages": ["java"],
    "clear_existing": true
  }'
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

CodeRAG provides 19 powerful tools for code analysis:

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

### Multi-Project Management

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects with optional statistics and filtering |

## Multi-Project Management

CodeRAG supports managing multiple codebases in a single Neo4J database, enabling powerful cross-project analysis and portfolio management capabilities.

### Understanding Multi-Project Architecture

CodeRAG uses a **project isolation strategy** where:
- Each scanned codebase gets a unique `project_id`
- All nodes and relationships are tagged with their `project_id`
- Projects are isolated by default but can enable cross-project analysis
- Each project maintains separate quality metrics and statistics

### Project Identification

When CodeRAG scans a project, it automatically generates a project identifier:

```bash
# Project ID is derived from the directory name
npm run scan /path/to/my-awesome-app
# Creates project_id: "my-awesome-app"

npm run scan /Users/dev/frontend/react-dashboard  
# Creates project_id: "react-dashboard"
```

**Project ID Rules:**
- Derived from the final directory name in the path
- Converted to lowercase and sanitized
- Special characters replaced with hyphens
- Must be unique within the database

### Managing Multiple Projects

#### 1. Scanning Multiple Projects

```bash
# Scan first project (clears database)
npm run scan /path/to/project-a -- --clear-graph

# Scan additional projects (preserves existing data)
npm run scan /path/to/project-b
npm run scan /path/to/project-c
npm run scan /path/to/legacy-system
```

#### 2. Listing All Projects

Use the `list_projects` tool to discover and manage your projects:

**Basic Project List:**
```json
{
  "name": "list_projects"
}
```

**Enhanced List with Statistics:**
```json
{
  "name": "list_projects",
  "arguments": {
    "include_stats": true,
    "sort_by": "entity_count",
    "limit": 10
  }
}
```

**Parameters:**
- `include_stats` (boolean): Include entity counts and relationship statistics
- `sort_by` (string): Sort by `name`, `created_at`, `updated_at`, or `entity_count`
- `limit` (number): Maximum projects to return (1-1000, default: 100)

**Example Response:**
```json
{
  "projects": [
    {
      "project_id": "my-awesome-app",
      "name": "My Awesome App",
      "description": "Scanned from /path/to/my-awesome-app",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:35:00.000Z",
      "stats": {
        "entity_count": 127,
        "relationship_count": 89,
        "entity_types": ["class", "method", "interface", "field"],
        "relationship_types": ["CONTAINS", "IMPLEMENTS", "EXTENDS"]
      }
    }
  ],
  "total_count": 1,
  "summary": {
    "total_projects": 1,
    "total_entities": 127,
    "total_relationships": 89
  }
}
```

### Project-Aware Tool Usage

Most CodeRAG tools support project filtering to focus analysis on specific codebases:

#### Explicit Project Specification

When you have multiple projects, you can specify which project to analyze:

```bash
# Analyze specific project
mcp call get_project_summary --arguments '{"project_id": "my-awesome-app"}'

# Find architectural issues in specific project
mcp call find_architectural_issues --arguments '{"project_id": "legacy-system"}'

# Calculate metrics for class in specific project
mcp call calculate_ck_metrics --arguments '{
  "class_id": "com.example.UserService",
  "project_id": "my-awesome-app"
}'
```

#### Default Project Behavior

When `project_id` is not specified:
- **Single Project Database**: Tools automatically use the only project
- **Multi-Project Database**: Tools may return results across all projects or prompt for project specification
- **Current Context**: Some tools remember the last specified project

### Multi-Project Workflows

#### 1. Portfolio Analysis

Compare multiple projects side-by-side:

```bash
# Get overview of all projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'

# Compare quality across projects
for project in project-a project-b project-c; do
  mcp call get_project_summary --arguments "{\"project_id\": \"$project\"}"
done
```

#### 2. Migration Analysis

When modernizing legacy systems:

```bash
# Scan legacy system
npm run scan /path/to/legacy-system -- --clear-graph

# Scan new system
npm run scan /path/to/new-system

# Compare architectures
mcp call find_architectural_issues --arguments '{"project_id": "legacy-system"}'
mcp call find_architectural_issues --arguments '{"project_id": "new-system"}'
```

#### 3. Microservices Analysis

Analyze microservices architecture:

```bash
# Scan each service
npm run scan /path/to/user-service -- --clear-graph
npm run scan /path/to/order-service
npm run scan /path/to/payment-service
npm run scan /path/to/notification-service

# Analyze coupling between services
mcp call list_projects --arguments '{"include_stats": true}'

# Find shared patterns
mcp call search_nodes --arguments '{"search_term": "Controller"}'
```

### Cross-Project Analysis

When enabled, CodeRAG can analyze patterns across multiple projects:

#### Finding Common Patterns

```bash
# Find all classes implementing specific interface across projects
mcp call find_classes_implementing_interface --arguments '{
  "interface_name": "Repository"
  // Omit project_id for cross-project search
}'

# Search for naming patterns across all projects
mcp call search_nodes --arguments '{
  "search_term": "Service",
  "type": "class"
}'
```

#### Portfolio Quality Assessment

```bash
# Get quality summary for all projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'

# Identify projects needing attention
for project in $(mcp call list_projects | jq -r '.projects[].project_id'); do
  echo "=== Analysis for $project ==="
  mcp call find_architectural_issues --arguments "{\"project_id\": \"$project\"}"
done
```

### Project Management Best Practices

#### 1. Naming Conventions

**Good project directory names:**
- `user-management-api`
- `react-frontend` 
- `payment-processor`
- `legacy-monolith`

**Avoid:**
- Generic names like `app`, `system`, `code`
- Version numbers like `v1`, `v2` (use git tags instead)
- Special characters that don't translate well

#### 2. Scanning Strategy

**Clean Slate Approach:**
```bash
# Clear database and start fresh
npm run scan /path/to/main-project -- --clear-graph
npm run scan /path/to/other-projects...
```

**Incremental Approach:**
```bash
# Add projects one by one
npm run scan /path/to/new-project  # Preserves existing projects
```

**Update Existing Project:**
```bash
# Re-scan with same project name to update
npm run scan /path/to/existing-project -- --clear-existing
```

#### 3. Project Lifecycle Management

**Regular Updates:**
- Re-scan projects after major changes
- Monitor quality trends over time
- Archive old project versions

**Quality Gates:**
- Set quality thresholds per project type
- Monitor architectural drift
- Track technical debt accumulation

### Common Multi-Project Scenarios

#### Scenario 1: Comparing Frontend Frameworks

```bash
# Scan different implementations
npm run scan /path/to/react-app
npm run scan /path/to/vue-app  
npm run scan /path/to/angular-app

# Compare complexity
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'
```

#### Scenario 2: Legacy Migration Tracking

```bash
# Baseline legacy system
npm run scan /path/to/legacy-monolith -- --clear-graph

# Track new microservices
npm run scan /path/to/user-service
npm run scan /path/to/order-service

# Monitor progress
mcp call get_project_summary --arguments '{"project_id": "legacy-monolith"}'
```

#### Scenario 3: Multi-Language Portfolio

```bash
# Scan different language projects
npm run scan /path/to/java-backend
npm run scan /path/to/python-ml-service
npm run scan /path/to/typescript-frontend

# Compare architectural patterns
mcp call find_architectural_issues  # Cross-project analysis
```

### Troubleshooting Multi-Project Issues

**Issue: Duplicate project IDs**
- Solution: Rename project directories or use different scan paths
- Workaround: Clear specific project before re-scanning

**Issue: Can't find specific project**
- Check: Use `list_projects` to see available project IDs
- Verify: Project was scanned successfully
- Confirm: Correct spelling and case sensitivity

**Issue: Cross-project analysis not working**
- Check: Omit `project_id` parameter for cross-project tools
- Verify: Database contains multiple projects
- Confirm: Tools support cross-project analysis mode

## Code Quality Metrics

CodeRAG provides comprehensive code quality analysis through multiple metric suites. These metrics help identify design issues, complexity problems, and architectural concerns in your codebase.

### Understanding Metric Classifications

CodeRAG uses a three-tier classification system for all metrics:

- **🟢 Good (Green)**: Optimal range indicating healthy code design
- **🟡 Warning (Yellow)**: Acceptable but should be monitored; consider improvement
- **🔴 Critical (Red)**: Problematic values requiring immediate attention

### CK Metrics Suite (Chidamber & Kemerer)

The CK metrics suite is a widely-accepted set of object-oriented design quality metrics introduced by Chidamber and Kemerer in 1994.

#### WMC (Weighted Methods per Class)

**What it measures:** The complexity of a class based on the number and complexity of its methods.

**How it's calculated:**
- Counts all methods in a class (public, private, protected)
- Each method contributes 1 to the weight (simplified McCabe complexity)
- Formula: `WMC = Σ(complexity of each method)`

**Interpretation:**
- **🟢 Good: < 15** - Class has focused responsibilities and manageable complexity
- **🟡 Warning: 15-30** - Class is getting complex, consider refactoring
- **🔴 Critical: > 30** - Class likely violates Single Responsibility Principle

**Why it matters:**
- High WMC indicates classes that are difficult to understand, test, and maintain
- Classes with high WMC are more prone to bugs
- Affects testing effort (more methods = more test cases needed)

**Example:**
```java
// Good WMC (≈ 8)
class UserValidator {
    public boolean isValidEmail(String email) { ... }
    public boolean isValidPassword(String password) { ... }
    public boolean isValidAge(int age) { ... }
    private boolean checkDomain(String domain) { ... }
    // ... 4 more focused methods
}

// Critical WMC (≈ 35)
class UserManager {
    // 35+ methods handling user creation, validation, authentication,
    // email sending, logging, caching, etc.
}
```

#### DIT (Depth of Inheritance Tree)

**What it measures:** The maximum depth of inheritance hierarchy from a class to the root class.

**How it's calculated:**
- Counts the number of ancestor classes up to the root
- Root classes (Object, base classes) have DIT = 0
- Each level of inheritance adds 1

**Interpretation:**
- **🟢 Good: < 3** - Shallow hierarchy, easy to understand and maintain
- **🟡 Warning: 3-4** - Moderate depth, acceptable for complex domains
- **🔴 Critical: > 4** - Deep hierarchy, difficult to understand and modify

**Why it matters:**
- Deep inheritance makes code harder to understand
- Changes to base classes affect many derived classes
- Increases complexity of method resolution
- Can indicate over-engineering

**Example:**
```java
// Good DIT = 2
Object -> Animal -> Dog

// Critical DIT = 6  
Object -> Vehicle -> MotorVehicle -> Car -> Sedan -> LuxurySedan -> BMWSedan
```

#### NOC (Number of Children)

**What it measures:** The number of immediate subclasses that inherit from a class.

**How it's calculated:**
- Counts direct subclasses only (not grandchildren)
- Formula: `NOC = count(immediate subclasses)`

**Interpretation:**
- **🟢 Good: < 5** - Reasonable number of specializations
- **🟡 Warning: 5-7** - Many subclasses, ensure they're all necessary
- **🔴 Critical: > 7** - Too many subclasses, consider composition or interfaces

**Why it matters:**
- High NOC indicates a class may be too general or abstract
- Many subclasses increase testing complexity
- Changes to parent class affect many children
- May indicate improper abstraction level

**Example:**
```java
// Good NOC = 3
abstract class Shape {
    // Rectangle, Circle, Triangle inherit from Shape
}

// Critical NOC = 12
abstract class DatabaseConnection {
    // MySQL, PostgreSQL, Oracle, SQLServer, MongoDB, 
    // Redis, Cassandra, Neo4j, etc. all inherit directly
}
```

#### CBO (Coupling Between Objects)

**What it measures:** The number of other classes that a class depends on or is coupled to.

**How it's calculated:**
- Counts classes referenced in field declarations, method parameters, return types
- Includes inheritance, composition, and association relationships
- Excludes primitive types and standard library classes (configurable)

**Interpretation:**
- **🟢 Good: < 5** - Low coupling, class is relatively independent
- **🟡 Warning: 5-10** - Moderate coupling, acceptable for complex functionality
- **🔴 Critical: > 10** - High coupling, class is tightly bound to many others

**Why it matters:**
- High coupling makes classes harder to test in isolation
- Changes ripple through highly coupled classes
- Reduces reusability and increases maintenance cost
- Indicates potential violation of dependency principles

**Example:**
```java
// Good CBO = 3
class EmailService {
    private EmailTemplate template;    // +1
    private EmailValidator validator;  // +1
    
    public void send(User user) { ... } // +1 for User
}

// Critical CBO = 15
class OrderProcessor {
    // Uses 15+ different classes: User, Product, PaymentGateway,
    // ShippingService, InventoryManager, EmailService, SMSService,
    // AuditLogger, SecurityManager, ConfigManager, etc.
}
```

#### RFC (Response for Class)

**What it measures:** The total number of methods that can potentially be executed in response to a message received by an object of the class.

**How it's calculated:**
- Includes all methods in the class
- Plus all methods in other classes that are called by methods in this class
- Formula: `RFC = |{M}| + |{R}|` where M = methods in class, R = remote methods called

**Interpretation:**
- **🟢 Good: < 20** - Class has reasonable complexity and interactions
- **🟡 Warning: 20-30** - High complexity, consider refactoring
- **🔴 Critical: > 30** - Very high complexity, likely violates SRP

**Why it matters:**
- High RFC indicates complex classes that are hard to test
- Affects debugging difficulty (more potential execution paths)
- Correlates with defect density
- Indicates classes that may need decomposition

#### LCOM (Lack of Cohesion in Methods)

**What it measures:** How well the methods in a class work together and share data.

**How it's calculated (LCOM4 variant):**
- Creates a graph where methods are nodes
- Edges connect methods that share instance variables
- Counts connected components in the graph
- Lower values indicate better cohesion

**Interpretation:**
- **🟢 Good: < 0.3** - High cohesion, methods work well together
- **🟡 Warning: 0.3-0.7** - Moderate cohesion, some methods may be unrelated
- **🔴 Critical: > 0.7** - Low cohesion, class likely has multiple responsibilities

**Why it matters:**
- Low cohesion suggests a class has multiple unrelated responsibilities
- High cohesion makes classes easier to understand and maintain
- Helps identify candidates for class decomposition
- Relates to Single Responsibility Principle

### Package Metrics

Package metrics analyze the structure and dependencies at the package/module level, helping identify architectural issues.

#### Afferent Coupling (Ca)

**What it measures:** The number of classes outside a package that depend on classes inside the package.

**How it's calculated:**
- Counts external classes that import or use classes from this package
- Only counts direct dependencies

**Interpretation:**
- **High Ca**: Package is stable and widely used (good for libraries)
- **Low Ca**: Package may be unused or too specialized
- **Very High Ca**: Changes to this package will affect many other packages

**Use cases:**
- Identifying core/foundational packages
- Understanding impact of changes
- Planning refactoring priorities

#### Efferent Coupling (Ce)

**What it measures:** The number of classes outside a package that classes inside the package depend on.

**How it's calculated:**
- Counts external classes that are imported or used by classes in this package
- Measures outgoing dependencies

**Interpretation:**
- **High Ce**: Package depends on many external packages (potentially unstable)
- **Low Ce**: Package is relatively self-contained
- **Very High Ce**: Package may violate dependency management principles

#### Instability (I)

**What it measures:** The resilience to change of a package.

**How it's calculated:**
- Formula: `I = Ce / (Ca + Ce)`
- Ranges from 0 (maximally stable) to 1 (maximally unstable)

**Interpretation:**
- **🟢 I = 0**: Completely stable (only has incoming dependencies)
- **🟡 I = 0.5**: Balanced stability
- **🔴 I = 1**: Completely unstable (only has outgoing dependencies)

**Why it matters:**
- Unstable packages should not be depended upon by stable packages
- Helps identify architectural violations
- Guides dependency management decisions

#### Abstractness (A)

**What it measures:** The ratio of abstract classes and interfaces to total classes in a package.

**How it's calculated:**
- Formula: `A = (Abstract Classes + Interfaces) / Total Classes`
- Ranges from 0 (completely concrete) to 1 (completely abstract)

**Interpretation:**
- **A = 0**: Package contains only concrete classes
- **A = 1**: Package contains only abstract classes/interfaces
- **Optimal A**: Depends on package role (utilities ≈ 0, frameworks ≈ 1)

#### Distance from Main Sequence (D)

**What it measures:** How well a package balances abstractness and stability.

**How it's calculated:**
- Formula: `D = |A + I - 1|`
- Measures distance from the "main sequence" line where A + I = 1

**Interpretation:**
- **🟢 D ≈ 0**: Package is well-balanced
- **🔴 D ≈ 1**: Package is in "Zone of Pain" (concrete and stable) or "Zone of Uselessness" (abstract and unstable)

**The Main Sequence:**
- **Zone of Pain (I=0, A=0)**: Rigid, hard to change concrete classes
- **Zone of Uselessness (I=1, A=1)**: Abstract classes that nobody uses
- **Main Sequence**: Balanced packages that are either stable+abstract or unstable+concrete

### Architectural Issues Detection

CodeRAG automatically detects common architectural problems:

#### Circular Dependencies

**What it detects:** Packages that have mutual dependencies, creating cycles in the dependency graph.

**Why it's problematic:**
- Makes individual testing difficult
- Complicates build processes
- Reduces modularity
- Can cause runtime issues (initialization order problems)

**Example:**
```
Package A depends on Package B
Package B depends on Package C  
Package C depends on Package A  // Creates cycle A → B → C → A
```

#### God Classes

**What it detects:** Classes with excessive responsibilities, typically identified by:
- Very high WMC (> 50)
- High number of fields (> 20)
- Large number of methods (> 30)
- High CBO (> 15)

**Why it's problematic:**
- Violates Single Responsibility Principle
- Difficult to understand and maintain
- Hard to test comprehensively
- Becomes a bottleneck for changes

#### High Coupling Classes

**What it detects:** Classes with CBO > 15, indicating excessive dependencies.

**Why it's problematic:**
- Changes require updates to many related classes
- Difficult to test in isolation
- Reduces reusability
- Increases maintenance complexity

#### Unstable Dependencies

**What it detects:** Stable packages (low I) that depend on unstable packages (high I).

**Why it's problematic:**
- Violates Stable Dependencies Principle
- Stable code becomes affected by unstable code changes
- Can lead to unexpected breaking changes
- Makes the system harder to evolve

### Using Metrics Effectively

#### 1. Metric Interpretation Guidelines

**Don't focus on single metrics:**
- Use metrics in combination for better insights
- Consider the context of your application domain
- Some complexity may be inherent to the problem being solved

**Trend analysis is more valuable than absolute values:**
- Track metrics over time to see improvement/degradation
- Focus on classes that are getting worse
- Celebrate improvements in metric trends

#### 2. Prioritizing Improvements

**High-impact targets:**
1. **God Classes** with high WMC + high CBO
2. **Circular Dependencies** affecting core packages
3. **Highly Coupled Classes** in frequently changed areas
4. **Deep Inheritance** in business logic classes

**Lower priority:**
1. Slightly elevated metrics in stable, working code
2. Test classes with higher complexity (often acceptable)
3. Generated code or framework classes

#### 3. Refactoring Strategies

**For High WMC:**
- Extract Method pattern
- Decompose into multiple classes
- Use Strategy or Command patterns

**For High CBO:**
- Introduce interfaces to reduce concrete dependencies
- Use Dependency Injection
- Apply Facade pattern for complex subsystems

**For Low Cohesion:**
- Split class based on method groupings
- Extract classes for each responsibility
- Use composition instead of inheritance

**For Deep Inheritance:**
- Favor composition over inheritance
- Use interfaces for contracts
- Flatten hierarchies where possible

### Getting Metric Reports

Use these CodeRAG tools to analyze your code quality:

```bash
# Get overall project quality summary
mcp call get_project_summary

# Calculate CK metrics for specific class
mcp call calculate_ck_metrics --arguments '{"class_id": "com.example.UserService"}'

# Analyze package metrics
mcp call calculate_package_metrics --arguments '{"package_name": "com.example.service"}'

# Find architectural issues
mcp call find_architectural_issues

# Compare metrics across projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'
```

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