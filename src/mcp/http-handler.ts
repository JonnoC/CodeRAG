import express from 'express';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { Neo4jClient } from '../graph/neo4j-client.js';
import { NodeManager } from '../graph/node-manager.js';
import { EdgeManager } from '../graph/edge-manager.js';
import { MetricsManager } from '../analysis/metrics-manager.js';

export class HTTPHandler {
  private app: express.Application;
  private port: number;
  private streamableTransports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private sseTransports: { [sessionId: string]: SSEServerTransport } = {};
  private client: Neo4jClient;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;
  private metricsManager: MetricsManager;


  private setupMiddleware(): void {
    // Basic request logging
    this.app.use((req, res, next) => {
      // Only log non-SSE requests and errors
      if (req.url !== '/sse' && !req.url.startsWith('/sse?')) {
        console.log(`${req.method} ${req.url}`);
      }
      next();
    });

    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, mcp-session-id');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  private server: McpServer;

  constructor(
    client: Neo4jClient,
    port: number = 3000,
    private serverName: string = 'coderag-mcp-server',
    private serverVersion: string = '1.0.0'
  ) {
    this.client = client;
    this.port = port;
    this.app = express();
    this.nodeManager = new NodeManager(client);
    this.edgeManager = new EdgeManager(client);
    this.metricsManager = new MetricsManager(client);
    
    // Create server once with all tools and prompts
    this.server = this.createServer();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private createServer(): McpServer {
    const server = new McpServer({
      name: this.serverName,
      version: this.serverVersion
    });

    // Tool: Find nodes by type
    server.tool(
      'find_nodes_by_type',
      {
        nodeType: z.enum(['Class', 'Interface', 'Enum', 'Exception', 'Method', 'Function', 'Field', 'Package', 'Module']),
        projectId: z.string()
      },
      async ({ nodeType, projectId }) => {
        const nodes = await this.nodeManager.findNodesByType(nodeType as any, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(nodes, null, 2)
          }]
        };
      }
    );

    // Tool: Search nodes
    server.tool(
      'search_nodes',
      {
        searchTerm: z.string(),
        projectId: z.string()
      },
      async ({ searchTerm, projectId }) => {
        const nodes = await this.nodeManager.searchNodes(searchTerm, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(nodes, null, 2)
          }]
        };
      }
    );

    // Tool: Get node details
    server.tool(
      'get_node',
      {
        nodeId: z.string(),
        projectId: z.string()
      },
      async ({ nodeId, projectId }) => {
        const node = await this.nodeManager.getNode(nodeId, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(node, null, 2)
          }]
        };
      }
    );

    // Tool: Find inheritance hierarchy
    server.tool(
      'find_inheritance_hierarchy',
      {
        className: z.string(),
        projectId: z.string()
      },
      async ({ className, projectId }) => {
        const hierarchy = await this.edgeManager.findInheritanceHierarchy(className, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(hierarchy, null, 2)
          }]
        };
      }
    );

    // Tool: Find implementations
    server.tool(
      'find_implementations',
      {
        interfaceName: z.string(),
        projectId: z.string()
      },
      async ({ interfaceName, projectId }) => {
        const implementations = await this.edgeManager.findClassesThatImplementInterface(interfaceName, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(implementations, null, 2)
          }]
        };
      }
    );

    // Tool: Find method callers
    server.tool(
      'find_method_callers',
      {
        methodName: z.string(),
        projectId: z.string()
      },
      async ({ methodName, projectId }) => {
        const callers = await this.edgeManager.findClassesThatCallMethod(methodName, projectId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(callers, null, 2)
          }]
        };
      }
    );

    // Tool: Calculate CK metrics
    server.tool(
      'calculate_ck_metrics',
      {
        classId: z.string()
      },
      async ({ classId }) => {
        const metrics = await this.metricsManager.calculateCKMetrics(classId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(metrics, null, 2)
          }]
        };
      }
    );

    // Tool: Calculate package metrics
    server.tool(
      'calculate_package_metrics',
      {
        packageName: z.string()
      },
      async ({ packageName }) => {
        const metrics = await this.metricsManager.calculatePackageMetrics(packageName);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(metrics, null, 2)
          }]
        };
      }
    );

    // Tool: Find architectural issues
    server.tool(
      'find_architectural_issues',
      {},
      async () => {
        const issues = await this.metricsManager.findArchitecturalIssues();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(issues, null, 2)
          }]
        };
      }
    );

    // Tool: List projects  
    server.tool(
      'list_projects',
      {
        includeStats: z.boolean().optional(),
        sortBy: z.enum(['name', 'created_at', 'updated_at', 'entity_count']).optional(),
        limit: z.number().optional()
      },
      async ({ includeStats = false, sortBy = 'name', limit = 100 }) => {
        const { listProjects } = await import('./tools/list-projects.js');
        const result = await listProjects(this.client, { 
          include_stats: includeStats, 
          sort_by: sortBy, 
          limit 
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Tool: Add node
    server.tool(
      'add_node',
      {
        project: z.string(),
        id: z.string(),
        type: z.enum(['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module']),
        name: z.string(),
        qualified_name: z.string(),
        description: z.string().optional(),
        source_file: z.string().optional(),
        start_line: z.number().optional(),
        end_line: z.number().optional(),
        modifiers: z.array(z.string()).optional(),
        attributes: z.object({}).optional()
      },
      async (args) => {
        const node = {
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
          content: [{
            type: 'text',
            text: `Node created successfully: ${JSON.stringify(result, null, 2)}`
          }]
        };
      }
    );

    // Tool: Update node
    server.tool(
      'update_node',
      {
        project: z.string(),
        id: z.string(),
        updates: z.object({})
      },
      async ({ project, id, updates }) => {
        const result = await this.nodeManager.updateNode(id, project, updates);
        return {
          content: [{
            type: 'text',
            text: `Node updated successfully: ${JSON.stringify(result, null, 2)}`
          }]
        };
      }
    );

    // Tool: Delete node
    server.tool(
      'delete_node',
      {
        project: z.string(),
        id: z.string()
      },
      async ({ project, id }) => {
        const result = await this.nodeManager.deleteNode(id, project);
        return {
          content: [{
            type: 'text',
            text: result ? 'Node deleted successfully' : 'Node not found'
          }]
        };
      }
    );

    // Tool: Add edge
    server.tool(
      'add_edge',
      {
        project: z.string(),
        id: z.string(),
        type: z.enum(['calls', 'implements', 'extends', 'contains', 'references', 'throws', 'belongs_to']),
        source: z.string(),
        target: z.string(),
        attributes: z.object({}).optional()
      },
      async (args) => {
        const edge = {
          id: args.id,
          project_id: args.project,
          type: args.type,
          source: args.source,
          target: args.target,
          attributes: args.attributes
        };
        const result = await this.edgeManager.addEdge(edge);
        return {
          content: [{
            type: 'text',
            text: `Edge created successfully: ${JSON.stringify(result, null, 2)}`
          }]
        };
      }
    );

    // Tool: Get edge
    server.tool(
      'get_edge',
      {
        project: z.string(),
        id: z.string()
      },
      async ({ project, id }) => {
        const result = await this.edgeManager.getEdge(id, project);
        return {
          content: [{
            type: 'text',
            text: result ? JSON.stringify(result, null, 2) : 'Edge not found'
          }]
        };
      }
    );

    // Tool: Delete edge
    server.tool(
      'delete_edge',
      {
        project: z.string(),
        id: z.string()
      },
      async ({ project, id }) => {
        const result = await this.edgeManager.deleteEdge(id, project);
        return {
          content: [{
            type: 'text',
            text: result ? 'Edge deleted successfully' : 'Edge not found'
          }]
        };
      }
    );

    // Tool: Find edges by source
    server.tool(
      'find_edges_by_source',
      {
        project: z.string(),
        sourceId: z.string()
      },
      async ({ project, sourceId }) => {
        const result = await this.edgeManager.findEdgesBySource(sourceId, project);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Tool: Project summary
    server.tool(
      'get_project_summary',
      {
        project: z.string().optional()
      },
      async ({ project }) => {
        const result = await this.metricsManager.calculateProjectSummary();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Tool: Add file (scanning)
    server.tool(
      'add_file',
      {
        project: z.string(),
        file_path: z.string(),
        clear_existing: z.boolean().optional()
      },
      async (args) => {
        // This would need the full file parsing implementation
        // For now, return a placeholder
        return {
          content: [{
            type: 'text',
            text: `File parsing not yet implemented in new SDK version: ${args.file_path}`
          }]
        };
      }
    );

    // Tool: Scan directory
    server.tool(
      'scan_dir',
      {
        project: z.string(),
        directory_path: z.string(),
        languages: z.array(z.enum(['typescript', 'javascript', 'java', 'python', 'csharp'])).optional(),
        exclude_paths: z.array(z.string()).optional(),
        include_tests: z.boolean().optional(),
        clear_existing: z.boolean().optional(),
        max_depth: z.number().optional()
      },
      async (args) => {
        // This would need the full directory scanning implementation
        // For now, return a placeholder
        return {
          content: [{
            type: 'text',
            text: `Directory scanning not yet implemented in new SDK version: ${args.directory_path}`
          }]
        };
      }
    );

    // Annotation analysis tools
    server.tool(
      'find_nodes_by_annotation',
      {
        project: z.string(),
        annotation_name: z.string(),
        framework: z.string().optional(),
        category: z.string().optional(),
        node_type: z.enum(['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module']).optional()
      },
      async (args) => {
        const { findNodesByAnnotation } = await import('./tools/find-nodes-by-annotation.js');
        const result = await findNodesByAnnotation(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'get_framework_usage',
      {
        project: z.string(),
        include_parameters: z.boolean().optional(),
        min_usage_count: z.number().optional()
      },
      async (args) => {
        const { getFrameworkUsage } = await import('./tools/get-framework-usage.js');
        const result = await getFrameworkUsage(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'get_annotation_usage',
      {
        project: z.string(),
        category: z.string().optional(),
        framework: z.string().optional(),
        include_deprecated: z.boolean().optional(),
        group_by: z.enum(['annotation', 'category', 'framework']).optional()
      },
      async (args) => {
        const { getAnnotationUsage } = await import('./tools/get-annotation-usage.js');
        const result = await getAnnotationUsage(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'find_deprecated_code',
      {
        project: z.string(),
        include_dependencies: z.boolean().optional(),
        node_type: z.enum(['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module']).optional()
      },
      async (args) => {
        const { findDeprecatedCode } = await import('./tools/find-deprecated-code.js');
        const result = await findDeprecatedCode(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'find_usage_of_deprecated_code',
      {
        project: z.string(),
        include_usage_details: z.boolean().optional()
      },
      async (args) => {
        const { findUsageOfDeprecatedCode } = await import('./tools/find-deprecated-code.js');
        const result = await findUsageOfDeprecatedCode(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'analyze_testing_annotations',
      {
        project: z.string(),
        framework: z.string().optional(),
        include_coverage_analysis: z.boolean().optional()
      },
      async (args) => {
        const { analyzeTestingAnnotations } = await import('./tools/analyze-testing-annotations.js');
        const result = await analyzeTestingAnnotations(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    server.tool(
      'find_untestable_code',
      {
        project: z.string()
      },
      async (args) => {
        const { findUntestableCode } = await import('./tools/analyze-testing-annotations.js');
        const result = await findUntestableCode(this.client, args);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    );

    // Add prompts
    server.prompt(
      'analyze_codebase',
      'Get guidance on analyzing a codebase using CodeRAG tools',
      {
        project_type: z.string().optional().describe('Type of project (java, typescript, python, etc.)')
      },
      async ({ project_type }) => {
        const projectType = project_type || 'any';
        return {
          description: `Guide for analyzing a ${projectType} codebase using CodeRAG`,
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `I want to analyze my ${projectType} codebase. Here's how to use CodeRAG effectively:

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
- Use \`find_inheritance_hierarchy\` for inheritance chains
- Use \`find_implementations\` for interface usage
- Use \`find_method_callers\` for method dependencies

## 4. Focus on quality:
- Review CK metrics for complex classes (WMC > 15, CBO > 10)
- Check package metrics for architectural balance
- Address architectural issues found

What aspect would you like to explore first?`
            }
          }]
        };
      }
    );

    server.prompt(
      'setup_code_graph',
      'Step-by-step guide to set up a code graph for a new project',
      {
        language: z.string().describe('Programming language of the project')
      },
      async ({ language }) => {
        return {
          description: `Step-by-step guide to set up a code graph for a ${language} project`,
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `Setting up a code graph for ${language} project:

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
- Map inheritance with \`find_inheritance_hierarchy\`
- Find interface usage patterns
- Trace method calls and dependencies

Ready to start scanning?`
            }
          }]
        };
      }
    );

    return server;
  }


  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        server: 'CodeRAG MCP Server',
        timestamp: new Date().toISOString()
      });
    });

    // ================================
    // SSE TRANSPORT ENDPOINTS (Legacy)
    // ================================
    
    // SSE Transport: GET /sse - Establish SSE connection
    this.app.get('/sse', async (req, res) => {
      try {
        // Create SSE transport for this session - let it handle headers and generate session ID
        const transport = new SSEServerTransport('/sse', res);
        
        // Create dedicated server instance for this session
        const dedicatedServer = this.createServer();
        await dedicatedServer.connect(transport);
        
        // Get the session ID that SSEServerTransport generated
        const sessionId = transport.sessionId;
        this.sseTransports[sessionId] = transport;
        
        // Send additional connection event with messageEndpoint (SSEServerTransport already sent endpoint event)
        const messageEndpoint = `/messages`;
        const connectionData = JSON.stringify({
          sessionId: sessionId,
          messageEndpoint: messageEndpoint
        });
        
        const connectionEvent = `event: connection\ndata: ${connectionData}\n\n`;
        const pingEvent = `: ping - ${new Date().toISOString()}\n\n`;
        
        res.write(connectionEvent);
        res.write(pingEvent);
        
        console.log(`🔴 SSE session established: ${sessionId}`);
        
        // Cleanup on connection close
        req.on('close', () => {
          delete this.sseTransports[sessionId];
          console.log(`🔴 SSE session closed: ${sessionId}`);
        });
        
        res.on('close', () => {
          delete this.sseTransports[sessionId];
        });
        
        // Keep alive ping every 15 seconds
        const keepAlive = setInterval(() => {
          if (res.destroyed) {
            clearInterval(keepAlive);
            return;
          }
          res.write(`: ping - ${new Date().toISOString()}\n\n`);
        }, 15000);
        
        req.on('close', () => clearInterval(keepAlive));
        res.on('close', () => clearInterval(keepAlive));
        
      } catch (error) {
        console.error('❌ SSE connection error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
      }
    });

    // SSE Transport: POST /sse - Send messages to same endpoint with sessionId
    this.app.post('/sse', async (req, res) => {
      const sessionId = req.query.sessionId as string || req.headers['mcp-session-id'] as string;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required' });
      }
      
      let transport = this.sseTransports[sessionId];
      
      // If session doesn't exist, try to find any available SSE transport and map it to this session ID
      if (!transport && Object.keys(this.sseTransports).length > 0) {
        const availableTransports = Object.values(this.sseTransports);
        if (availableTransports.length > 0) {
          transport = availableTransports[0]; // Use the first available transport
          this.sseTransports[sessionId] = transport; // Map client's session ID to this transport
        }
      }
      
      if (!transport) {
        return res.status(404).json({ error: 'No SSE connection available' });
      }
      
      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error('❌ SSE POST message error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to handle message' });
        }
      }
    });

    // SSE Transport: POST /messages - Send messages to server (correct SSE endpoint)
    this.app.post('/messages', async (req, res) => {
      // Extract sessionId from the message body or headers (as per SSE spec)
      const sessionId = req.headers['x-session-id'] as string || 
                       req.headers['session-id'] as string || 
                       req.body?.sessionId;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required in headers or body' });
      }
      
      const transport = this.sseTransports[sessionId];
      if (!transport) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error('❌ SSE POST /messages message error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to handle message' });
        }
      }
    });

    // ================================
    // STREAMABLE HTTP TRANSPORT ENDPOINTS (New)
    // ================================

    // Streamable HTTP Transport endpoints - exactly following the official SDK example
    this.app.post('/mcp', async (req, res) => {
      try {
        // Check for sessionId in query params or headers
        const querySessionId = req.query.sessionId as string;
        const headerSessionId = req.headers['mcp-session-id'] as string;
        const sessionId = querySessionId || headerSessionId;
        

        let transport: StreamableHTTPServerTransport;
        
        if (headerSessionId && this.streamableTransports[headerSessionId]) {
          // Reuse existing transport
          transport = this.streamableTransports[headerSessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              console.log(`🔑 Session initialized with ID: ${sessionId}`);
              this.streamableTransports[sessionId] = transport;
              console.log('📋 Current streamable transports:', Object.keys(this.streamableTransports));
            }
          });
          
          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && this.streamableTransports[sid]) {
              console.log(`Transport closed for session ${sid}, removing from transports map`);
              delete this.streamableTransports[sid];
            }
          };
          
          // Connect the transport to the MCP server BEFORE handling the request
          await this.server.connect(transport);
          await transport.handleRequest(req, res, req.body);
          return; // Already handled
        } else {
          // Invalid request - no session ID or not initialization request
          console.log('❌ Bad request - no session ID or not initialize request');
          console.log('  sessionId:', sessionId);
          console.log('  isInitialize:', isInitializeRequest(req.body));
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }
        
        // Handle the request with existing transport
        console.log('🔄 Handling request with existing transport');
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Streamable HTTP Transport: GET /mcp - Establish SSE stream for existing session
    this.app.get('/mcp', async (req, res) => {
      const headerSessionId = req.headers['mcp-session-id'] as string;
      const querySessionId = req.query.sessionId as string;
      
      console.log('🟢 Streamable HTTP GET /mcp:');
      console.log('  headerSessionId:', headerSessionId);
      console.log('  querySessionId:', querySessionId);
      console.log('  availableStreamableTransports:', Object.keys(this.streamableTransports));
      
      const sessionId = headerSessionId || querySessionId;
      
      if (!sessionId || !this.streamableTransports[sessionId]) {
        console.log('❌ Streamable HTTP GET - missing or invalid session ID');
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      
      console.log(`🌊 Establishing streamable HTTP SSE stream for session ${sessionId}`);
      const transport = this.streamableTransports[sessionId];
      await transport.handleRequest(req, res);
    });

    // Streamable HTTP Transport: DELETE /mcp - Session termination
    this.app.delete('/mcp', async (req, res) => {
      const sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId || !this.streamableTransports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = this.streamableTransports[sessionId];
      await transport.handleRequest(req, res);
    });

    // Legacy REST API endpoints for direct access to graph data
    this.app.get('/api/nodes', async (req, res) => {
      try {
        const { type, search, project } = req.query;
        
        if (!project) {
          return res.status(400).json({ error: 'Project parameter is required' });
        }
        
        let result;
        
        if (type) {
          result = await this.nodeManager.findNodesByType(type as any, project as string);
        } else if (search) {
          result = await this.nodeManager.searchNodes(search as string, project as string);
        } else {
          // Get all nodes for project (limit to prevent overwhelming response)
          const query = `MATCH (n {project_id: $project}) RETURN n LIMIT 100`;
          result = await this.client.runQuery(query, { project });
        }
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/nodes/:id', async (req, res) => {
      try {
        const { project } = req.query;
        
        if (!project) {
          return res.status(400).json({ error: 'Project parameter is required' });
        }
        
        const node = await this.nodeManager.getNode(req.params.id, project as string);
        if (node) {
          res.json(node);
        } else {
          res.status(404).json({ error: 'Node not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Catch-all route to see what URLs Claude Code is trying
    this.app.all('*', (req, res) => {
      console.log(`UNHANDLED REQUEST: ${req.method} ${req.url}`);
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`CodeRAG MCP Server started on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`\n🔴 SSE Transport (Legacy):`);
        console.log(`  SSE endpoint: http://localhost:${this.port}/sse`);
        console.log(`  Message endpoint: http://localhost:${this.port}/messages`);
        console.log(`\n🟢 Streamable HTTP Transport (New):`);
        console.log(`  MCP endpoint: http://localhost:${this.port}/mcp`);
        console.log(`\n🔗 Legacy API endpoints: http://localhost:${this.port}/api/`);
        resolve();
      });
    });
  }
}