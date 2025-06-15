# Multi-Project Management

CodeRAG supports managing multiple codebases in a single Neo4J database, enabling powerful cross-project analysis and portfolio management capabilities.

## Understanding Multi-Project Architecture

CodeRAG uses a **project isolation strategy** where:
- Each scanned codebase gets a unique `project_id`
- All nodes and relationships are tagged with their `project_id`
- Projects are isolated by default but can enable cross-project analysis
- Each project maintains separate quality metrics and statistics

## Project Identification & Auto-Detection

CodeRAG now automatically extracts project information from build files and metadata:

```bash
# Auto-detects project name from package.json, pom.xml, etc.
npm run scan /path/to/my-react-app
# Detects: TypeScript, React framework, project name "my-react-app" v1.2.0

npm run scan /path/to/spring-backend
# Detects: Java, Spring Boot framework, project name from pom.xml

npm run scan /path/to/python-service
# Detects: Python, Django framework, project name from setup.py/pyproject.toml
```

**Project Detection Features:**
- **Build File Analysis**: Extracts metadata from package.json, pom.xml, build.gradle, setup.py, pyproject.toml
- **Framework Detection**: Identifies React, Spring Boot, Django, Express, etc. from dependencies
- **Multi-Language Support**: Handles projects with multiple languages (frontend + backend)
- **Sub-Project Detection**: Automatically discovers mono-repositories with multiple sub-projects
- **Automatic Naming**: Uses project name from build files, falls back to directory name
- **Version Tracking**: Extracts version information from build files

## Managing Multiple Projects

### 1. Scanning Multiple Projects with Auto-Detection

```bash
# Scan first project (auto-detects TypeScript/React)
npm run scan /path/to/react-frontend -- --clear-all
# Output: ✅ TypeScript project detected, Framework: React, Name: "my-frontend" v2.1.0

# Scan backend (auto-detects Java/Spring Boot)
npm run scan /path/to/spring-backend
# Output: ✅ Java project detected, Framework: Spring Boot, Name: "api-service" v1.0.0

# Scan Python service (auto-detects Python/Django)
npm run scan /path/to/python-api
# Output: ✅ Python project detected, Framework: Django, Name: "data-processor" v0.3.2

# Scan mono-repository (auto-detects multiple languages)
npm run scan /path/to/fullstack-monorepo
# Output: 🏗️ Mono-repository detected: TypeScript (frontend), Java (backend), Python (scripts)

# Re-scan with updated code (preserves project metadata)
npm run scan /path/to/react-frontend -- --clear-graph
```

### 2. Listing All Projects

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

## Project-Aware Tool Usage

Most CodeRAG tools support project filtering to focus analysis on specific codebases:

### Explicit Project Specification

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

### Default Project Behavior

When `project_id` is not specified:
- **Single Project Database**: Tools automatically use the only project
- **Multi-Project Database**: Tools may return results across all projects or prompt for project specification
- **Current Context**: Some tools remember the last specified project

## Multi-Project Workflows

### 1. Portfolio Analysis

Compare multiple projects side-by-side:

```bash
# Get overview of all projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'

# Compare quality across projects
for project in project-a project-b project-c; do
  mcp call get_project_summary --arguments "{\"project_id\": \"$project\"}"
done
```

### 2. Migration Analysis

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

### 3. Microservices Analysis

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

## Cross-Project Analysis

When enabled, CodeRAG can analyze patterns across multiple projects:

### Finding Common Patterns

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

### Portfolio Quality Assessment

```bash
# Get quality summary for all projects
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'

# Identify projects needing attention
for project in $(mcp call list_projects | jq -r '.projects[].project_id'); do
  echo "=== Analysis for $project ==="
  mcp call find_architectural_issues --arguments "{\"project_id\": \"$project\"}"
done
```

## Project Management Best Practices

### 1. Naming Conventions

**Good project directory names:**
- `user-management-api`
- `react-frontend` 
- `payment-processor`
- `legacy-monolith`

**Avoid:**
- Generic names like `app`, `system`, `code`
- Version numbers like `v1`, `v2` (use git tags instead)
- Special characters that don't translate well

### 2. Scanning Strategy

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

### 3. Project Lifecycle Management

**Regular Updates:**
- Re-scan projects after major changes
- Monitor quality trends over time
- Archive old project versions

**Quality Gates:**
- Set quality thresholds per project type
- Monitor architectural drift
- Track technical debt accumulation

## Common Multi-Project Scenarios

### Scenario 1: Comparing Frontend Frameworks

```bash
# Scan different implementations
npm run scan /path/to/react-app
npm run scan /path/to/vue-app  
npm run scan /path/to/angular-app

# Compare complexity
mcp call list_projects --arguments '{"include_stats": true, "sort_by": "entity_count"}'
```

### Scenario 2: Legacy Migration Tracking

```bash
# Baseline legacy system
npm run scan /path/to/legacy-monolith -- --clear-graph

# Track new microservices
npm run scan /path/to/user-service
npm run scan /path/to/order-service

# Monitor progress
mcp call get_project_summary --arguments '{"project_id": "legacy-monolith"}'
```

### Scenario 3: Multi-Language Portfolio with Auto-Detection

```bash
# Automatically detect and scan different language projects
npm run scan /path/to/java-backend
# Output: ✅ Java project detected, Framework: Spring Boot, Build: Maven

npm run scan /path/to/python-ml-service  
# Output: ✅ Python project detected, Frameworks: FastAPI, scikit-learn, Build: Poetry

npm run scan /path/to/typescript-frontend
# Output: ✅ TypeScript project detected, Framework: Next.js, Build: npm

# Compare frameworks and architectural patterns across languages
mcp call find_architectural_issues  # Cross-project analysis
mcp call list_projects --arguments '{"include_stats": true}'
# Shows detected frameworks, languages, and quality metrics for each project
```

## Troubleshooting Multi-Project Issues

### Issue: Duplicate project IDs
- **Solution**: Rename project directories or use different scan paths
- **Workaround**: Clear specific project before re-scanning

### Issue: Can't find specific project
- **Check**: Use `list_projects` to see available project IDs
- **Verify**: Project was scanned successfully
- **Confirm**: Correct spelling and case sensitivity

### Issue: Cross-project analysis not working
- **Check**: Omit `project_id` parameter for cross-project tools
- **Verify**: Database contains multiple projects
- **Confirm**: Tools support cross-project analysis mode

## Database Schema for Multi-Project

### Project Isolation

All nodes include a `project_id` property:

```cypher
// Example node structure
CREATE (c:Class {
  id: "com.example.UserService",
  name: "UserService",
  project_id: "my-awesome-app",
  package: "com.example",
  // ... other properties
})
```

### Project Context Nodes

```cypher
// ProjectContext node stores project metadata
CREATE (p:ProjectContext {
  project_id: "my-awesome-app",
  name: "My Awesome App",
  description: "Scanned from /path/to/my-awesome-app",
  created_at: datetime(),
  updated_at: datetime(),
  languages: ["typescript", "javascript"],
  total_entities: 127,
  total_relationships: 89
})
```

### Optimized Queries

```cypher
// Project-aware queries use project_id in WHERE clauses
MATCH (c:Class)
WHERE c.project_id = $project_id
RETURN c

// Cross-project queries omit project_id filtering
MATCH (c:Class)
WHERE c.name CONTAINS $search_term
RETURN c.project_id, c.name
```

## Next Steps

- [Available Tools](available-tools.md) - Explore project-aware analysis tools
- [Quality Metrics](quality-metrics.md) - Understand project-specific metrics
- [MCP Prompts Guide](mcp-prompts.md) - Use guided prompts for multi-project analysis
