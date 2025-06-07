import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { BaseHandler } from './base-handler.js';
import { Neo4jClient } from '../graph/neo4j-client.js';

export class SSEHandler extends BaseHandler {
  private app: express.Application;
  private port: number;

  constructor(
    client: Neo4jClient,
    port: number = 3000,
    serverName: string = 'coderag-mcp-server',
    serverVersion: string = '1.0.0'
  ) {
    super(client, serverName, serverVersion, 'simple');
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
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

    // SSE endpoint for MCP communication
    this.app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/sse', res);
      await this.server.connect(transport);
    });

    // REST API endpoints for direct access to graph data
    this.app.get('/api/nodes', async (req, res) => {
      try {
        const { type, search } = req.query;
        let result;
        
        if (type) {
          result = await this.nodeManager.findNodesByType(type as any);
        } else if (search) {
          result = await this.nodeManager.searchNodes(search as string);
        } else {
          // Get all nodes (limit to prevent overwhelming response)
          const query = `MATCH (n) RETURN n LIMIT 100`;
          result = await this.client.runQuery(query);
        }
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/nodes/:id', async (req, res) => {
      try {
        const node = await this.nodeManager.getNode(req.params.id);
        if (node) {
          res.json(node);
        } else {
          res.status(404).json({ error: 'Node not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/edges', async (req, res) => {
      try {
        const { source, type } = req.query;
        let result;
        
        if (source) {
          result = await this.edgeManager.findEdgesBySource(source as string);
        } else {
          // Get all edges (limit to prevent overwhelming response)  
          const query = `MATCH (a)-[r]->(b) RETURN r LIMIT 100`;
          result = await this.client.runQuery(query);
        }
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/edges/:id', async (req, res) => {
      try {
        const edge = await this.edgeManager.getEdge(req.params.id);
        if (edge) {
          res.json(edge);
        } else {
          res.status(404).json({ error: 'Edge not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Analysis endpoints
    this.app.get('/api/analysis/inheritance/:className', async (req, res) => {
      try {
        const hierarchy = await this.edgeManager.findInheritanceHierarchy(req.params.className);
        res.json(hierarchy);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/analysis/implementations/:interfaceName', async (req, res) => {
      try {
        const implementations = await this.edgeManager.findClassesThatImplementInterface(req.params.interfaceName);
        res.json(implementations);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/analysis/callers/:methodName', async (req, res) => {
      try {
        const callers = await this.edgeManager.findClassesThatCallMethod(req.params.methodName);
        res.json(callers);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // New metrics endpoints
    this.app.get('/api/metrics/ck/:classId', async (req, res) => {
      try {
        const metrics = await this.metricsManager.calculateCKMetrics(req.params.classId);
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/metrics/package/:packageName', async (req, res) => {
      try {
        const metrics = await this.metricsManager.calculatePackageMetrics(req.params.packageName);
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/metrics/issues', async (req, res) => {
      try {
        const issues = await this.metricsManager.findArchitecturalIssues();
        res.json(issues);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.get('/api/metrics/summary', async (req, res) => {
      try {
        const summary = await this.metricsManager.calculateProjectSummary();
        res.json(summary);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    // File parsing endpoints
    this.app.post('/api/parse/file', async (req, res) => {
      try {
        const { file_path, clear_existing } = req.body;
        const result = await this.handleAddFile({ file_path, clear_existing });
        res.json({ success: true, result: result.content[0].text });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });

    this.app.post('/api/parse/directory', async (req, res) => {
      try {
        const { directory_path, languages, exclude_paths, include_tests, clear_existing, max_depth } = req.body;
        const result = await this.handleScanDir({ 
          directory_path, 
          languages, 
          exclude_paths, 
          include_tests, 
          clear_existing, 
          max_depth 
        });
        res.json({ success: true, result: result.content[0].text });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`CodeRAG MCP Server started on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`SSE endpoint: http://localhost:${this.port}/sse`);
        console.log(`API endpoints: http://localhost:${this.port}/api/`);
        resolve();
      });
    });
  }
}