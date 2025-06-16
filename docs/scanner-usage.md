# Scanner Usage Guide

The codebase scanner automatically detects your project languages and structure, making it easy to populate the Neo4J graph with your code.

## Automatic Language Detection

🎯 **New Feature**: The scanner now automatically detects project languages using:
- **Build file analysis** (package.json, pom.xml, build.gradle, setup.py, pyproject.toml, etc.)
- **Project metadata extraction** (name, version, description, dependencies, frameworks)
- **Multi-language project support** (e.g., TypeScript frontend + Java backend)
- **Sub-project detection** for mono-repositories
- **Fallback to file extension detection** when build files aren't available

## Scanning a Project

### Command Line Scanner

```bash
# Auto-detect languages and scan (recommended)
npm run scan /path/to/your/project

# Manual language specification (optional override)
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

### Remote Repository Scanning

🌐 **New Feature**: Scan repositories directly from GitHub, GitLab, and Bitbucket without local cloning:

```bash
# Public repositories
npm run scan https://github.com/owner/repo.git
npm run scan https://gitlab.com/owner/repo.git
npm run scan https://bitbucket.org/owner/repo.git

# Private repositories (requires authentication - see installation guide)
GITHUB_TOKEN=ghp_xxx npm run scan https://github.com/private/repo.git

# Specific branches or tags
npm run scan https://github.com/owner/repo.git -- --branch develop
npm run scan https://github.com/owner/repo.git -- --branch v2.0.0

# SSH URLs (requires SSH key setup)
npm run scan git@github.com:owner/repo.git

# With additional options
npm run scan https://github.com/owner/repo.git -- --languages typescript,java --analyze
```

**Understanding Clear Options:**
- `--clear-graph`: Clears only the current project's data (useful for re-scanning a single project in a multi-project setup)
- `--clear-all`: Clears the entire database (all projects) - use when starting fresh or resolving data conflicts

### Auto-Detection Examples

```bash
# TypeScript project (detects from package.json)
npm run scan /path/to/react-app
# Output: ✅ TypeScript project detected, Framework: React

# Java project (detects from pom.xml or build.gradle)
npm run scan /path/to/spring-app  
# Output: ✅ Java project detected, Build system: Maven, Framework: Spring Boot

# Python project (detects from setup.py or pyproject.toml)
npm run scan /path/to/django-app
# Output: ✅ Python project detected, Build system: Poetry, Framework: Django

# Multi-language project
npm run scan /path/to/fullstack-app
# Output: ✅ Multi-language project detected: TypeScript (frontend), Java (backend)

# Remote repository examples
npm run scan https://github.com/microsoft/vscode.git
# Output: ✅ TypeScript project detected, Build system: npm, Framework: Electron

npm run scan https://github.com/spring-projects/spring-boot.git  
# Output: ✅ Java project detected, Build system: Gradle, Framework: Spring Boot
```

### Via MCP Tools

Once connected to an AI tool, you can use:

```
Use the scan_dir tool to scan my current project at /path/to/project
```

**Parameters for scan_dir:**
- `directory_path`: Path to your project root
- `languages`: Array of languages (auto-detected if not specified)
- `exclude_paths`: Paths to exclude (auto-suggested based on detected languages)
- `include_tests`: Include test files (`true`/`false`, default based on project type)
- `clear_existing`: Clear existing graph data (`true`/`false`)
- `max_depth`: Maximum directory depth to scan (`10`)

**Remote Repository Tools:**

```
Use the scan_remote_repo tool to analyze https://github.com/owner/repo.git
```

**Parameters for scan_remote_repo:**
- `repository_url`: Git repository URL (GitHub, GitLab, Bitbucket)
- `branch`: Branch name to scan (default: main/master)
- `project_id`: Custom project identifier (optional)
- `languages`: Array of languages (auto-detected if not specified)
- `include_tests`: Include test files (`true`/`false`)
- `clear_existing`: Clear existing graph data (`true`/`false`)
- `use_cache`: Use cached repository if available (`true`/`false`)
- `shallow_clone`: Use shallow clone for faster scanning (`true`/`false`)

**Auto-Detection Features:**
- Languages are automatically detected from build files and file extensions
- Project metadata (name, version, description) extracted from build files
- Framework detection (React, Spring Boot, Django, etc.) from dependencies
- Language-specific exclude paths automatically suggested
- Mono-repository and sub-project detection

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

**Automatic Detection (Recommended):**
The scanner now uses intelligent language detection:

1. **Build File Analysis** - Analyzes package.json, pom.xml, build.gradle, setup.py, pyproject.toml, etc.
2. **Metadata Extraction** - Extracts project name, version, dependencies, and frameworks
3. **Multi-Language Support** - Handles projects with multiple languages (e.g., frontend + backend)
4. **Sub-Project Detection** - Identifies mono-repositories with multiple sub-projects
5. **File Extension Fallback** - Uses file extensions when build files aren't available

**Manual Override (When Needed):**
```bash
# Override auto-detection for specific languages only
npm run scan /path/to/project -- --languages java,python

# Force TypeScript only (useful for mixed projects)
npm run scan /path/to/project -- --languages typescript
```

### Depth Control

```bash
# Limit scan depth to prevent deep recursion
npm run scan /path/to/project -- --max-depth 5
```

## Scanner Output

### Successful Scan with Auto-Detection

```
=== CodeRAG Project Scanner ===
Scanning: /path/to/my-react-app
Project ID: my-react-app

🔍 Auto-detecting project structure...
✅ TypeScript project detected
📋 Project: my-react-app v1.2.0
🏗️ Framework: React
📦 Build system: npm
💡 Recommendations: Include test files, exclude node_modules, dist

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
- Project Name: my-react-app
- Version: 1.2.0
- Framework: React
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

**Automatic Multi-Language Detection:**
```bash
# Auto-detects all languages in polyglot projects
npm run scan /path/to/fullstack-project
# Output: ✅ Multi-language project: TypeScript (frontend), Java (backend), Python (scripts)
```

**Manual Multi-Language Specification:**
```bash
# Override auto-detection for specific languages
npm run scan /path/to/polyglot-project -- \
  --languages typescript,java,python \
  --include-tests
```

**Mono-Repository Handling:**
```bash
# Auto-detects sub-projects in mono-repositories
npm run scan /path/to/monorepo
# Output: 🏗️ Mono-repository detected with 3 sub-projects
# Suggestion: Consider scanning sub-projects separately for better organization
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

### Remote Repository Issues

**Authentication Failures:**
```bash
# Error: 401 Unauthorized
# Solution: Check your authentication tokens in .env
GITHUB_TOKEN=ghp_xxx npm run scan https://github.com/private/repo.git
```

**Network Issues:**
```bash
# Error: Failed to clone repository
# Solutions:
# 1. Check internet connection
# 2. Verify repository URL
# 3. Try SSH URL if HTTPS fails
npm run scan git@github.com:owner/repo.git
```

**Branch Not Found:**
```bash
# Error: Branch 'feature-branch' not found
# Solution: Verify branch exists
npm run scan https://github.com/owner/repo.git -- --branch main
```

**Large Repository Timeouts:**
```bash
# Solution: Use shallow clone for faster processing
npm run scan https://github.com/large/repo.git -- --shallow-clone
```

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
