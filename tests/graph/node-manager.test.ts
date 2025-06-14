import { NodeManager } from '../../src/graph/node-manager.js';
import { Neo4jClient } from '../../src/graph/neo4j-client.js';
import { CodeNode } from '../../src/types.js';

// Mock the Neo4jClient
jest.mock('../../src/graph/neo4j-client.js');

describe('NodeManager', () => {
  let nodeManager: NodeManager;
  let mockClient: jest.Mocked<Neo4jClient>;
  let mockResult: any;

  beforeEach(() => {
    mockResult = {
      records: []
    };

    mockClient = {
      runQuery: jest.fn().mockResolvedValue(mockResult),
      getProjectLabel: jest.fn().mockReturnValue('Project_test_Class')
    } as any;

    nodeManager = new NodeManager(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addNode', () => {
    test('should add node successfully', async () => {
      const node: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.example.TestClass'
      };

      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            description: null,
            source_file: null,
            start_line: null,
            end_line: null,
            modifiers: [],
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.addNode(node);
      expect(result.id).toBe('test-node');
      expect(result.type).toBe('class');
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should throw error when node creation fails', async () => {
      const node: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.example.TestClass'
      };

      mockResult.records = [];

      await expect(nodeManager.addNode(node)).rejects.toThrow('Failed to create node');
    });

    test('should handle node with all optional fields', async () => {
      const node: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'method',
        name: 'testMethod',
        qualified_name: 'com.example.TestClass.testMethod',
        description: 'A test method',
        source_file: 'TestClass.java',
        start_line: 10,
        end_line: 20,
        modifiers: ['public', 'static'],
        attributes: {
          return_type: 'void',
          parameters: []
        }
      };

      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            ...node,
            attributes_json: JSON.stringify(node.attributes)
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.addNode(node);
      expect(result.id).toBe('test-node');
      expect(result.description).toBe('A test method');
      expect(result.modifiers).toEqual(['public', 'static']);
    });
  });

  describe('updateNode', () => {
    test('should update node successfully', async () => {
      const updates = {
        description: 'Updated description',
        modifiers: ['public']
      };

      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            description: 'Updated description',
            modifiers: ['public'],
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.updateNode('test-node', 'test-project', updates);
      expect(result.description).toBe('Updated description');
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should throw error when no valid updates provided', async () => {
      await expect(nodeManager.updateNode('test-node', 'test-project', {}))
        .rejects.toThrow('No valid updates provided');
    });

    test('should throw error when node not found', async () => {
      mockResult.records = [];
      
      await expect(nodeManager.updateNode('test-node', 'test-project', { description: 'test' }))
        .rejects.toThrow('Node with id test-node not found');
    });
  });

  describe('getNode', () => {
    test('should get node successfully', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.getNode('test-node', 'test-project');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-node');
    });

    test('should return null when node not found', async () => {
      mockResult.records = [];

      const result = await nodeManager.getNode('non-existent', 'test-project');
      expect(result).toBeNull();
    });
  });

  describe('deleteNode', () => {
    test('should delete node successfully', async () => {
      mockResult.records = [{ get: jest.fn().mockReturnValue({ toNumber: () => 1 }) }];

      const result = await nodeManager.deleteNode('test-node', 'test-project');
      expect(result).toBe(true);
    });

    test('should return false when node not found', async () => {
      mockResult.records = [{ get: jest.fn().mockReturnValue({ toNumber: () => 0 }) }];

      const result = await nodeManager.deleteNode('non-existent', 'test-project');
      expect(result).toBe(false);
    });
  });

  describe('findNodesByType', () => {
    test('should find nodes by type', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.findNodesByType('class', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('class');
    });
  });

  describe('findNodesByName', () => {
    test('should find nodes by name', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.findNodesByName('Test', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('TestClass');
    });
  });

  describe('searchNodes', () => {
    test('should search nodes successfully', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.searchNodes('Test', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('TestClass');
    });
  });

  describe('cross-project methods', () => {
    test('should find nodes by type across projects', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.findNodesByTypeAcrossProjects('class');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('class');
    });

    test('should search nodes across projects', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.searchNodesAcrossProjects('Test');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('TestClass');
    });
  });

  describe('recordToNode', () => {
    test('should handle numeric line numbers', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            start_line: { toNumber: () => 10 },
            end_line: { toNumber: () => 20 },
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.getNode('test-node', 'test-project');
      expect(result?.start_line).toBe(10);
      expect(result?.end_line).toBe(20);
    });

    test('should handle plain numeric line numbers', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({
          properties: {
            id: 'test-node',
            project_id: 'test-project',
            type: 'class',
            name: 'TestClass',
            qualified_name: 'com.example.TestClass',
            start_line: 10,
            end_line: 20,
            attributes_json: '{}'
          }
        })
      };

      mockResult.records = [mockRecord];

      const result = await nodeManager.getNode('test-node', 'test-project');
      expect(result?.start_line).toBe(10);
      expect(result?.end_line).toBe(20);
    });
  });
});