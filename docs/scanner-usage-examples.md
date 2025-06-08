# Codebase Scanner Usage Examples

## Basic Usage

### 1. Scan a TypeScript Project
```bash
# Basic scan
npm run scan /path/to/your/typescript-project

# Example output:
🚀 CodeRAG Scanner v1.0.0
📁 Project: /Users/dev/my-typescript-app
🔗 Connected to Neo4j: bolt://localhost:7687
🔍 Validating project structure...

📋 Project Analysis:
  ✅ package.json found - Node.js project detected
  ✅ tsconfig.json found - TypeScript project detected

⚙️ Scan Configuration:
  Languages: typescript, javascript
  Include tests: no
  Exclude paths: node_modules, dist, build

🔄 Starting codebase scan...
📁 Found 45 source files
📊 Processed 45/45 files
💾 Storing 127 entities and 89 relationships...
📥 Storing entities...
🔗 Storing relationships...

📊 CODEBASE SCAN REPORT
═══════════════════════

📈 STATISTICS
  Files processed: 45
  Entities found: 127
  Relationships found: 89
  Processing time: 3.24s

🏗️ ENTITY BREAKDOWN
  • class: 23
  • method: 67
  • interface: 12
  • field: 18
  • module: 7

🔗 RELATIONSHIP BREAKDOWN
  • contains: 85
  • implements: 15
  • extends: 8
  • belongs_to: 45

✅ Scan completed successfully!
```

### 2. Scan with Quality Analysis
```bash
npm run scan /path/to/project -- --analyze

# Additional output after scan:
🔬 Running quality analysis...

📊 QUALITY ANALYSIS RESULTS
═══════════════════════════
📈 Project Metrics:
  Total Classes: 23
  Total Methods: 67
  Total Packages: 7
  Average Coupling: 4.2
  Average RFC: 8.7
  Average DIT: 1.8

⚠️ Issues Found: 3
  1. [HIGH] God class detected: UserService (25 methods, 12 couplings)
  2. [HIGH] Highly coupled class: DatabaseManager (18 couplings)
  3. [MEDIUM] Circular dependency detected in package: com.example.utils

💡 Recommendations:
  • Use MCP tools to explore specific classes and metrics
  • Focus on high-coupling classes and god classes first
  • Consider refactoring classes with high CBO (>10) or RFC (>50)
```

## Advanced Usage

### 3. Clear and Rescan
```bash
# Clear this project's data before scanning
npm run scan /path/to/project -- --clear-graph --analyze

# Clear ALL database data before scanning (all projects)
npm run scan /path/to/project -- --clear-all --analyze
```

### 4. Include Test Files
```bash
# Include test files in the analysis
npm run scan /path/to/project -- --include-tests
```

### 5. Project Validation Only
```bash
# Validate project structure without scanning
npm run scan validate /path/to/project

# Output:
📁 Project: /Users/dev/my-project
✅ Valid: Yes
🔤 Languages detected: typescript, javascript

📋 Analysis:
  ✅ package.json found - Node.js project detected
  ✅ tsconfig.json found - TypeScript project detected
  💡 Consider organizing code in a src/ directory for better analysis
```

### 6. Custom Language Selection
```bash
# Scan only JavaScript files
npm run scan /path/to/project -- --languages javascript

# Scan multiple languages (when parsers are available)
npm run scan /path/to/project -- --languages typescript,javascript,java
```

## Integration Workflow

### Complete Analysis Workflow
```bash
# 1. Validate project structure
npm run scan validate /path/to/project

# 2. Clear previous data and scan with analysis
npm run scan /path/to/project -- --clear-graph --analyze --output-report

# 3. Start CodeRAG server
npm start

# 4. Use MCP tools to explore results
mcp call get_project_summary
mcp call find_architectural_issues
mcp call calculate_ck_metrics --arguments '{"class_id": "com.example.UserService"}'
```

## Supported File Types

### Currently Supported
- **TypeScript**: `.ts`, `.tsx`
- **JavaScript**: `.js`, `.jsx`

### Planned Support
- **Java**: `.java`
- **Python**: `.py`
- **C#**: `.cs`

## Common Use Cases

### 1. Legacy Codebase Analysis
```bash
# Analyze a large legacy codebase
npm run scan /path/to/legacy-project -- --clear-graph --analyze --verbose

# Focus on finding architectural issues
mcp call find_architectural_issues
```

### 2. Code Review Preparation
```bash
# Before major refactoring
npm run scan /path/to/project -- --analyze --output-report

# Identify high-risk areas
mcp call calculate_package_metrics --arguments '{"package_name": "com.example.core"}'
```

### 3. Microservices Architecture Analysis
```bash
# Scan each service separately (clear all data for first service)
npm run scan /path/to/service-a -- --clear-all
npm run scan /path/to/service-b
npm run scan /path/to/service-c

# Analyze inter-service dependencies
mcp call find_classes_calling_method --arguments '{"method_name": "sendNotification"}'
```

## Troubleshooting

### Common Issues
1. **"No source files found"**: Check project path and language selection
2. **"Parse errors"**: Use `--verbose` flag to see detailed error messages
3. **Neo4j connection issues**: Verify Neo4j is running and credentials are correct

### Performance Tips
- Use `--exclude` to skip large generated directories
- Consider scanning in smaller batches for very large codebases
- Use `--include-tests` only when needed for complete analysis

## Output Files

### Scan Report
When using `--output-report`, a file `coderag-scan-report.txt` is created in the project directory with:
- Complete scan statistics
- Entity and relationship breakdowns
- Quality analysis results
- Identified issues and recommendations