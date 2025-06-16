# CodeRAG User Guide

CodeRAG is a powerful MCP (Model Context Protocol) Server that creates a graph database representation of your codebase using Neo4J. This enables advanced code analysis, relationship mapping, and AI-powered insights about your code structure.

## Quick Start

For a complete setup guide, see [Installation & Setup](installation-setup.md).

### Essential Steps

1. **Install Prerequisites**: Node.js 18+, Neo4J 5.11+
2. **Clone and Build**: `git clone repo && npm install && npm run build`
3. **Configure Environment**: Create `.env` with Neo4J connection details
4. **Start Neo4J**: Launch your Neo4J database
5. **Integrate with AI Tool**: Configure MCP server in your AI assistant
6. **Scan Your Project**: Use the scanner to populate the graph

## Documentation Structure

This user guide is organized into focused sections:

### 🚀 Getting Started
- **[Installation & Setup](installation-setup.md)** - Prerequisites, installation, and configuration
- **[AI Integration](ai-integration.md)** - Connect CodeRAG to Claude Code, Windsurf, Cursor, and other AI tools

### 🔍 Core Usage
- **[Scanner Usage](scanner-usage.md)** - Scan your codebase and populate the graph database
- **[Available Tools](available-tools.md)** - Complete reference of all 23 CodeRAG tools
- **[Semantic Search](semantic-search.md)** - Natural language code discovery with AI embeddings
- **[MCP Prompts Guide](mcp-prompts.md)** - Guided workflows for effective code analysis

### 📊 Advanced Features  
- **[Multi-Project Management](multi-project-management.md)** - Manage multiple codebases in one database
- **[Quality Metrics](quality-metrics.md)** - Understand CK metrics, package metrics, and architectural analysis

### 🔧 Support
- **[Troubleshooting](troubleshooting.md)** - Diagnose and resolve common issues

## What CodeRAG Does

CodeRAG transforms your codebase into a searchable graph database, enabling:

- **🔍 Advanced Code Analysis** - Find complex relationships and dependencies
- **🧠 Semantic Code Search** - Find code by functionality using natural language queries
- **📊 Quality Metrics** - Calculate industry-standard metrics (CK metrics, package coupling)  
- **🏗️ Architecture Insights** - Detect design patterns, architectural issues, and violations
- **🤖 AI-Powered Exploration** - Use natural language to query your codebase structure
- **📈 Multi-Project Management** - Analyze multiple codebases in a unified view
- **🌐 Remote Repository Analysis** - Scan GitHub, GitLab, and Bitbucket repositories directly
- **🎯 Smart Language Detection** - Automatically detects project languages from build files and metadata
- **🏗️ Mono-Repository Support** - Handles complex projects with multiple languages and sub-projects

## Example Workflows

### Analyzing a New Project

**Local Project:**
1. **Auto-scan the project (languages detected automatically):**
   ```
   Use scan_dir to scan /path/to/my/project with clear_existing=true
   ```
   *The scanner will automatically detect TypeScript, Java, Python, etc. from build files*

**Remote Repository:**
1. **Scan directly from GitHub/GitLab/Bitbucket:**
   ```
   Use scan_remote_repo with repository_url=https://github.com/owner/repo.git
   ```
   *Automatically clones, scans, and cleans up the repository*

2. **Get overview with project metadata:**
   ```
   Use get_project_summary to show me the codebase overview
   ```
   *Includes auto-extracted project name, version, framework information*

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

### Semantic Code Discovery

1. **Search by functionality:**
   ```
   Use semantic_search with query="functions that validate user input"
   ```

2. **Find similar code:**
   ```
   Use get_similar_code for node_id="UserValidator.validateEmail"
   ```

3. **Update embeddings after changes:**
   ```
   Use update_embeddings for project_id="my-project"
   ```

## Quick Reference Card

### Essential Commands
```bash
# Setup
npm install && npm run build

# Auto-detect and scan project (recommended)
npm run scan /path/to/project

# Scan remote repository
npm run scan https://github.com/owner/repo.git

# Scan multiple projects (multi-project support)
npm run scan /path/to/project1
npm run scan /path/to/project2

# List all scanned projects
Use list_projects tool to see all projects with statistics

# Start STDIO mode
npm start

# Start HTTP mode
npm start -- --sse --port 3000
```

### Key MCP Tools
- `scan_dir` - Scan local codebase
- `scan_remote_repo` - Scan remote repositories
- `semantic_search` - Natural language code search
- `get_project_summary` - Overview
- `find_architectural_issues` - Find problems
- `calculate_ck_metrics` - Class quality
- `get_similar_code` - Find similar code entities
- `get_inheritance_hierarchy` - Class relationships

### MCP Prompts
- `setup_code_graph` - New project setup
- `analyze_codebase` - General analysis
- `find_dependencies` - Dependency analysis  
- `analyze_inheritance` - Inheritance analysis

## Need More Help?

This overview gets you started quickly. For detailed information:

- 🚀 **New to CodeRAG?** Start with [Installation & Setup](installation-setup.md)
- 🔧 **Having issues?** Check [Troubleshooting](troubleshooting.md)
- 📖 **Want comprehensive info?** Each section above links to detailed guides

The combination of automated scanning, quality metrics, and AI-powered analysis makes CodeRAG a powerful tool for understanding and improving your codebase architecture.