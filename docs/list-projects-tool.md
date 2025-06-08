# List Projects MCP Tool

The `list_projects` tool provides a comprehensive way to view and analyze all projects stored in the CodeRAG graph database.

## Overview

This tool lists all projects with optional detailed statistics, making it perfect for:
- **Project Discovery**: See what projects are available in your graph
- **Project Overview**: Get a quick summary of all scanned codebases
- **Size Analysis**: Compare projects by entity count and complexity
- **Management**: Monitor project growth and updates over time

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include_stats` | boolean | No | `false` | Include detailed statistics for each project |
| `sort_by` | string | No | `name` | Sort field: `name`, `created_at`, `updated_at`, `entity_count` |
| `limit` | number | No | `100` | Maximum projects to return (1-1000) |

## Usage Examples

### Basic Project List
```json
{
  "name": "list_projects"
}
```

**Response:**
```json
{
  "projects": [
    {
      "project_id": "my-app",
      "name": "My Application",
      "description": "Scanned from /path/to/my-app",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:35:00.000Z"
    }
  ],
  "total_count": 1
}
```

### Projects with Statistics
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

**Response:**
```json
{
  "projects": [
    {
      "project_id": "large-project",
      "name": "Large Project",
      "description": "Scanned from /path/to/large-project", 
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:35:00.000Z",
      "stats": {
        "entity_count": 1250,
        "relationship_count": 3400,
        "entity_types": ["class", "interface", "method", "field"],
        "relationship_types": ["IMPLEMENTS", "EXTENDS", "CALLS", "CONTAINS"]
      }
    }
  ],
  "total_count": 1,
  "summary": {
    "total_projects": 1,
    "total_entities": 1250,
    "total_relationships": 3400
  }
}
```

## Response Format

### Basic Response
- `projects`: Array of project objects
- `total_count`: Total number of projects

### Enhanced Response (with stats)
- `projects`: Array of project objects with stats
- `total_count`: Total number of projects  
- `summary`: Aggregate statistics across all projects

### Project Object
- `project_id`: Unique project identifier
- `name`: Human-readable project name
- `description`: Project description
- `created_at`: Project creation timestamp
- `updated_at`: Last update timestamp
- `stats` (if requested): Detailed project statistics

### Statistics Object
- `entity_count`: Total code entities (classes, methods, etc.)
- `relationship_count`: Total relationships between entities
- `entity_types`: Array of entity types found in project
- `relationship_types`: Array of relationship types found in project

## Use Cases

### 1. Project Discovery
```bash
# Find all available projects
mcp call list_projects
```

### 2. Project Size Comparison
```bash
# Compare projects by size
mcp call list_projects --include_stats true --sort_by entity_count
```

### 3. Recent Projects
```bash
# See recently updated projects
mcp call list_projects --sort_by updated_at --limit 5
```

### 4. Project Portfolio Overview
```bash
# Get complete portfolio statistics
mcp call list_projects --include_stats true
```

## Integration

The tool integrates seamlessly with the multi-project CodeRAG architecture:

- **Project Context**: Works with the new project separation system
- **Performance**: Efficient queries using project-aware indexes
- **Statistics**: Leverages project-scoped entity and relationship counts
- **Sorting**: Supports multiple sort criteria for different analysis needs

## Error Handling

The tool handles common error scenarios:
- **Database Connection**: Clear error messages for connection issues
- **No Projects**: Returns empty array with helpful guidance
- **Invalid Parameters**: Validates sort fields and limits
- **Statistics Errors**: Graceful fallback if stats calculation fails

## Next Steps

This tool complements the multi-project infrastructure and enables:
- Project management workflows
- Cross-project analysis preparation
- Database health monitoring
- User interface integration for project selection