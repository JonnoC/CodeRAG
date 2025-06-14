import { EdgeManager } from '../src/graph/edge-manager.js';
import { Neo4jClient } from '../src/graph/neo4j-client.js';
import { CodeEdge } from '../src/types.js';

// Mock the Neo4jClient
jest.mock('../src/graph/neo4j-client.js');

describe('EdgeManager', () => {
  let edgeManager: EdgeManager;
  let mockClient: jest.Mocked<Neo4jClient>;
  let mockResult: any;

  beforeEach(() => {
    mockResult = {
      records: []
    };

    mockClient = {
      runQuery: jest.fn().mockResolvedValue(mockResult)
    } as any;

    edgeManager = new EdgeManager(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addEdge', () => {
    test('should add edge successfully', async () => {
      const edge: CodeEdge = {
        id: 'test-edge',
        project_id: 'test-project',
        type: 'implements',
        source: 'source-node',
        target: 'target-node'
      };

      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'implements',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.addEdge(edge);
      expect(result.id).toBe('test-edge');
      expect(result.type).toBe('implements');
      expect(result.source).toBe('source-node');
      expect(result.target).toBe('target-node');
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should retry with interface name for implements relationship', async () => {
      const edge: CodeEdge = {
        id: 'test-edge',
        project_id: 'test-project',
        type: 'implements',
        source: 'source-node',
        target: 'com.example.TargetInterface'
      };

      // First call returns empty, second call returns result
      mockClient.runQuery
        .mockResolvedValueOnce({ records: [] })
        .mockResolvedValueOnce({
          records: [{
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'r') {
                return {
                  properties: {
                    id: 'test-edge',
                    project_id: 'test-project',
                    type: 'implements',
                    attributes_json: '{}'
                  }
                };
              }
              if (key === 'sourceId') return 'source-node';
              if (key === 'targetId') return 'target-node';
            })
          }]
        });

      const result = await edgeManager.addEdge(edge);
      expect(result.id).toBe('test-edge');
      expect(mockClient.runQuery).toHaveBeenCalledTimes(2);
    });

    test('should throw error when edge creation fails', async () => {
      const edge: CodeEdge = {
        id: 'test-edge',
        project_id: 'test-project',
        type: 'calls',
        source: 'source-node',
        target: 'target-node'
      };

      mockResult.records = [];

      await expect(edgeManager.addEdge(edge)).rejects.toThrow('Failed to create edge - source or target node not found');
    });

    test('should handle edge with attributes', async () => {
      const edge: CodeEdge = {
        id: 'test-edge',
        project_id: 'test-project',
        type: 'calls',
        source: 'source-node',
        target: 'target-node',
        attributes: {
          line_number: 42,
          confidence: 0.95
        }
      };

      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'calls',
                attributes_json: JSON.stringify(edge.attributes)
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.addEdge(edge);
      expect(result.attributes?.line_number).toBe(42);
      expect(result.attributes?.confidence).toBe(0.95);
    });
  });

  describe('updateEdge', () => {
    test('should update edge successfully', async () => {
      const updates = {
        attributes: { weight: 2.0 }
      };

      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'calls',
                attributes_json: JSON.stringify(updates.attributes)
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.updateEdge('test-edge', 'test-project', updates);
      expect(result.attributes?.weight).toBe(2.0);
      expect(mockClient.runQuery).toHaveBeenCalled();
    });

    test('should throw error when no valid updates provided', async () => {
      await expect(edgeManager.updateEdge('test-edge', 'test-project', {}))
        .rejects.toThrow('No valid updates provided');
    });

    test('should not allow updating source or target', async () => {
      const updates = {
        source: 'new-source',
        target: 'new-target'
      };

      await expect(edgeManager.updateEdge('test-edge', 'test-project', updates))
        .rejects.toThrow('No valid updates provided');
    });

    test('should throw error when edge not found', async () => {
      mockResult.records = [];
      
      await expect(edgeManager.updateEdge('test-edge', 'test-project', { type: 'calls' }))
        .rejects.toThrow('Edge with id test-edge not found');
    });
  });

  describe('getEdge', () => {
    test('should get edge successfully', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'implements',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.getEdge('test-edge', 'test-project');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-edge');
    });

    test('should return null when edge not found', async () => {
      mockResult.records = [];

      const result = await edgeManager.getEdge('non-existent', 'test-project');
      expect(result).toBeNull();
    });
  });

  describe('deleteEdge', () => {
    test('should delete edge successfully', async () => {
      mockResult.records = [{ get: jest.fn().mockReturnValue({ toNumber: () => 1 }) }];

      const result = await edgeManager.deleteEdge('test-edge', 'test-project');
      expect(result).toBe(true);
    });

    test('should return false when edge not found', async () => {
      mockResult.records = [{ get: jest.fn().mockReturnValue({ toNumber: () => 0 }) }];

      const result = await edgeManager.deleteEdge('non-existent', 'test-project');
      expect(result).toBe(false);
    });
  });

  describe('findEdgesByType', () => {
    test('should find edges by type', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'implements',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.findEdgesByType('implements', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('implements');
    });
  });

  describe('findEdgesBySource', () => {
    test('should find edges by source', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'calls',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.findEdgesBySource('source-node', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('source-node');
    });
  });

  describe('complex queries', () => {
    test('should find classes that call method', async () => {
      mockResult.records = [
        { get: jest.fn().mockReturnValue('TestClass') },
        { get: jest.fn().mockReturnValue('AnotherClass') }
      ];

      const result = await edgeManager.findClassesThatCallMethod('testMethod', 'test-project');
      expect(result).toHaveLength(2);
      expect(result).toContain('TestClass');
      expect(result).toContain('AnotherClass');
    });

    test('should find classes that implement interface', async () => {
      mockResult.records = [
        { get: jest.fn().mockReturnValue('TestClass') }
      ];

      const result = await edgeManager.findClassesThatImplementInterface('TestInterface', 'test-project');
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('TestClass');
    });

    test('should find inheritance hierarchy', async () => {
      mockResult.records = [
        { get: jest.fn().mockReturnValue(['Child', 'Parent', 'GrandParent']) }
      ];

      const result = await edgeManager.findInheritanceHierarchy('Child', 'test-project');
      expect(result).toEqual(['Child', 'Parent', 'GrandParent']);
    });

    test('should return empty array for no inheritance hierarchy', async () => {
      mockResult.records = [];

      const result = await edgeManager.findInheritanceHierarchy('SingleClass', 'test-project');
      expect(result).toEqual([]);
    });
  });

  describe('cross-project methods', () => {
    test('should find edges by type across projects', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'implements',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.findEdgesByTypeAcrossProjects('implements');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('implements');
    });

    test('should find cross-project dependencies', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'cross-edge',
                project_id: 'project-1',
                type: 'calls',
                attributes_json: '{}'
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.findCrossProjectDependencies();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cross-edge');
    });
  });

  describe('recordToEdge', () => {
    test('should handle edge with empty attributes', async () => {
      const mockRecord = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'r') {
            return {
              properties: {
                id: 'test-edge',
                project_id: 'test-project',
                type: 'calls',
                attributes_json: null
              }
            };
          }
          if (key === 'sourceId') return 'source-node';
          if (key === 'targetId') return 'target-node';
        })
      };

      mockResult.records = [mockRecord];

      const result = await edgeManager.getEdge('test-edge', 'test-project');
      expect(result?.attributes).toEqual({});
    });
  });
});