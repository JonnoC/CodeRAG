import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { Neo4jClient } from '../graph/neo4j-client.js';
import { NodeManager } from '../graph/node-manager.js';
import { EdgeManager } from '../graph/edge-manager.js';
import { MetricsManager } from '../analysis/metrics-manager.js';
import { CodebaseScanner } from '../scanner/codebase-scanner.js';
import { ScanConfig, Language } from '../scanner/types.js';
import { CodeNode, CodeEdge } from '../types.js';

// Import annotation analysis tools
import { findNodesByAnnotation } from './tools/find-nodes-by-annotation.js';
import { getFrameworkUsage } from './tools/get-framework-usage.js';
import { getAnnotationUsage } from './tools/get-annotation-usage.js';
import { findDeprecatedCode, findUsageOfDeprecatedCode } from './tools/find-deprecated-code.js';
import { analyzeTestingAnnotations, findUntestableCode } from './tools/analyze-testing-annotations.js';
import { listProjects } from './tools/list-projects.js';

export abstract class BaseHandler {
  protected server: Server;
  protected nodeManager: NodeManager;
  protected edgeManager: EdgeManager;
  protected metricsManager: MetricsManager;
  protected codebaseScanner: CodebaseScanner;
  protected detailLevel: 'simple' | 'detailed' = 'detailed';

  constructor(
    protected client: Neo4jClient,
    serverName: string = 'coderag-mcp-server',
    serverVersion: string = '1.0.0',
    detailLevel: 'simple' | 'detailed' = 'detailed'
  ) {
    this.server = new Server(
      {
        name: serverName,
        version: serverVersion,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.detailLevel = detailLevel;
    this.nodeManager = new NodeManager(client);
    this.edgeManager = new EdgeManager(client);
    this.metricsManager = new MetricsManager(client);
    this.codebaseScanner = new CodebaseScanner(client);
    this.setupToolHandlers();
    this.setupPromptHandlers();
  }

  protected setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolSchemas()
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'add_node':
            return await this.handleAddNode(request.params.arguments);
          case 'update_node':
            return await this.handleUpdateNode(request.params.arguments);
          case 'get_node':
            return await this.handleGetNode(request.params.arguments);
          case 'delete_node':
            return await this.handleDeleteNode(request.params.arguments);
          case 'find_nodes_by_type':
            return await this.handleFindNodesByType(request.params.arguments);
          case 'search_nodes':
            return await this.handleSearchNodes(request.params.arguments);
          case 'add_edge':
            return await this.handleAddEdge(request.params.arguments);
          case 'get_edge':
            return await this.handleGetEdge(request.params.arguments);
          case 'delete_edge':
            return await this.handleDeleteEdge(request.params.arguments);
          case 'find_edges_by_source':
            return await this.handleFindEdgesBySource(request.params.arguments);
          case 'find_classes_calling_method':
            return await this.handleFindClassesCallingMethod(request.params.arguments);
          case 'find_classes_implementing_interface':
            return await this.handleFindClassesImplementingInterface(request.params.arguments);
          case 'get_inheritance_hierarchy':
            return await this.handleGetInheritanceHierarchy(request.params.arguments);
          case 'calculate_ck_metrics':
            return await this.handleCalculateCKMetrics(request.params.arguments);
          case 'calculate_package_metrics':
            return await this.handleCalculatePackageMetrics(request.params.arguments);
          case 'find_architectural_issues':
            return await this.handleFindArchitecturalIssues(request.params.arguments);
          case 'get_project_summary':
            return await this.handleGetProjectSummary(request.params.arguments);
          case 'add_file':
            return await this.handleAddFile(request.params.arguments);
          case 'scan_dir':
            return await this.handleScanDir(request.params.arguments);
          case 'find_nodes_by_annotation':
            return await this.handleFindNodesByAnnotation(request.params.arguments);
          case 'get_framework_usage':
            return await this.handleGetFrameworkUsage(request.params.arguments);
          case 'get_annotation_usage':
            return await this.handleGetAnnotationUsage(request.params.arguments);
          case 'find_deprecated_code':
            return await this.handleFindDeprecatedCode(request.params.arguments);
          case 'find_usage_of_deprecated_code':
            return await this.handleFindUsageOfDeprecatedCode(request.params.arguments);
          case 'analyze_testing_annotations':
            return await this.handleAnalyzeTestingAnnotations(request.params.arguments);
          case 'find_untestable_code':
            return await this.handleFindUntestableCode(request.params.arguments);
          case 'list_projects':
            return await this.handleListProjects(request.params.arguments);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  protected setupPromptHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'analyze_codebase',
          description: 'Get guidance on analyzing a codebase using CodeRAG tools',
          arguments: [
            {
              name: 'project_type',
              description: 'Type of project (java, typescript, python, etc.)',
              required: false
            }
          ]
        },
        {
          name: 'setup_code_graph',
          description: 'Step-by-step guide to set up a code graph for a new project',
          arguments: [
            {
              name: 'language',
              description: 'Programming language of the project',
              required: true
            }
          ]
        },
        {
          name: 'find_dependencies',
          description: 'Guide to find class dependencies and method calls',
          arguments: [
            {
              name: 'target_class',
              description: 'The class to analyze dependencies for',
              required: false
            }
          ]
        },
        {
          name: 'analyze_inheritance',
          description: 'Guide to analyze inheritance hierarchies and interface implementations',
          arguments: [
            {
              name: 'class_or_interface',
              description: 'Name of class or interface to analyze',
              required: false
            }
          ]
        }
      ]
    }));

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'analyze_codebase':
          return this.getAnalyzeCodebasePrompt(args);
        case 'setup_code_graph':
          return this.getSetupCodeGraphPrompt(args);
        case 'find_dependencies':
          return this.getFindDependenciesPrompt(args);
        case 'analyze_inheritance':
          return this.getAnalyzeInheritancePrompt(args);
        default:
          throw new McpError(ErrorCode.InvalidParams, `Unknown prompt: ${name}`);
      }
    });
  }

  protected getToolSchemas() {
    return [
      {
        name: 'add_node',
        description: 'Add a new code node (class, interface, method, etc.) to the graph',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to add the node to' },
            id: { type: 'string', description: 'Unique identifier for the node' },
            type: { 
              type: 'string', 
              enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module'],
              description: 'Type of code entity'
            },
            name: { type: 'string', description: 'Name of the entity' },
            qualified_name: { type: 'string', description: 'Fully qualified name' },
            description: { type: 'string', description: 'Description or documentation' },
            source_file: { type: 'string', description: 'Source file path' },
            start_line: { type: 'number', description: 'Starting line number' },
            end_line: { type: 'number', description: 'Ending line number' },
            modifiers: { type: 'array', items: { type: 'string' }, description: 'Access modifiers' },
            attributes: { type: 'object', description: 'Additional attributes' }
          },
          required: ['project', 'id', 'type', 'name', 'qualified_name']
        }
      },
      {
        name: 'update_node',
        description: 'Update an existing code node',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Node ID to update' },
            updates: { type: 'object', description: 'Fields to update' }
          },
          required: ['project', 'id', 'updates']
        }
      },
      {
        name: 'get_node',
        description: 'Get a code node by ID',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Node ID' }
          },
          required: ['project', 'id']
        }
      },
      {
        name: 'delete_node',
        description: 'Delete a code node by ID',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Node ID to delete' }
          },
          required: ['project', 'id']
        }
      },
      {
        name: 'find_nodes_by_type',
        description: 'Find nodes by their type',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            type: { 
              type: 'string',
              enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module']
            }
          },
          required: ['project', 'type']
        }
      },
      {
        name: 'search_nodes',
        description: 'Search nodes by name, qualified name, or description',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            search_term: { type: 'string', description: 'Search term' }
          },
          required: ['project', 'search_term']
        }
      },
      {
        name: 'add_edge',
        description: 'Add a relationship edge between two nodes',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Unique identifier for the edge' },
            type: {
              type: 'string',
              enum: ['calls', 'implements', 'extends', 'contains', 'references', 'throws', 'belongs_to'],
              description: 'Type of relationship'
            },
            source: { type: 'string', description: 'Source node ID' },
            target: { type: 'string', description: 'Target node ID' },
            attributes: { type: 'object', description: 'Additional edge attributes' }
          },
          required: ['project', 'id', 'type', 'source', 'target']
        }
      },
      {
        name: 'get_edge',
        description: 'Get an edge by ID',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Edge ID' }
          },
          required: ['project', 'id']
        }
      },
      {
        name: 'delete_edge',
        description: 'Delete an edge by ID',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            id: { type: 'string', description: 'Edge ID to delete' }
          },
          required: ['project', 'id']
        }
      },
      {
        name: 'find_edges_by_source',
        description: 'Find all edges originating from a source node',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            source_id: { type: 'string', description: 'Source node ID' }
          },
          required: ['project', 'source_id']
        }
      },
      {
        name: 'find_classes_calling_method',
        description: 'Find all classes that call a specific method',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            method_name: { type: 'string', description: 'Method name to search for' }
          },
          required: ['project', 'method_name']
        }
      },
      {
        name: 'find_classes_implementing_interface',
        description: 'Find all classes that implement a specific interface',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            interface_name: { type: 'string', description: 'Interface name' }
          },
          required: ['project', 'interface_name']
        }
      },
      {
        name: 'get_inheritance_hierarchy',
        description: 'Get the inheritance hierarchy for a class',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            class_name: { type: 'string', description: 'Class name' }
          },
          required: ['project', 'class_name']
        }
      },
      {
        name: 'calculate_ck_metrics',
        description: 'Calculate Chidamber & Kemerer metrics for a class (WMC, DIT, NOC, CBO, RFC, LCOM)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            class_id: { type: 'string', description: 'Class ID to analyze' }
          },
          required: ['project', 'class_id']
        }
      },
      {
        name: 'calculate_package_metrics',
        description: 'Calculate package metrics (Afferent/Efferent Coupling, Instability, Abstractness, Distance)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            package_name: { type: 'string', description: 'Package name to analyze' }
          },
          required: ['project', 'package_name']
        }
      },
      {
        name: 'find_architectural_issues',
        description: 'Find architectural issues (circular dependencies, god classes, high coupling)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' }
          },
          required: ['project']
        }
      },
      {
        name: 'get_project_summary',
        description: 'Get overall project metrics summary and quality assessment',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to analyze (optional - if not provided, analyzes all projects)', required: false }
          },
          required: []
        }
      },
      {
        name: 'add_file',
        description: 'Parse a single source file and add its entities to the graph',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to add the file to' },
            file_path: { type: 'string', description: 'Path to the source file to parse' },
            clear_existing: { 
              type: 'boolean', 
              description: 'Clear existing entities from this file before adding new ones',
              default: false
            }
          },
          required: ['project', 'file_path']
        }
      },
      {
        name: 'scan_dir',
        description: 'Scan a directory for source files and populate the graph',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to assign to scanned content' },
            directory_path: { type: 'string', description: 'Path to the directory to scan' },
            languages: { 
              type: 'array', 
              items: { 
                type: 'string',
                enum: ['typescript', 'javascript', 'java', 'python', 'csharp']
              },
              description: 'Programming languages to include (default: auto-detect)',
              default: []
            },
            exclude_paths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Paths to exclude from scanning',
              default: []
            },
            include_tests: {
              type: 'boolean',
              description: 'Include test files in the scan',
              default: false
            },
            clear_existing: {
              type: 'boolean',
              description: 'Clear existing project data before scanning',
              default: false
            },
            max_depth: {
              type: 'number',
              description: 'Maximum directory depth to scan',
              default: 10
            }
          },
          required: ['project', 'directory_path']
        }
      },
      // Annotation analysis tools
      {
        name: 'find_nodes_by_annotation',
        description: 'Find code nodes (classes, methods, etc.) that have specific annotations/decorators',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            annotation_name: {
              type: 'string',
              description: 'The annotation/decorator name to search for (e.g., @Component, @Override, staticmethod)'
            },
            framework: {
              type: 'string',
              description: 'Optional: Filter by framework (e.g., Spring, Angular, Flask, Django)'
            },
            category: {
              type: 'string',
              description: 'Optional: Filter by annotation category (e.g., web, testing, injection, persistence)'
            },
            node_type: {
              type: 'string',
              enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module'],
              description: 'Optional: Filter by node type'
            }
          },
          required: ['project', 'annotation_name']
        }
      },
      {
        name: 'get_framework_usage',
        description: 'Get statistics on framework usage based on annotations/decorators across the codebase',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            include_parameters: {
              type: 'boolean',
              description: 'Whether to include annotation parameters in the results',
              default: false
            },
            min_usage_count: {
              type: 'number',
              description: 'Minimum usage count to include in results',
              default: 1,
              minimum: 1
            }
          },
          required: ['project']
        }
      },
      {
        name: 'get_annotation_usage',
        description: 'Get comprehensive statistics on annotation/decorator usage patterns across the codebase',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            category: {
              type: 'string',
              description: 'Optional: Filter by annotation category (e.g., web, testing, injection, persistence)'
            },
            framework: {
              type: 'string',
              description: 'Optional: Filter by framework (e.g., Spring, Angular, Flask, Django)'
            },
            include_deprecated: {
              type: 'boolean',
              description: 'Whether to include deprecated annotations in results',
              default: true
            },
            group_by: {
              type: 'string',
              enum: ['annotation', 'category', 'framework'],
              description: 'How to group the results',
              default: 'annotation'
            }
          },
          required: ['project']
        }
      },
      {
        name: 'find_deprecated_code',
        description: 'Find all code elements marked as deprecated and optionally their dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            include_dependencies: {
              type: 'boolean',
              description: 'Whether to include information about what depends on deprecated code',
              default: false
            },
            node_type: {
              type: 'string',
              enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module'],
              description: 'Optional: Filter by node type'
            }
          },
          required: ['project']
        }
      },
      {
        name: 'find_usage_of_deprecated_code',
        description: 'Find code that uses deprecated elements and assess migration impact',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            include_usage_details: {
              type: 'boolean',
              description: 'Whether to include detailed information about each usage',
              default: false
            }
          },
          required: ['project']
        }
      },
      {
        name: 'analyze_testing_annotations',
        description: 'Analyze testing patterns and coverage based on test annotations/decorators',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' },
            framework: {
              type: 'string',
              description: 'Optional: Filter by testing framework (e.g., JUnit, Pytest, Jest)'
            },
            include_coverage_analysis: {
              type: 'boolean',
              description: 'Whether to include test coverage analysis',
              default: false
            }
          },
          required: ['project']
        }
      },
      {
        name: 'find_untestable_code',
        description: 'Find code patterns that may be difficult to test (private methods, static methods, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name or identifier to scope the operation to' }
          },
          required: ['project']
        }
      },
      {
        name: 'list_projects',
        description: 'List all projects in the CodeRAG graph database with optional statistics',
        inputSchema: {
          type: 'object',
          properties: {
            include_stats: {
              type: 'boolean',
              description: 'Include detailed statistics for each project (entity counts, types, etc.)',
              default: false
            },
            sort_by: {
              type: 'string',
              enum: ['name', 'created_at', 'updated_at', 'entity_count'],
              description: 'Sort projects by the specified field',
              default: 'name'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of projects to return',
              default: 100,
              minimum: 1,
              maximum: 1000
            }
          },
          required: []
        }
      }
    ];
  }

  // Prompt response methods
  protected async getAnalyzeCodebasePrompt(args: any) {
    const projectType = args?.project_type || 'any';
    const detail = this.detailLevel === 'detailed' ? this.getDetailedAnalysisPrompt(projectType) : this.getSimpleAnalysisPrompt(projectType);
    
    return {
      description: `Guide for analyzing a ${projectType} codebase using CodeRAG`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: detail
          }
        }
      ]
    };
  }

  protected async getSetupCodeGraphPrompt(args: any) {
    const language = args?.language || 'any';
    const detail = this.detailLevel === 'detailed' ? this.getDetailedSetupPrompt(language) : this.getSimpleSetupPrompt(language);

    return {
      description: `Step-by-step guide to set up a code graph for a ${language} project`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: detail
          }
        }
      ]
    };
  }

  protected async getFindDependenciesPrompt(args: any) {
    const targetClass = args?.target_class || 'your target class';
    const detail = this.detailLevel === 'detailed' ? this.getDetailedDependenciesPrompt(targetClass) : this.getSimpleDependenciesPrompt(targetClass);

    return {
      description: `Guide to find dependencies for ${targetClass}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: detail
          }
        }
      ]
    };
  }

  protected async getAnalyzeInheritancePrompt(args: any) {
    const target = args?.class_or_interface || 'your class or interface';
    const detail = this.detailLevel === 'detailed' ? this.getDetailedInheritancePrompt(target) : this.getSimpleInheritancePrompt(target);

    return {
      description: `Guide to analyze inheritance for ${target}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: detail
          }
        }
      ]
    };
  }

  // Tool handler methods
  protected async handleAddNode(args: any) {
    const node: CodeNode = {
      id: args.id,
      project_id: args.project,
      type: args.type,
      name: args.name,
      qualified_name: args.qualified_name,
      description: args.description,
      source_file: args.source_file,
      start_line: args.start_line,
      end_line: args.end_line,
      modifiers: args.modifiers,
      attributes: args.attributes
    };

    const result = await this.nodeManager.addNode(node);
    return {
      content: [{ type: 'text', text: `Node created successfully: ${JSON.stringify(result, null, 2)}` }]
    };
  }

  protected async handleUpdateNode(args: any) {
    const result = await this.nodeManager.updateNode(args.id, args.project, args.updates);
    return {
      content: [{ type: 'text', text: `Node updated successfully: ${JSON.stringify(result, null, 2)}` }]
    };
  }

  protected async handleGetNode(args: any) {
    const result = await this.nodeManager.getNode(args.id, args.project);
    return {
      content: [{ type: 'text', text: result ? JSON.stringify(result, null, 2) : 'Node not found' }]
    };
  }

  protected async handleDeleteNode(args: any) {
    const result = await this.nodeManager.deleteNode(args.id, args.project);
    return {
      content: [{ type: 'text', text: result ? 'Node deleted successfully' : 'Node not found' }]
    };
  }

  protected async handleFindNodesByType(args: any) {
    const result = await this.nodeManager.findNodesByType(args.type, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleSearchNodes(args: any) {
    const result = await this.nodeManager.searchNodes(args.search_term, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleAddEdge(args: any) {
    const edge: CodeEdge = {
      id: args.id,
      project_id: args.project,
      type: args.type,
      source: args.source,
      target: args.target,
      attributes: args.attributes
    };

    const result = await this.edgeManager.addEdge(edge);
    return {
      content: [{ type: 'text', text: `Edge created successfully: ${JSON.stringify(result, null, 2)}` }]
    };
  }

  protected async handleGetEdge(args: any) {
    const result = await this.edgeManager.getEdge(args.id, args.project);
    return {
      content: [{ type: 'text', text: result ? JSON.stringify(result, null, 2) : 'Edge not found' }]
    };
  }

  protected async handleDeleteEdge(args: any) {
    const result = await this.edgeManager.deleteEdge(args.id, args.project);
    return {
      content: [{ type: 'text', text: result ? 'Edge deleted successfully' : 'Edge not found' }]
    };
  }

  protected async handleFindEdgesBySource(args: any) {
    const result = await this.edgeManager.findEdgesBySource(args.source_id, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleFindClassesCallingMethod(args: any) {
    const result = await this.edgeManager.findClassesThatCallMethod(args.method_name, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleFindClassesImplementingInterface(args: any) {
    const result = await this.edgeManager.findClassesThatImplementInterface(args.interface_name, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleGetInheritanceHierarchy(args: any) {
    const result = await this.edgeManager.findInheritanceHierarchy(args.class_name, args.project);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleCalculateCKMetrics(args: any) {
    const result = await this.metricsManager.calculateCKMetrics(args.class_id);
    
    if (this.detailLevel === 'detailed') {
      return {
        content: [{ 
          type: 'text', 
          text: `CK Metrics for ${result.className}:

• Weighted Methods per Class (WMC): ${result.wmc}
• Depth of Inheritance Tree (DIT): ${result.dit}
• Number of Children (NOC): ${result.noc}
• Coupling Between Objects (CBO): ${result.cbo}
• Response for Class (RFC): ${result.rfc}
• Lack of Cohesion in Methods (LCOM): ${result.lcom}

Quality Assessment:
${this.assessCKMetrics(result)}

Raw Data:
${JSON.stringify(result, null, 2)}`
        }]
      };
    } else {
      return {
        content: [{ 
          type: 'text', 
          text: `CK Metrics for ${result.className}:
• WMC: ${result.wmc}, DIT: ${result.dit}, NOC: ${result.noc}
• CBO: ${result.cbo}, RFC: ${result.rfc}, LCOM: ${result.lcom}

${JSON.stringify(result, null, 2)}`
        }]
      };
    }
  }

  protected async handleCalculatePackageMetrics(args: any) {
    const result = await this.metricsManager.calculatePackageMetrics(args.package_name);
    
    if (this.detailLevel === 'detailed') {
      return {
        content: [{ 
          type: 'text', 
          text: `Package Metrics for ${result.packageName}:

• Afferent Coupling (Ca): ${result.ca}
• Efferent Coupling (Ce): ${result.ce}
• Instability (I): ${result.instability.toFixed(3)}
• Abstractness (A): ${result.abstractness.toFixed(3)}
• Distance from Main Sequence (D): ${result.distance.toFixed(3)}

Quality Assessment:
${this.assessPackageMetrics(result)}

Raw Data:
${JSON.stringify(result, null, 2)}`
        }]
      };
    } else {
      return {
        content: [{ 
          type: 'text', 
          text: `Package Metrics for ${result.packageName}:
• Ca: ${result.ca}, Ce: ${result.ce}, I: ${result.instability.toFixed(3)}
• A: ${result.abstractness.toFixed(3)}, D: ${result.distance.toFixed(3)}

${JSON.stringify(result, null, 2)}`
        }]
      };
    }
  }

  protected async handleFindArchitecturalIssues(args: any) {
    const result = await this.metricsManager.findArchitecturalIssues();
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleGetProjectSummary(args: any) {
    const result = await this.metricsManager.calculateProjectSummary();
    
    if (this.detailLevel === 'detailed') {
      return {
        content: [{ 
          type: 'text', 
          text: `📊 PROJECT SUMMARY

🏗️ STRUCTURE
  Classes: ${result.totalClasses}
  Methods: ${result.totalMethods}
  Packages: ${result.totalPackages}

📈 QUALITY SCORE: ${this.calculateQualityScore(result)}

📊 AVERAGE METRICS
  CBO (Coupling): ${result.averageMetrics.avgCBO.toFixed(2)}
  RFC (Response): ${result.averageMetrics.avgRFC.toFixed(2)}
  DIT (Inheritance): ${result.averageMetrics.avgDIT.toFixed(2)}
  LCOM (Cohesion): ${(result.averageMetrics as any).avgLCOM?.toFixed(2) || 'N/A'}

⚠️ ISSUES DETECTED: ${result.issueCount}

🎯 RECOMMENDATIONS
${result.issueCount > 0 ? 
  '• Review architectural issues using find_architectural_issues\n• Focus on reducing coupling and improving cohesion\n• Consider refactoring large classes and deep hierarchies' :
  '• Code structure appears healthy\n• Continue monitoring as codebase grows\n• Consider adding more comprehensive tests'
}

Raw Data:
${JSON.stringify(result, null, 2)}`
        }]
      };
    } else {
      return {
        content: [{ 
          type: 'text', 
          text: `Project Summary: ${result.totalClasses} classes, ${result.totalMethods} methods, ${result.issueCount} issues

${JSON.stringify(result, null, 2)}`
        }]
      };
    }
  }

  protected async handleAddFile(args: any) {
    try {
      const filePath = args.file_path;
      const clearExisting = args.clear_existing || false;

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        return {
          content: [{ type: 'text', text: `❌ File not found: ${filePath}` }]
        };
      }

      // Clear existing entities from this file if requested
      if (clearExisting) {
        const query = `
          MATCH (n {source_file: $filePath, project: $project})
          DETACH DELETE n
        `;
        await this.client.runQuery(query, { filePath, project: args.project });
      }

      // Read file content
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // Find appropriate parser
      const parser = this.findParser(filePath);
      if (!parser) {
        const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.java', '.py'];
        return {
          content: [{ 
            type: 'text', 
            text: `❌ Unsupported file type: ${filePath}\nSupported extensions: ${supportedExtensions.join(', ')}` 
          }]
        };
      }

      // Parse the file
      const parseResult = await parser.parseFile(filePath, content, args.project);

      // Store entities and relationships
      await this.storeParseResult(parseResult, args.project);

      const summary = `✅ File parsed successfully: ${filePath}

📊 Results:
  • Entities found: ${parseResult.entities.length}
  • Relationships found: ${parseResult.relationships.length}
  • Errors: ${parseResult.errors.length}

🏗️ Entity Types:
${this.summarizeEntityTypes(parseResult.entities)}

${parseResult.errors.length > 0 ? `
⚠️ Parse Errors:
${parseResult.errors.slice(0, 5).map((e: any) => `  • Line ${e.line || '?'}: ${e.message}`).join('\n')}
${parseResult.errors.length > 5 ? `  ... and ${parseResult.errors.length - 5} more` : ''}
` : ''}`;

      return {
        content: [{ type: 'text', text: summary }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to parse file: ${error instanceof Error ? error.message : String(error)}` 
        }]
      };
    }
  }

  protected async handleScanDir(args: any) {
    try {
      const directoryPath = args.directory_path;
      const languages = args.languages?.length > 0 ? args.languages : undefined;
      const excludePaths = args.exclude_paths || [];
      const includeTests = args.include_tests || false;
      const clearExisting = args.clear_existing || false;
      const maxDepth = args.max_depth || 10;

      // Check if directory exists
      const fs = await import('fs');
      if (!fs.existsSync(directoryPath)) {
        return {
          content: [{ type: 'text', text: `❌ Directory not found: ${directoryPath}` }]
        };
      }

      // Validate project structure first
      const validation = await this.codebaseScanner.validateProjectStructure(directoryPath);
      
      if (!validation.isValid) {
        return {
          content: [{ 
            type: 'text', 
            text: `❌ Invalid project structure:\n${validation.suggestions.join('\n')}` 
          }]
        };
      }

      // Prepare scan configuration
      const scanConfig: ScanConfig = {
        projectPath: directoryPath,
        projectId: args.project,
        projectName: args.project,
        languages: languages || validation.detectedLanguages,
        excludePaths,
        includeTests,
        maxDepth,
        outputProgress: false // We'll handle our own progress reporting
      };

      // Clear existing project data if requested
      if (clearExisting) {
        await this.codebaseScanner.clearGraph(args.project);
      }

      // Perform the scan
      console.log(`🔍 Scanning directory: ${directoryPath}`);
      const scanResult = await this.codebaseScanner.scanProject(scanConfig);

      // Generate detailed report
      const report = await this.codebaseScanner.generateScanReport(scanResult);

      return {
        content: [{ type: 'text', text: report }]
      };

    } catch (error) {
      return {
        content: [{ 
          type: 'text', 
          text: `❌ Failed to scan directory: ${error instanceof Error ? error.message : String(error)}` 
        }]
      };
    }
  }

  // Helper methods
  protected findParser(filePath: string): any {
    const parsers = [
      this.codebaseScanner['parsers'].get('typescript'),
      this.codebaseScanner['parsers'].get('java'),
      this.codebaseScanner['parsers'].get('python')
    ];

    for (const parser of parsers) {
      if (parser && parser.canParse(filePath)) {
        return parser;
      }
    }
    return null;
  }

  protected async storeParseResult(parseResult: any, project: string): Promise<void> {
    // Store entities - they already have project_id from the parsers
    for (const entity of parseResult.entities) {
      try {
        await this.nodeManager.addNode(entity);
      } catch (error) {
        // Skip duplicates
        if (!(error instanceof Error) || !error.message.includes('already exists')) {
          console.warn(`Failed to store entity ${entity.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    // Store relationships - they already have project_id from the parsers
    for (const relationship of parseResult.relationships) {
      try {
        await this.edgeManager.addEdge(relationship);
      } catch (error) {
        // Skip duplicates
        if (!(error instanceof Error) || !error.message.includes('already exists')) {
          console.warn(`Failed to store relationship ${relationship.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  protected summarizeEntityTypes(entities: any[]): string {
    const typeCounts = entities.reduce((acc, entity) => {
      acc[entity.type] = (acc[entity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([type, count]) => `  • ${type}: ${count}`)
      .join('\n') || '  No entities found';
  }

  // Quality assessment methods
  protected assessCKMetrics(result: any): string {
    const issues: string[] = [];
    
    if (result.wmc > 15) issues.push("High WMC: Consider breaking down this class");
    if (result.dit > 4) issues.push("Deep inheritance: Consider composition over inheritance");
    if (result.noc > 7) issues.push("Many children: Consider interface segregation");
    if (result.cbo > 10) issues.push("High coupling: Reduce dependencies");
    if (result.rfc > 30) issues.push("High RFC: Class is doing too much");
    if (result.lcom > 0.7) issues.push("Low cohesion: Methods don't work together well");
    
    if (issues.length === 0) {
      return "✅ Class metrics appear healthy";
    }
    
    return "⚠️ Issues detected:\n" + issues.map(issue => `• ${issue}`).join('\n');
  }

  protected assessPackageMetrics(result: any): string {
    const issues: string[] = [];
    
    if (result.instability > 0.7 && result.abstractness < 0.3) {
      issues.push("Zone of Pain: Stable and concrete - hard to extend");
    }
    if (result.instability < 0.3 && result.abstractness > 0.7) {
      issues.push("Zone of Uselessness: Abstract and stable but not used");
    }
    if (result.distance > 0.7) {
      issues.push("Poorly balanced abstraction vs instability");
    }
    if (result.ce === 0 && result.ca === 0) {
      issues.push("Isolated package - no dependencies");
    }
    
    if (issues.length === 0) {
      return "✅ Package design appears well-balanced";
    }
    
    return "⚠️ Issues detected:\n" + issues.map(issue => `• ${issue}`).join('\n');
  }

  protected calculateQualityScore(summary: any): string {
    let score = 100;
    
    // Penalize high averages
    if (summary.averageMetrics.avgCBO > 10) score -= 20;
    if (summary.averageMetrics.avgRFC > 30) score -= 15;
    if (summary.averageMetrics.avgDIT > 4) score -= 10;
    
    // Penalize issues
    score -= summary.issueCount * 5;
    
    score = Math.max(0, score);
    
    if (score >= 90) return `${score}/100 (Excellent)`;
    if (score >= 75) return `${score}/100 (Good)`;
    if (score >= 60) return `${score}/100 (Fair)`;
    if (score >= 40) return `${score}/100 (Poor)`;
    return `${score}/100 (Critical)`;
  }

  // Prompt content generators
  protected getDetailedAnalysisPrompt(projectType: string): string {
    return `I want to analyze my ${projectType} codebase. Here's how to use CodeRAG effectively:

## 1. First, explore what's already in the graph:
Use \`search_nodes\` with broad terms to see existing code entities:
- Search for package names or module names
- Search for main class names
- Use \`find_nodes_by_type\` to see all classes, interfaces, etc.

## 2. Understand the codebase structure:
- Use \`get_project_summary\` for overall metrics
- Use \`calculate_ck_metrics\` on key classes
- Use \`find_architectural_issues\` to spot problems

## 3. Explore relationships:
- Use \`get_inheritance_hierarchy\` for inheritance chains
- Use \`find_classes_implementing_interface\` for interface usage
- Use \`find_classes_calling_method\` for method dependencies

## 4. Focus on quality:
- Review CK metrics for complex classes (WMC > 15, CBO > 10)
- Check package metrics for architectural balance
- Address architectural issues found

What aspect would you like to explore first?`;
  }

  protected getSimpleAnalysisPrompt(projectType: string): string {
    return `Quick ${projectType} analysis guide:
1. \`get_project_summary\` - Overview
2. \`search_nodes\` - Find entities  
3. \`get_inheritance_hierarchy\` - Class relationships
4. \`find_architectural_issues\` - Spot problems`;
  }

  protected getDetailedSetupPrompt(language: string): string {
    return `Setting up a code graph for ${language} project:

## Step 1: Scan your codebase
Use \`scan_dir\` with your project path:
- Point to your source directory
- Include test files if desired
- Exclude build/dist directories

## Step 2: Validate the scan
- Check \`get_project_summary\` for overview
- Use \`search_nodes\` to spot-check entities
- Verify relationships with \`find_nodes_by_type\`

## Step 3: Analyze structure  
- Run \`find_architectural_issues\`
- Check key classes with \`calculate_ck_metrics\`
- Review package design with \`calculate_package_metrics\`

## Step 4: Explore relationships
- Map inheritance with \`get_inheritance_hierarchy\`
- Find interface usage patterns
- Trace method calls and dependencies

Ready to start scanning?`;
  }

  protected getSimpleSetupPrompt(language: string): string {
    return `${language} setup steps:
1. \`scan_dir\` - Scan your project
2. \`get_project_summary\` - Check results
3. \`find_architectural_issues\` - Find problems
4. Explore with other tools as needed`;
  }

  protected getDetailedDependenciesPrompt(targetClass: string): string {
    return `Finding dependencies for ${targetClass}:

## 1. Find what ${targetClass} depends on:
Use \`find_edges_by_source\` with ${targetClass} ID to see:
- What methods it calls (\`calls\` edges)
- What interfaces it implements (\`implements\` edges)  
- What classes it extends (\`extends\` edges)
- What it references (\`references\` edges)

## 2. Find what depends on ${targetClass}:
- Use \`find_classes_calling_method\` for methods in ${targetClass}
- Look for \`implements\` edges if ${targetClass} is an interface
- Check inheritance with \`get_inheritance_hierarchy\`

## 3. Analyze coupling:
- Use \`calculate_ck_metrics\` for ${targetClass} CBO score
- High CBO (>10) indicates tight coupling
- Review each dependency's necessity

## 4. Visualization approach:
Create a dependency map by following the edge chains to understand the full dependency network.

Which direction would you like to explore first?`;
  }

  protected getSimpleDependenciesPrompt(targetClass: string): string {
    return `Find ${targetClass} dependencies:
1. \`find_edges_by_source\` - What it uses
2. \`find_classes_calling_method\` - What uses it
3. \`calculate_ck_metrics\` - Check coupling score
4. Follow the edge chains for full picture`;
  }

  protected getDetailedInheritancePrompt(target: string): string {
    return `Analyzing inheritance for ${target}:

## 1. Map the hierarchy:
Use \`get_inheritance_hierarchy\` for ${target} to see:
- All parent classes/interfaces
- All child classes (if any)
- Inheritance depth and breadth

## 2. Find implementations:
If ${target} is an interface:
- Use \`find_classes_implementing_interface\`
- Check for multiple implementations
- Look for strategy or factory patterns

## 3. Find children:
Search for edges with type "extends" targeting ${target}:
- Use \`find_edges_by_target\` with ${target} ID
- Filter for \`type: "extends"\`

## 4. Analyze Design Patterns
Look for common patterns:

**Strategy Pattern**: 
- Interface with multiple implementations
- Use \`find_classes_implementing_interface\`

**Template Method**:
- Abstract class with concrete subclasses
- Check inheritance hierarchy depth

**Polymorphism Usage**:
- Find which methods call interface methods
- Use \`find_classes_calling_method\` on interface methods

## 5. Architecture Analysis
Evaluate your inheritance design:
- **Deep hierarchies** (>3 levels): Consider composition
- **Wide hierarchies** (>7 implementations): Consider breaking interfaces
- **Diamond inheritance**: Check for interface conflicts

What aspect of inheritance would you like to explore first?`;
  }

  protected getSimpleInheritancePrompt(target: string): string {
    return `Analyze ${target} inheritance:
1. \`get_inheritance_hierarchy\` - See ancestry
2. \`find_classes_implementing_interface\` - See implementations  
3. \`search_nodes\` with interface name - Find related entities
4. \`find_classes_calling_method\` - See usage patterns`;
  }

  // Annotation analysis handler methods
  protected async handleFindNodesByAnnotation(args: any) {
    const result = await findNodesByAnnotation(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleGetFrameworkUsage(args: any) {
    const result = await getFrameworkUsage(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleGetAnnotationUsage(args: any) {
    const result = await getAnnotationUsage(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleFindDeprecatedCode(args: any) {
    const result = await findDeprecatedCode(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleFindUsageOfDeprecatedCode(args: any) {
    const result = await findUsageOfDeprecatedCode(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleAnalyzeTestingAnnotations(args: any) {
    const result = await analyzeTestingAnnotations(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleFindUntestableCode(args: any) {
    const result = await findUntestableCode(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  protected async handleListProjects(args: any) {
    const result = await listProjects(this.client, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  // Abstract methods for transport-specific functionality
  abstract start(): Promise<void>;
}