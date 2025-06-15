# CodeRAG - Enterprise Code Intelligence Platform

**Advanced graph-based code analysis for AI-assisted software development**

CodeRAG is a professional code intelligence platform that transforms complex software projects into searchable knowledge graphs. By mapping code structures, dependencies, and relationships, it enables AI development tools to provide contextually accurate assistance for enterprise-scale codebases.

## What CodeRAG Does

CodeRAG creates a comprehensive graph database representation of your codebase using Neo4J, enabling sophisticated analysis and AI-powered insights:

- **Automated Code Analysis** - Scans and maps classes, methods, interfaces, dependencies, and architectural relationships across multiple programming languages
- **Intelligent Language Detection** - Automatically identifies project languages, frameworks, and build configurations from metadata and build files  
- **Quality Assessment** - Calculates industry-standard software metrics (CK metrics, package coupling, architectural patterns) to identify technical debt and improvement opportunities
- **Semantic Code Search** - Enables natural language queries to find code by functionality rather than syntax
- **Multi-Project Management** - Supports enterprise environments with multiple codebases, providing unified analysis and cross-project insights

## Who Should Use CodeRAG

### Enterprise Development Teams
- **Large-scale projects** with complex architectures requiring deep code understanding
- **Legacy system maintenance** where comprehensive codebase mapping is essential
- **Code quality initiatives** needing objective metrics and architectural analysis

### AI-Assisted Development
- **Development teams using AI coding assistants** (Claude Code, GitHub Copilot, Cursor, Windsurf) who need enhanced contextual awareness
- **Code review processes** requiring comprehensive understanding of change impacts
- **Architectural decision-making** supported by data-driven insights

### Software Engineering Leadership
- **Technical leads** managing code quality and architectural compliance
- **Engineering managers** tracking technical debt and team productivity
- **Architects** designing and maintaining system boundaries and dependencies

## Key Use Cases

### Code Review Enhancement
Provide AI assistants with comprehensive codebase context, enabling more accurate suggestions and impact analysis during code reviews.

### Onboarding Acceleration  
Help new team members quickly understand complex codebases through interactive exploration and relationship mapping.

### Technical Debt Management
Identify architectural issues, code smells, and coupling problems with objective metrics and actionable insights.

### Legacy System Modernization
Map existing system architectures and dependencies to inform refactoring strategies and modernization planning.

### Architectural Compliance
Monitor adherence to architectural principles and detect violations or degradation over time.

## Supported Technologies

### Programming Languages
- **TypeScript** and **JavaScript** - Full ES6+ support with framework detection
- **Java** - Comprehensive analysis including Spring Boot ecosystem
- **Python** - Complete support with framework identification
- **C#** *(planned)* - .NET ecosystem support in development

### Enterprise Frameworks
- **Spring Boot**, **Spring Framework** - Java enterprise applications
- **React**, **Angular**, **Vue.js** - Modern frontend frameworks  
- **NestJS**, **Express** - Node.js backend frameworks
- **Django**, **FastAPI** - Python web frameworks

## Getting Started

Ready to enhance your development workflow with intelligent code analysis? Our comprehensive [User Guide](docs/user-guide.md) provides everything you need to set up and integrate CodeRAG with your development environment.

## Enterprise Features

### Multi-Project Management
- **Project Isolation** - Separate analysis for different codebases with unified management
- **Cross-Project Analysis** - Compare metrics and patterns across multiple projects
- **Bulk Operations** - Efficient scanning and analysis of multiple repositories

### Quality Metrics
- **CK Metrics Suite** - Weighted Methods per Class, Coupling Between Objects, Response for Class
- **Package Metrics** - Afferent/Efferent Coupling, Instability, Abstractness
- **Architectural Analysis** - Circular dependency detection, design pattern identification

### Advanced Search Capabilities  
- **Semantic Search** - Natural language queries powered by AI embeddings
- **Relationship Mapping** - Trace dependencies, inheritance hierarchies, and method calls
- **Pattern Detection** - Identify design patterns and architectural structures

## Documentation

### Getting Started
- **[Installation & Setup Guide](docs/installation-setup.md)** - Comprehensive setup instructions
- **[AI Integration Guide](docs/ai-integration.md)** - Connect to Claude Code, Cursor, Windsurf, and other AI tools
- **[User Guide](docs/user-guide.md)** - Complete feature overview and workflows

### Advanced Usage
- **[Scanner Usage](docs/scanner-usage.md)** - Detailed scanning options and project analysis
- **[Quality Metrics](docs/quality-metrics.md)** - Understanding and interpreting code quality measurements  
- **[Multi-Project Management](docs/multi-project-management.md)** - Enterprise-scale project organization
- **[Semantic Search](docs/semantic-search.md)** - Natural language code discovery

### Reference
- **[Available Tools](docs/available-tools.md)** - Complete API reference for all 23 analysis tools
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## Professional Support

CodeRAG is designed for professional software development environments. The platform provides:

- **Comprehensive Documentation** - Detailed guides for setup, integration, and advanced usage
- **Enterprise Architecture** - Scalable design supporting large codebases and multiple projects  
- **Quality Assurance** - Extensive test suite with 402+ tests ensuring reliability
- **Open Source** - MIT licensed with transparent development and community contributions

## Contributing

We welcome contributions from the software development community. Please review our contributing guidelines and submit pull requests to help improve CodeRAG's capabilities.

## License

MIT License - see [LICENSE](LICENSE) for complete terms.

---

**Ready to enhance your AI-assisted development workflow?** Start with our [Installation & Setup Guide](docs/installation-setup.md) to begin analyzing your codebase in minutes.