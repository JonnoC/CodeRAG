# CodeRAG - Graph-Powered Code Analysis

**Transform your codebase into an intelligent knowledge graph for AI-powered insights**

CodeRAG is a revolutionary tool that builds a comprehensive graph database of your code structure using Neo4J. By mapping classes, methods, relationships, and dependencies, it enables AI assistants to understand your codebase at a deeper level and provide more accurate, context-aware assistance.

## What CodeRAG Does

🔍 **Smart Code Scanning** - Automatically analyzes your codebase and builds a detailed graph of all classes, methods, interfaces, and their relationships

🧠 **Semantic Code Search** - Find code by functionality using natural language queries like "functions that validate email addresses"

📊 **Quality Insights** - Calculates industry-standard metrics (CK metrics, package coupling, architectural patterns) to identify code smells and improvement opportunities  

🤖 **AI Integration** - Connects seamlessly with AI coding assistants through the Model Context Protocol (MCP), giving them deep understanding of your code structure

🏗️ **Architecture Analysis** - Visualizes inheritance hierarchies, dependency chains, and architectural patterns to help you understand complex codebases

## Perfect For

- **Code Reviews** - Get AI assistance that understands your entire codebase context
- **Onboarding** - Help new team members quickly understand large, complex projects  
- **Refactoring** - Identify tightly coupled code, circular dependencies, and architectural issues
- **Documentation** - Generate insights about code relationships and design patterns
- **Legacy Analysis** - Map and understand inherited codebases with complex structures

## Supported Languages

- TypeScript & JavaScript 
- Java
- Python
- C# *(coming soon)*

## Quick Start

Get up and running in 5 minutes:

1. **Clone and Install**
   ```bash
   git clone https://github.com/JonnoC/CodeRAG.git
   cd CodeRAG
   npm install
   ```

2. **Setup Neo4J Database** (see our [detailed guide](docs/user-guide.md) for help)
   ```bash
   # Using Docker (easiest)
   docker run --name neo4j-coderag -p 7474:7474 -p 7687:7687 -d \
     --env NEO4J_AUTH=neo4j/your_password neo4j:5.12
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Neo4J credentials and OpenAI API key for semantic search
   ```

4. **Scan Your First Project**
   ```bash
   npm run build
   npm run scan /path/to/your/project
   ```

5. **Connect to Your AI Assistant**
   
   Add to your AI tool's MCP configuration:
   ```json
   {
     "mcpServers": {
       "coderag": {
         "command": "node",
         "args": ["/path/to/CodeRAG/build/index.js"]
       }
     }
   }
   ```

📖 **[Read the Complete User Guide](docs/user-guide.md)** for detailed setup instructions, AI tool integrations, and advanced usage.

## Key Features

- 🔧 **Automated Scanning** - Parses TypeScript, JavaScript, Java, and Python projects
- 🧠 **Semantic Search** - Natural language code discovery powered by OpenAI embeddings
- 🎯 **Smart Analysis** - Identifies classes, methods, interfaces, inheritance, and dependencies  
- 📈 **Quality Metrics** - CK metrics, package coupling, architectural issue detection
- 🤖 **AI-Ready** - Integrates with Claude Code, Windsurf, Cursor, VS Code Continue, and more
- 💡 **Guided Prompts** - Interactive workflows for code analysis and exploration
- 🔄 **Dual Modes** - STDIO for direct AI integration, HTTP for web-based tools

## Example Use Cases

### 🧠 **Semantic Code Search**
*"Find functions that validate email addresses"*
```
Use semantic_search with query="functions that validate email addresses"
```

### 🕵️ **Code Investigation**
*"Show me all the classes that call the `authenticate` method"*
```
Use find_classes_calling_method with method_name="authenticate"
```

### 🏗️ **Architecture Review** 
*"What are the architectural issues in this codebase?"*
```
Use find_architectural_issues to detect circular dependencies, god classes, and high coupling
```

### 📊 **Quality Assessment**
*"How complex is my UserService class?"*
```
Use calculate_ck_metrics for class_id="com.example.UserService"
```

### 🔄 **Similar Code Discovery**
*"Find code similar to this authentication function"*
```
Use get_similar_code with node_id="auth_function_id"
```

## Common Commands

```bash
# Quick project scan (includes semantic embedding generation if enabled)
npm run scan /path/to/project

# Start for AI assistant integration  
npm start

# Run quality analysis
npm run scan /path/to/project -- --analyze

# Initialize semantic search (setup vector indexes)
node build/index.js --tool initialize_semantic_search

# Update embeddings for existing projects
node build/index.js --tool update_embeddings --project-id my-project

# Start web server for HTTP access
npm start -- --sse --port 3000
```

## Documentation

📚 **[Complete User Guide](docs/user-guide.md)** - Detailed setup, integrations, and workflows

## Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to help improve CodeRAG.

## License

MIT - see [LICENSE](LICENSE) for details.