import { NodeManager } from '../../../src/graph/node-manager.js';
import { addNode, updateNode, getNode, deleteNode, findNodesByType, searchNodes } from '../../../src/mcp/tools/node-management.js';
import { CodeNode } from '../../../src/types.js';

// Mock the NodeManager
jest.mock('../../../src/graph/node-manager.js');

describe('Node Management Tools', () => {
  let mockNodeManager: jest.Mocked<NodeManager>;

  beforeEach(() => {
    mockNodeManager = {
      addNode: jest.fn(),
      updateNode: jest.fn(),
      getNode: jest.fn(),
      deleteNode: jest.fn(),
      findNodesByType: jest.fn(),
      searchNodes: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addNode', () => {
    test('should add node with all required parameters', async () => {
      const params = {
        id: 'test-node',
        project: 'test-project',
        type: 'class' as const,
        name: 'TestClass',
        qualified_name: 'com.example.TestClass',
        description: 'A test class',
        source_file: 'TestClass.java',
        start_line: 10,
        end_line: 50,
        modifiers: ['public'],
        attributes: { version: '1.0' }
      };

      const expectedNode: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.example.TestClass',
        description: 'A test class',
        source_file: 'TestClass.java',
        start_line: 10,
        end_line: 50,
        modifiers: ['public'],
        attributes: { version: '1.0' }
      };

      mockNodeManager.addNode.mockResolvedValue(expectedNode);

      const result = await addNode(mockNodeManager, params);

      expect(mockNodeManager.addNode).toHaveBeenCalledWith(expectedNode);
      expect(result.content[0].text).toContain('test-node');
      expect(result.content[0].text).toContain('TestClass');
    });

    test('should add node with minimal required parameters', async () => {
      const params = {
        id: 'minimal-node',
        project: 'test-project',
        type: 'function' as const,
        name: 'testFunction',
        qualified_name: 'testFunction'
      };

      const expectedNode: CodeNode = {
        id: 'minimal-node',
        project_id: 'test-project',
        type: 'function',
        name: 'testFunction',
        qualified_name: 'testFunction'
      };

      mockNodeManager.addNode.mockResolvedValue(expectedNode);

      const result = await addNode(mockNodeManager, params);

      expect(mockNodeManager.addNode).toHaveBeenCalledWith(expectedNode);
      expect(result.content[0].text).toContain('minimal-node');
    });

    test('should handle addNode errors', async () => {
      const params = {
        id: 'error-node',
        project: 'test-project',
        type: 'class' as const,
        name: 'ErrorClass',
        qualified_name: 'com.example.ErrorClass'
      };

      mockNodeManager.addNode.mockRejectedValue(new Error('Database error'));

      const result = await addNode(mockNodeManager, params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to add node');
      expect(result.content[0].text).toContain('Database error');
    });
  });

  describe('updateNode', () => {
    test('should update node successfully', async () => {
      const params = {
        id: 'test-node',
        project: 'test-project',
        updates: {
          description: 'Updated description',
          modifiers: ['public', 'final']
        }
      };

      const updatedNode: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.example.TestClass',
        description: 'Updated description',
        modifiers: ['public', 'final']
      };

      mockNodeManager.updateNode.mockResolvedValue(updatedNode);

      const result = await updateNode(mockNodeManager, params);

      expect(mockNodeManager.updateNode).toHaveBeenCalledWith(
        'test-node',
        'test-project',
        params.updates
      );
      expect(result.content[0].text).toContain('Updated description');
    });

    test('should handle updateNode errors', async () => {
      const params = {
        id: 'nonexistent-node',
        project: 'test-project',
        updates: { description: 'test' }
      };

      mockNodeManager.updateNode.mockRejectedValue(new Error('Node not found'));

      const result = await updateNode(mockNodeManager, params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to update node');
    });
  });

  describe('getNode', () => {
    test('should get node successfully', async () => {
      const params = {
        nodeId: 'test-node',
        projectId: 'test-project'
      };

      const foundNode: CodeNode = {
        id: 'test-node',
        project_id: 'test-project',
        type: 'class',
        name: 'TestClass',
        qualified_name: 'com.example.TestClass'
      };

      mockNodeManager.getNode.mockResolvedValue(foundNode);

      const result = await getNode(mockNodeManager, params);

      expect(mockNodeManager.getNode).toHaveBeenCalledWith('test-node', 'test-project');
      expect(result.content[0].text).toContain('TestClass');
    });

    test('should handle node not found', async () => {
      const params = {
        nodeId: 'nonexistent-node',
        projectId: 'test-project'
      };

      mockNodeManager.getNode.mockResolvedValue(null);

      const result = await getNode(mockNodeManager, params);

      expect(result.content[0].text).toBe('Node not found');
    });

    test('should handle getNode errors', async () => {
      const params = {
        nodeId: 'error-node',
        projectId: 'test-project'
      };

      mockNodeManager.getNode.mockRejectedValue(new Error('Database error'));

      const result = await getNode(mockNodeManager, params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to get node');
    });
  });

  describe('deleteNode', () => {
    test('should delete node successfully', async () => {
      const params = {
        id: 'test-node',
        project: 'test-project'
      };

      mockNodeManager.deleteNode.mockResolvedValue(true);

      const result = await deleteNode(mockNodeManager, params);

      expect(mockNodeManager.deleteNode).toHaveBeenCalledWith('test-node', 'test-project');
      expect(result.content[0].text).toBe('Node deleted successfully');
    });

    test('should handle node not found for deletion', async () => {
      const params = {
        id: 'nonexistent-node',
        project: 'test-project'
      };

      mockNodeManager.deleteNode.mockResolvedValue(false);

      const result = await deleteNode(mockNodeManager, params);

      expect(result.content[0].text).toBe('Node not found');
    });

    test('should handle deleteNode errors', async () => {
      const params = {
        id: 'error-node',
        project: 'test-project'
      };

      mockNodeManager.deleteNode.mockRejectedValue(new Error('Database error'));

      const result = await deleteNode(mockNodeManager, params);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Failed to delete node');
    });
  });

  describe('findNodesByType', () => {
    test('should find nodes by type successfully', async () => {
      const params = {
        nodeType: 'class' as const,
        projectId: 'test-project'
      };

      const foundNodes: CodeNode[] = [
        {
          id: 'class1',
          project_id: 'test-project',
          type: 'class',
          name: 'Class1',
          qualified_name: 'com.example.Class1'
        },
        {
          id: 'class2',
          project_id: 'test-project',
          type: 'class',
          name: 'Class2',
          qualified_name: 'com.example.Class2'
        }
      ];

      mockNodeManager.findNodesByType.mockResolvedValue(foundNodes);

      const result = await findNodesByType(mockNodeManager, params);

      expect(mockNodeManager.findNodesByType).toHaveBeenCalledWith('class', 'test-project');
      expect(result.content[0].text).toContain('Class1');
      expect(result.content[0].text).toContain('Class2');
      expect(result.content[0].text).toContain('class1');
      expect(result.content[0].text).toContain('class2');
    });

    test('should handle no nodes found', async () => {
      const params = {
        nodeType: 'interface' as const,
        projectId: 'test-project'
      };

      mockNodeManager.findNodesByType.mockResolvedValue([]);

      const result = await findNodesByType(mockNodeManager, params);

      expect(result.content[0].text).toBe('[]');
    });

    test('should handle findNodesByType errors', async () => {
      const params = {
        nodeType: 'class' as const,
        projectId: 'test-project'
      };

      mockNodeManager.findNodesByType.mockRejectedValue(new Error('Database error'));

      await expect(findNodesByType(mockNodeManager, params)).rejects.toThrow('Database error');
    });
  });

  describe('searchNodes', () => {
    test('should search nodes successfully', async () => {
      const params = {
        searchTerm: 'Test',
        projectId: 'test-project'
      };

      const foundNodes: CodeNode[] = [
        {
          id: 'test1',
          project_id: 'test-project',
          type: 'class',
          name: 'TestClass',
          qualified_name: 'com.example.TestClass'
        },
        {
          id: 'test2',
          project_id: 'test-project',
          type: 'method',
          name: 'testMethod',
          qualified_name: 'com.example.SomeClass.testMethod'
        }
      ];

      mockNodeManager.searchNodes.mockResolvedValue(foundNodes);

      const result = await searchNodes(mockNodeManager, params);

      expect(mockNodeManager.searchNodes).toHaveBeenCalledWith('Test', 'test-project');
      expect(result.content[0].text).toContain('TestClass');
      expect(result.content[0].text).toContain('testMethod');
      expect(result.content[0].text).toContain('test1');
      expect(result.content[0].text).toContain('test2');
    });

    test('should handle no search results', async () => {
      const params = {
        searchTerm: 'NonExistent',
        projectId: 'test-project'
      };

      mockNodeManager.searchNodes.mockResolvedValue([]);

      const result = await searchNodes(mockNodeManager, params);

      expect(result.content[0].text).toBe('[]');
    });

    test('should handle searchNodes errors', async () => {
      const params = {
        searchTerm: 'Error',
        projectId: 'test-project'
      };

      mockNodeManager.searchNodes.mockRejectedValue(new Error('Database error'));

      await expect(searchNodes(mockNodeManager, params)).rejects.toThrow('Database error');
    });
  });
});