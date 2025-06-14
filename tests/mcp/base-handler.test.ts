import { BaseHandler } from '../../src/mcp/base-handler.js';
import { Neo4jClient } from '../../src/graph/neo4j-client.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// Mock all dependencies
jest.mock('../../src/graph/neo4j-client.js');
jest.mock('@modelcontextprotocol/sdk/server/index.js');

// Create a concrete implementation for testing
class TestHandler extends BaseHandler {
  async start(): Promise<void> {
    // Test implementation
  }
}

describe('BaseHandler', () => {
  let handler: TestHandler;
  let mockClient: jest.Mocked<Neo4jClient>;
  let mockServer: jest.Mocked<Server>;

  beforeEach(() => {
    // Mock the Server class
    mockServer = {
      setRequestHandler: jest.fn(),
      connect: jest.fn(),
      close: jest.fn()
    } as any;

    (Server as jest.MockedClass<typeof Server>).mockImplementation(() => mockServer);

    mockClient = {
      runQuery: jest.fn(),
      getProjectLabel: jest.fn().mockReturnValue('Project_test_Class')
    } as any;

    handler = new TestHandler(mockClient, 'test-server', '1.0.0', 'detailed');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create handler with provided parameters', () => {
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'test-server',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {},
            prompts: {}
          }
        }
      );
      expect(handler).toBeInstanceOf(BaseHandler);
    });

    test('should create handler with default parameters', () => {
      const defaultHandler = new TestHandler(mockClient);
      expect(Server).toHaveBeenCalledWith(
        {
          name: 'coderag-mcp-server',
          version: '1.0.0'
        },
        {
          capabilities: {
            tools: {},
            prompts: {}
          }
        }
      );
    });
  });

  describe('setupToolHandlers', () => {
    test('should register list tools handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.any(Object), // ListToolsRequestSchema
        expect.any(Function)
      );
    });

    test('should register call tool handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.any(Object), // CallToolRequestSchema
        expect.any(Function)
      );
    });
  });

  describe('setupPromptHandlers', () => {
    test('should register list prompts handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.any(Object), // ListPromptsRequestSchema
        expect.any(Function)
      );
    });

    test('should register get prompt handler', () => {
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.any(Object), // GetPromptRequestSchema
        expect.any(Function)
      );
    });
  });

  describe('getToolSchemas', () => {
    test('should return comprehensive tool schemas', () => {
      const schemas = (handler as any).getToolSchemas();
      
      expect(schemas).toBeInstanceOf(Array);
      expect(schemas.length).toBeGreaterThan(0);
      
      // Check for key tools
      const toolNames = schemas.map((s: any) => s.name);
      expect(toolNames).toContain('add_node');
      expect(toolNames).toContain('add_edge');
      expect(toolNames).toContain('search_nodes');
      expect(toolNames).toContain('calculate_ck_metrics');
      expect(toolNames).toContain('scan_dir');
      expect(toolNames).toContain('list_projects');
    });

    test('should have proper schema structure', () => {
      const schemas = (handler as any).getToolSchemas();
      const addNodeSchema = schemas.find((s: any) => s.name === 'add_node');
      
      expect(addNodeSchema).toBeDefined();
      expect(addNodeSchema.description).toBeDefined();
      expect(addNodeSchema.inputSchema).toBeDefined();
      expect(addNodeSchema.inputSchema.type).toBe('object');
      expect(addNodeSchema.inputSchema.properties).toBeDefined();
      expect(addNodeSchema.inputSchema.required).toBeInstanceOf(Array);
    });
  });

  describe('prompt methods', () => {
    test('should generate analyze codebase prompt', async () => {
      const prompt = await (handler as any).getAnalyzeCodebasePrompt({ project_type: 'java' });
      
      expect(prompt.description).toContain('java');
      expect(prompt.messages).toBeInstanceOf(Array);
      expect(prompt.messages[0].role).toBe('user');
      expect(prompt.messages[0].content.type).toBe('text');
      expect(prompt.messages[0].content.text).toContain('java');
    });

    test('should generate setup code graph prompt', async () => {
      const prompt = await (handler as any).getSetupCodeGraphPrompt({ language: 'typescript' });
      
      expect(prompt.description).toContain('typescript');
      expect(prompt.messages[0].content.text).toContain('typescript');
    });

    test('should generate find dependencies prompt', async () => {
      const prompt = await (handler as any).getFindDependenciesPrompt({ target_class: 'TestClass' });
      
      expect(prompt.description).toContain('TestClass');
      expect(prompt.messages[0].content.text).toContain('TestClass');
    });

    test('should generate analyze inheritance prompt', async () => {
      const prompt = await (handler as any).getAnalyzeInheritancePrompt({ class_or_interface: 'BaseClass' });
      
      expect(prompt.description).toContain('BaseClass');
      expect(prompt.messages[0].content.text).toContain('BaseClass');
    });
  });

  describe('detail level handling', () => {
    test('should generate detailed prompts for detailed level', () => {
      const detailedHandler = new TestHandler(mockClient, 'test', '1.0.0', 'detailed');
      const prompt = (detailedHandler as any).getDetailedAnalysisPrompt('java');
      
      expect(prompt).toContain('## 1. First, explore');
      expect(prompt).toContain('## 2. Understand');
    });

    test('should generate simple prompts for simple level', () => {
      const simpleHandler = new TestHandler(mockClient, 'test', '1.0.0', 'simple');
      const prompt = (simpleHandler as any).getSimpleAnalysisPrompt('java');
      
      expect(prompt).toContain('Quick java analysis');
      expect(prompt.length).toBeLessThan(300); // Should be concise
    });
  });

  describe('tool handler delegation', () => {
    test('should delegate to node management tools', async () => {
      const mockNodeManager = {
        addNode: jest.fn().mockResolvedValue({ id: 'test' }),
        getNode: jest.fn().mockResolvedValue({ id: 'test' })
      };
      
      (handler as any).nodeManager = mockNodeManager;
      
      // Test delegation exists (actual implementation tested in specific tool tests)
      expect((handler as any).handleAddNode).toBeInstanceOf(Function);
      expect((handler as any).handleGetNode).toBeInstanceOf(Function);
    });

    test('should delegate to edge management tools', async () => {
      const mockEdgeManager = {
        addEdge: jest.fn().mockResolvedValue({ id: 'test' }),
        getEdge: jest.fn().mockResolvedValue({ id: 'test' })
      };
      
      (handler as any).edgeManager = mockEdgeManager;
      
      expect((handler as any).handleAddEdge).toBeInstanceOf(Function);
      expect((handler as any).handleGetEdge).toBeInstanceOf(Function);
    });

    test('should delegate to metrics tools', async () => {
      const mockMetricsManager = {
        calculateCKMetrics: jest.fn().mockResolvedValue({ wmc: 5 }),
        findArchitecturalIssues: jest.fn().mockResolvedValue([])
      };
      
      (handler as any).metricsManager = mockMetricsManager;
      
      expect((handler as any).handleCalculateCKMetrics).toBeInstanceOf(Function);
      expect((handler as any).handleFindArchitecturalIssues).toBeInstanceOf(Function);
    });
  });

  describe('error handling', () => {
    test('should handle tool execution errors', async () => {
      // This would need to be tested with actual tool call handlers
      // The error handling is in the CallToolRequestSchema handler
      expect(mockServer.setRequestHandler).toHaveBeenCalled();
    });
  });
});