# Scanner Usage Guide

The codebase scanner is your entry point for populating the Neo4J graph with your code structure.

## Scanning a Project

### Command Line Scanner

```bash
# Scan a TypeScript/JavaScript project
npm run scan /path/to/your/project

# Scan with specific languages
npm run scan /path/to/your/project -- --languages typescript,javascript

# Include test files
npm run scan /path/to/your/project -- --include-tests

# Clear existing project data before scanning
npm run scan /path/to/your/project -- --clear-graph

# Clear ALL database data before scanning (all projects)
npm run scan /path/to/your/project -- --clear-all

# Exclude specific directories
npm run scan /path/to/your/project -- --exclude node_modules,dist,build
```

**Understanding Clear Options:**
- `--clear-graph`: Clears only the current project's data (useful for re-scanning a single project in a multi-project setup)
- `--clear-all`: Clears the entire database (all projects) - use when starting fresh or resolving data conflicts

### Via MCP Tools

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

## Supported Languages

- **TypeScript** (`.ts`, `.tsx`)
- **JavaScript** (`.js`, `.jsx`)
- **Java** (`.java`)
- **Python** (`.py`)
- **C#** (`.cs`) - *Coming soon*

## What Gets Scanned

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

## Scanner Configuration

### File Inclusion/Exclusion

**Default Exclusions:**
- `node_modules/`
- `dist/`, `build/`, `out/`
- `.git/`
- Test files (unless `--include-tests` is specified)
- Hidden files and directories (starting with `.`)

**Custom Exclusions:**
```bash
# Exclude additional directories
npm run scan /path/to/project -- --exclude vendor,tmp,cache
```

**Include Test Files:**
```bash
# Include test files in analysis
npm run scan /path/to/project -- --include-tests
```

### Language Selection

**Auto-Detection:**
By default, the scanner auto-detects languages based on file extensions.

**Manual Selection:**
```bash
# Scan only specific languages
npm run scan /path/to/project -- --languages java,python

# TypeScript only
npm run scan /path/to/project -- --languages typescript
```

### Depth Control

```bash
# Limit scan depth to prevent deep recursion
npm run scan /path/to/project -- --max-depth 5
```

## Scanner Output

### Successful Scan

```
=== CodeRAG Project Scanner ===
Scanning: /path/to/my-project
Project ID: my-project

🔍 Validating project structure...
✅ Project validation complete

📁 Scanning files...
  TypeScript: 45 files
  JavaScript: 12 files
  
📦 Processing entities...
  Classes: 23
  Interfaces: 8
  Methods: 156
  Fields: 89
  
🔗 Building relationships...
  Inheritance: 12
  Implementations: 15
  Calls: 234
  References: 178
  
✅ Scan completed successfully!

Project Summary:
- Total entities: 276
- Total relationships: 439
- Languages: TypeScript, JavaScript
- Scan duration: 2.3s
```

### Scan Errors

**Common Issues:**

1. **File Permission Errors:**
```
⚠️  Warning: Cannot read file /path/to/file.ts (permission denied)
```

2. **Syntax Errors:**
```
⚠️  Warning: Parse error in /path/to/file.ts:line 45
```

3. **Unsupported Files:**
```
📁 Skipping unsupported file: /path/to/file.xml
```

## Best Practices

### 1. Project Preparation

**Before Scanning:**
- Ensure the project compiles successfully
- Fix any major syntax errors
- Consider excluding generated code directories
- Remove or exclude large vendor directories

### 2. Initial Scan Strategy

**New Project (First Time):**
```bash
# Start with a clean database
npm run scan /path/to/project -- --clear-all
```

**Re-scanning Project:**
```bash
# Update existing project data
npm run scan /path/to/project -- --clear-graph
```

**Adding to Multi-Project Database:**
```bash
# Preserve other projects, add new one
npm run scan /path/to/new-project
```

### 3. Performance Optimization

**Large Projects:**
```bash
# Limit depth and exclude unnecessary directories
npm run scan /path/to/large-project -- \
  --max-depth 8 \
  --exclude node_modules,dist,build,vendor,tmp
```

**Incremental Scanning:**
- For large codebases, consider scanning modules separately
- Use project isolation to manage different components
- Monitor scan duration and adjust exclusions as needed

### 4. Multi-Language Projects

```bash
# Scan polyglot project with multiple languages
npm run scan /path/to/polyglot-project -- \
  --languages typescript,java,python \
  --include-tests
```

## Troubleshooting

### Scanner Won't Start

**Check Prerequisites:**
```bash
# Verify Node.js version
node --version  # Should be 18+

# Verify build
npm run build

# Check Neo4J connection
neo4j status  # or check Docker container
```

### Scanner Fails to Parse Files

**Common Solutions:**

1. **Update Dependencies:**
```bash
npm install
npm run build
```

2. **Check File Encoding:**
   - Ensure files are UTF-8 encoded
   - Check for byte order marks (BOM)

3. **Syntax Validation:**
   - Fix syntax errors in source files
   - Consider excluding problematic files

### Performance Issues

**Slow Scanning:**

1. **Reduce Scope:**
```bash
# Exclude large directories
npm run scan /path/to/project -- --exclude node_modules,dist,vendor
```

2. **Limit Depth:**
```bash
# Reduce maximum directory depth
npm run scan /path/to/project -- --max-depth 6
```

3. **Language Filtering:**
```bash
# Scan only specific languages
npm run scan /path/to/project -- --languages typescript
```

### Database Issues

**Connection Failures:**
- Verify Neo4J is running
- Check `.env` configuration
- Test connection manually

**Memory Issues:**
- Increase Neo4J heap size
- Clear database before large scans
- Use `--clear-all` for fresh start

## Advanced Usage

### Custom Scanner Configuration

For advanced users, you can modify scanner behavior by:

1. **Environment Variables:**
```bash
# Set custom scan timeout
export SCANNER_TIMEOUT=300000  # 5 minutes

# Enable debug logging
export LOG_LEVEL=debug
```

2. **Programmatic Usage:**
```javascript
// Use scanner in your own scripts
const { Scanner } = require('./build/scanner');

const scanner = new Scanner({
  neo4jConfig: {
    uri: 'bolt://localhost:7687',
    user: 'neo4j',
    password: 'password'
  },
  scanConfig: {
    languages: ['typescript', 'java'],
    excludePaths: ['node_modules', 'dist'],
    includeTests: false,
    maxDepth: 10
  }
});

await scanner.scanDirectory('/path/to/project');
```

### Batch Scanning

```bash
# Scan multiple projects in sequence
for project in /path/to/projects/*; do
  echo "Scanning $project"
  npm run scan "$project"
done
```

## Next Steps

- [Multi-Project Management](multi-project-management.md) - Manage multiple codebases
- [Available Tools](available-tools.md) - Explore analysis tools
- [Quality Metrics](quality-metrics.md) - Understand code quality analysis
