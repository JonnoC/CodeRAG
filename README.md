# CodeRAG MCP Server

A Model Context Protocol (MCP) Server that interfaces with Neo4J to provide GraphRAG capabilities for code analysis. Store and retrieve rich, interconnected metadata about code projects through a graph database.

## Features

- **Neo4J Backend**: Uses Neo4J as the graph database for storing code entities and relationships
- **MCP Server**: Exposes tools for adding, updating, and querying code entities via Model Context Protocol
- **Dual Modes**: Supports both STDIO and SSE (Server-Sent Events) communication modes
- **Rich Code Model**: Supports classes, interfaces, enums, exceptions, methods, fields, annotations, decorators, packages, and modules
- **Relationship Tracking**: Tracks calls, implements, extends, contains, references, throws, and belongs_to relationships
- **Advanced Queries**: Find classes calling methods, implementing interfaces, inheritance hierarchies, and more
- **Codebase Scanner**: Automatically scan and populate graph from existing projects (TypeScript, JavaScript, Java, Python)
- **Code Quality Metrics**: CK metrics suite, package metrics, architectural analysis, and quality assessment
- **Guided Prompts**: Interactive MCP prompts for effective tool usage and analysis workflows

## Setup

### Prerequisites

- Node.js 18+ 
- Neo4J database (local or remote)
- TypeScript

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your Neo4J connection in `.env`:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

5. Build the project:
   ```bash
   npm run build
   ```

## Usage

### STDIO Mode (Default)
For direct integration with MCP clients:
```bash
npm start
```

### SSE Mode
For HTTP-based communication:
```bash
npm start -- --sse --port 3000
```

### Development Mode
```bash
npm run dev
```

### Codebase Scanning
```bash
# Scan a project (supports TypeScript, JavaScript, Java, Python)
npm run scan /path/to/your/project

# Scan with quality analysis
npm run scan /path/to/your/project -- --analyze

# Clear existing graph data before scanning
npm run scan /path/to/your/project -- --clear-graph

# Include test files in scan
npm run scan /path/to/your/project -- --include-tests

# Validate project structure only
npm run scan validate /path/to/your/project

# Get help with scanner options
npm run scan --help
```

## Available Tools and Prompts

### Guided Prompts
- `analyze_codebase`: Get step-by-step guidance on analyzing any codebase using CodeRAG tools
- `setup_code_graph`: Language-specific guide to set up a code graph for a new project
- `find_dependencies`: Interactive guide to analyze class dependencies and method calls
- `analyze_inheritance`: Guide to analyze inheritance hierarchies and interface implementations

### Node Management
- `add_node`: Add a new code entity (class, interface, method, etc.)
- `update_node`: Update an existing node
- `get_node`: Retrieve a node by ID
- `delete_node`: Delete a node
- `find_nodes_by_type`: Find nodes by type (class, interface, etc.)
- `search_nodes`: Search nodes by name, qualified name, or description

### Edge Management
- `add_edge`: Add a relationship between two nodes
- `get_edge`: Retrieve an edge by ID
- `delete_edge`: Delete an edge
- `find_edges_by_source`: Find edges originating from a node

### Code Analysis
- `find_classes_calling_method`: Find all classes that call a specific method
- `find_classes_implementing_interface`: Find all classes implementing an interface
- `get_inheritance_hierarchy`: Get the inheritance hierarchy for a class

### Code Quality Metrics (Phase 1 - Core Metrics)
- `calculate_ck_metrics`: Calculate Chidamber & Kemerer metrics (WMC, DIT, NOC, CBO, RFC, LCOM)
- `calculate_package_metrics`: Calculate package metrics (Afferent/Efferent Coupling, Instability, Abstractness, Distance)
- `find_architectural_issues`: Find architectural issues (circular dependencies, god classes, high coupling)
- `get_project_summary`: Get overall project metrics summary and quality assessment

## API Endpoints (SSE Mode)

When running in SSE mode, the following HTTP endpoints are available:

- `GET /health`: Health check
- `GET /sse`: SSE endpoint for MCP communication
- `POST /api/nodes`: Create a new node
- `GET /api/nodes/:id`: Get node by ID
- `GET /api/nodes?type=class`: Find nodes by type
- `GET /api/nodes?search=term`: Search nodes
- `POST /api/edges`: Create a new edge
- `GET /api/analysis/classes-calling-method/:methodName`: Find classes calling method
- `GET /api/analysis/classes-implementing-interface/:interfaceName`: Find implementing classes
- `GET /api/analysis/inheritance-hierarchy/:className`: Get inheritance hierarchy
- `GET /api/metrics/ck/:classId`: Calculate CK metrics for a class
- `GET /api/metrics/package/:packageName`: Calculate package metrics
- `GET /api/metrics/issues`: Find architectural issues
- `GET /api/metrics/summary`: Get project quality summary

## Example Usage

### Using Prompts for Guidance
```bash
# Get guidance for analyzing a Java codebase
mcp call get_prompt --name analyze_codebase --arguments '{"project_type": "java"}'

# Get setup guide for TypeScript project
mcp call get_prompt --name setup_code_graph --arguments '{"language": "TypeScript"}'

# Get dependency analysis guidance
mcp call get_prompt --name find_dependencies --arguments '{"target_class": "UserService"}'
```

### Code Quality Analysis
```bash
# Calculate CK metrics for a class
mcp call calculate_ck_metrics --arguments '{"class_id": "com.example.UserService"}'

# Get package quality metrics
mcp call calculate_package_metrics --arguments '{"package_name": "com.example.service"}'

# Find architectural issues
mcp call find_architectural_issues

# Get overall project quality summary
mcp call get_project_summary
```

### Adding a Class Node
```json
{
  "id": "com.example.MyClass",
  "type": "class",
  "name": "MyClass",
  "qualified_name": "com.example.MyClass",
  "description": "Example class for demonstration",
  "source_file": "src/main/java/com/example/MyClass.java",
  "start_line": 10,
  "end_line": 50,
  "modifiers": ["public"],
  "attributes": {}
}
```

### Adding a Relationship Edge
```json
{
  "id": "edge_1",
  "type": "implements",
  "source": "com.example.MyClass",
  "target": "com.example.MyInterface",
  "attributes": {}
}
```

## Development

### Build
```bash
npm run build
```

### Type Check
```bash
npm run typecheck
```

### Lint
```bash
npm run lint
```

### Tests
```bash
npm test
```

## Architecture

- `src/index.ts`: Main entry point
- `src/config.ts`: Environment configuration
- `src/types.ts`: TypeScript type definitions
- `src/graph/`: Neo4J client and managers
- `src/mcp/`: MCP protocol handlers
- `src/scanner/`: Codebase scanning and parsing
- `src/metrics/`: Code quality metrics and analysis
- `src/prompts/`: MCP guided prompts

## License

MIT