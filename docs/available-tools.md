# Available Tools Reference

CodeRAG provides 23 powerful tools for code analysis:

## Core CRUD Operations

### `add_node`
**Description:** Add a new code node (class, method, field, etc.)

**Parameters:**
- `type`: Node type (class, method, interface, field, package)
- `id`: Unique identifier
- `name`: Display name
- `properties`: Additional properties object
- `project_id`: Project identifier (optional, auto-detected if single project)

**Example:**
```json
{
  "type": "class",
  "id": "com.example.UserService",
  "name": "UserService", 
  "properties": {
    "package": "com.example",
    "access_modifier": "public",
    "is_abstract": false
  }
}
```

### `update_node`
**Description:** Update an existing node's properties

**Parameters:**
- `node_id`: ID of node to update
- `properties`: Properties to update
- `project_id`: Project identifier (optional)

### `get_node`
**Description:** Retrieve a node by ID

**Parameters:**
- `node_id`: Unique node identifier
- `project_id`: Project identifier (optional)

### `delete_node`
**Description:** Delete a node and its relationships

**Parameters:**
- `node_id`: ID of node to delete
- `project_id`: Project identifier (optional)

### `add_edge`
**Description:** Add a relationship edge between nodes

**Parameters:**
- `source_id`: Source node ID
- `target_id`: Target node ID
- `relationship_type`: Type of relationship (extends, implements, calls, etc.)
- `properties`: Additional edge properties
- `project_id`: Project identifier (optional)

**Common relationship types:**
- `EXTENDS`: Inheritance
- `IMPLEMENTS`: Interface implementation
- `CALLS`: Method/function calls
- `REFERENCES`: Field/variable references
- `CONTAINS`: Containment (class contains method)
- `BELONGS_TO`: Package membership

### `get_edge`
**Description:** Retrieve an edge by ID

**Parameters:**
- `edge_id`: Unique edge identifier
- `project_id`: Project identifier (optional)

### `delete_edge`
**Description:** Delete a relationship edge

**Parameters:**
- `edge_id`: ID of edge to delete
- `project_id`: Project identifier (optional)

## Search & Discovery

### `find_nodes_by_type`
**Description:** Find all nodes of a specific type

**Parameters:**
- `node_type`: Type to search for (class, interface, method, field, package)
- `limit`: Maximum results to return (default: 100)
- `project_id`: Project identifier (optional)

**Example:**
```json
{
  "node_type": "class",
  "limit": 50,
  "project_id": "my-project"
}
```

### `search_nodes`
**Description:** Search nodes by name or description

**Parameters:**
- `search_term`: Text to search for
- `node_type`: Optional type filter
- `limit`: Maximum results (default: 100)
- `project_id`: Project identifier (optional)

**Search capabilities:**
- Partial name matching
- Case-insensitive search
- Searches name and description fields
- Supports wildcard patterns

### `find_edges_by_source`
**Description:** Find all edges from a source node

**Parameters:**
- `source_node_id`: Source node identifier
- `relationship_type`: Optional relationship filter
- `limit`: Maximum results (default: 100)
- `project_id`: Project identifier (optional)

## Semantic Search

### `semantic_search`
**Description:** Search for code using natural language queries to find functionality by meaning

**Parameters:**
- `query`: Natural language description of functionality to search for
- `project_id`: Optional project identifier to scope search
- `node_types`: Optional array of node types to filter (class, method, function, etc.)
- `limit`: Maximum results (default: 10)
- `similarity_threshold`: Minimum similarity score 0.0-1.0 (default: 0.7)
- `include_graph_context`: Include related entities in results (default: false)
- `max_hops`: Maximum relationship hops for context (default: 2)

**Example:**
```json
{
  "query": "functions that validate email addresses",
  "project_id": "my-web-app",
  "node_types": ["function", "method"],
  "limit": 5,
  "similarity_threshold": 0.8,
  "include_graph_context": true
}
```

### `get_similar_code`
**Description:** Find code entities semantically similar to a specific node

**Parameters:**
- `node_id`: ID of the reference code entity
- `project_id`: Project containing the reference node
- `limit`: Maximum results (default: 5)

**Example:**
```json
{
  "node_id": "UserValidator.validateEmail",
  "project_id": "my-web-app",
  "limit": 10
}
```

### `update_embeddings`
**Description:** Generate or refresh semantic embeddings for code entities

**Parameters:**
- `project_id`: Optional project identifier to scope update
- `node_types`: Optional array of node types to update

**Example:**
```json
{
  "project_id": "my-web-app",
  "node_types": ["class", "method", "function"]
}
```

### `initialize_semantic_search`
**Description:** Initialize semantic search infrastructure and vector indexes

**Parameters:** None

**Usage:** Run once per database to set up vector search capabilities

## Relationship Analysis

### `find_classes_calling_method`
**Description:** Find classes that call a specific method

**Parameters:**
- `method_name`: Name of the method to search for
- `target_class`: Optional class that owns the method
- `project_id`: Project identifier (optional)

**Use cases:**
- Impact analysis for method changes
- Finding usage patterns
- Dependency analysis
- Refactoring planning

### `find_classes_implementing_interface`
**Description:** Find classes implementing an interface

**Parameters:**
- `interface_name`: Name of the interface
- `project_id`: Project identifier (optional)

**Returns:**
- List of implementing classes
- Implementation details
- Inheritance hierarchy information

### `get_inheritance_hierarchy`
**Description:** Get complete inheritance hierarchy for a class

**Parameters:**
- `class_name`: Name of the class
- `direction`: "up" (ancestors), "down" (descendants), or "both" (default)
- `max_depth`: Maximum hierarchy depth (default: 10)
- `project_id`: Project identifier (optional)

**Output format:**
```json
{
  "root_class": "BaseEntity",
  "hierarchy": {
    "ancestors": [
      {"name": "Object", "depth": 0},
      {"name": "BaseEntity", "depth": 1}
    ],
    "descendants": [
      {"name": "User", "depth": 1},
      {"name": "Product", "depth": 1},
      {"name": "AdminUser", "depth": 2}
    ]
  }
}
```

## Quality & Metrics

### `calculate_ck_metrics`
**Description:** Calculate Chidamber & Kemerer metrics for a class

**Parameters:**
- `class_id`: Unique class identifier
- `project_id`: Project identifier (optional)

**Metrics calculated:**
- **WMC** (Weighted Methods per Class): Complexity measure
- **DIT** (Depth of Inheritance Tree): Inheritance depth
- **NOC** (Number of Children): Direct subclasses
- **CBO** (Coupling Between Objects): Class dependencies
- **RFC** (Response for Class): Total method calls
- **LCOM** (Lack of Cohesion in Methods): Method cohesion

**Output includes:**
- Raw metric values
- Quality classifications (Good/Warning/Critical)
- Interpretation guidance
- Improvement recommendations

### `calculate_package_metrics`
**Description:** Calculate package-level metrics

**Parameters:**
- `package_name`: Package/module name
- `project_id`: Project identifier (optional)

**Metrics calculated:**
- **Ca** (Afferent Coupling): Incoming dependencies
- **Ce** (Efferent Coupling): Outgoing dependencies
- **I** (Instability): Change resilience (Ce/(Ca+Ce))
- **A** (Abstractness): Abstract classes ratio
- **D** (Distance from Main Sequence): Balance measure

### `find_architectural_issues`
**Description:** Detect architectural problems

**Parameters:**
- `project_id`: Project identifier (optional)
- `severity`: Filter by severity (low, medium, high, critical)

**Issues detected:**
- **Circular Dependencies**: Package dependency cycles
- **God Classes**: Classes with excessive responsibilities
- **High Coupling**: Classes with too many dependencies
- **Unstable Dependencies**: Architectural violations
- **Dead Code**: Unused classes and methods
- **Long Parameter Lists**: Methods with too many parameters

### `get_project_summary`
**Description:** Get overall project quality summary

**Parameters:**
- `project_id`: Project identifier (optional)
- `include_metrics`: Include detailed metrics (default: true)

**Summary includes:**
- Entity counts by type
- Relationship statistics
- Quality score and grade
- Top architectural issues
- Recommendations for improvement
- Trend analysis (if historical data available)

## Scanning Tools

### `add_file`
**Description:** Parse and add a single source file

**Parameters:**
- `file_path`: Absolute path to source file
- `language`: Programming language (optional, auto-detected)
- `clear_existing`: Clear existing file data (default: false)
- `project_id`: Project identifier (optional)

**Supported languages:**
- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Java (`.java`)
- Python (`.py`)

### `scan_dir`
**Description:** Scan entire directory/project

**Parameters:**
- `directory_path`: Path to project root
- `languages`: Array of languages to scan (optional, auto-detected)
- `exclude_paths`: Directories to exclude (default: ["node_modules", "dist", "build"])
- `include_tests`: Include test files (default: false)
- `clear_existing`: Clear existing project data (default: false)
- `max_depth`: Maximum directory depth (default: 10)
- `project_id`: Project identifier (optional, derived from directory name)

**Example:**
```json
{
  "directory_path": "/path/to/my-project",
  "languages": ["typescript", "javascript"],
  "exclude_paths": ["node_modules", "dist", "coverage"],
  "include_tests": true,
  "clear_existing": true,
  "max_depth": 8
}
```

## Multi-Project Management

### `list_projects`
**Description:** List all projects with optional statistics and filtering

**Parameters:**
- `include_stats`: Include entity/relationship counts (default: false)
- `sort_by`: Sort criteria (name, created_at, updated_at, entity_count)
- `limit`: Maximum projects to return (1-1000, default: 100)
- `name_filter`: Filter projects by name pattern (optional)

**Example:**
```json
{
  "include_stats": true,
  "sort_by": "entity_count",
  "limit": 20,
  "name_filter": "*service*"
}
```

**Output includes:**
- Project metadata (ID, name, description)
- Creation and update timestamps
- Entity and relationship statistics
- Supported languages
- Quality summary

## Tool Usage Patterns

### 1. Initial Project Analysis

```bash
# 1. Scan the project
scan_dir -> directory_path: "/path/to/project"

# 2. Get overview
get_project_summary

# 3. Find issues
find_architectural_issues

# 4. Analyze key classes
calculate_ck_metrics -> class_id: "com.example.UserService"
```

### 2. Dependency Investigation

```bash
# 1. Find the class
search_nodes -> search_term: "UserService"

# 2. Get its dependencies
find_edges_by_source -> source_node_id: "com.example.UserService"

# 3. Find what depends on it
find_classes_calling_method -> method_name: "authenticate"

# 4. Calculate coupling metrics
calculate_ck_metrics -> class_id: "com.example.UserService"
```

### 3. Architecture Analysis

```bash
# 1. Map inheritance hierarchies
get_inheritance_hierarchy -> class_name: "BaseEntity"

# 2. Find interface implementations
find_classes_implementing_interface -> interface_name: "Repository"

# 3. Analyze package structure
calculate_package_metrics -> package_name: "com.example.service"

# 4. Identify architectural issues
find_architectural_issues
```

### 4. Multi-Project Management

```bash
# 1. List all projects
list_projects -> include_stats: true

# 2. Compare projects
get_project_summary -> project_id: "project-a"
get_project_summary -> project_id: "project-b"

# 3. Cross-project analysis
search_nodes -> search_term: "Controller"  # Searches all projects
```

### 5. Semantic Code Discovery

```bash
# 1. Initialize semantic search (one-time setup)
initialize_semantic_search

# 2. Generate embeddings for existing project
update_embeddings -> project_id: "my-project"

# 3. Search by functionality
semantic_search -> query: "functions that validate email addresses"

# 4. Find similar code
get_similar_code -> node_id: "UserValidator.validateEmail", project_id: "my-project"

# 5. Search with context
semantic_search -> query: "database connection utilities", include_graph_context: true
```

## Error Handling

All tools return standardized error responses:

```json
{
  "error": {
    "code": "NODE_NOT_FOUND",
    "message": "Node with ID 'com.example.Missing' not found",
    "details": {
      "node_id": "com.example.Missing",
      "project_id": "my-project"
    }
  }
}
```

**Common error codes:**
- `NODE_NOT_FOUND`: Requested node doesn't exist
- `EDGE_NOT_FOUND`: Requested edge doesn't exist
- `PROJECT_NOT_FOUND`: Project doesn't exist
- `INVALID_PARAMETERS`: Invalid or missing parameters
- `DATABASE_ERROR`: Neo4J connection or query error
- `SCAN_ERROR`: File scanning or parsing error

## Performance Considerations

### Query Optimization

**Large result sets:**
- Use `limit` parameter to control result size
- Filter by `project_id` when possible
- Use specific node types rather than broad searches

**Complex analysis:**
- Break large hierarchies into smaller queries
- Use targeted searches instead of full scans
- Consider caching results for repeated analysis

### Batch Operations

**Multiple file scanning:**
- Use `scan_dir` instead of multiple `add_file` calls
- Exclude unnecessary directories to improve performance
- Process large projects in stages if needed

**Bulk analysis:**
- Group related queries together
- Use project-specific queries when possible
- Cache frequently accessed results

## Next Steps

- [Quality Metrics](quality-metrics.md) - Detailed explanation of metrics and thresholds
- [MCP Prompts Guide](mcp-prompts.md) - Guided workflows using these tools
- [Troubleshooting](troubleshooting.md) - Solving common tool issues
