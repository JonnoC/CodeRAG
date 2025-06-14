import { Neo4jClient } from '../../../src/graph/neo4j-client.js';
import { findDeprecatedCode, findUsageOfDeprecatedCode } from '../../../src/mcp/tools/find-deprecated-code.js';

// Mock the Neo4jClient
jest.mock('../../../src/graph/neo4j-client.js');

describe('Find Deprecated Code Tools', () => {
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockNeo4jClient = {
      runQuery: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findDeprecatedCode', () => {
    test('should find deprecated code without dependencies', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'deprecated-class',
                    type: 'class',
                    name: 'DeprecatedClass',
                    qualified_name: 'com.example.DeprecatedClass',
                    source_file: 'DeprecatedClass.java'
                  }
                };
              }
              if (field === 'deprecation_annotation') {
                return {
                  name: '@Deprecated',
                  category: 'deprecation',
                  message: 'Use NewClass instead'
                };
              }
              return null;
            })
          },
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'deprecated-method',
                    type: 'method',
                    name: 'oldMethod',
                    qualified_name: 'com.example.SomeClass.oldMethod',
                    source_file: 'SomeClass.java'
                  }
                };
              }
              if (field === 'deprecation_annotation') {
                return {
                  name: '@deprecated',
                  category: 'deprecation',
                  message: 'Use newMethod instead'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findDeprecatedCode(mockNeo4jClient);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE n.attributes IS NOT NULL'),
        {}
      );
      expect(result.deprecated_nodes).toHaveLength(2);
      expect(result.deprecated_nodes[0].name).toBe('DeprecatedClass');
      expect(result.deprecated_nodes[0].deprecation_info.message).toBe('Use NewClass instead');
      expect(result.deprecated_nodes[1].name).toBe('oldMethod');
      expect(result.deprecated_nodes[1].deprecation_info.message).toBe('Use newMethod instead');
      expect(result.total_count).toBe(2);
    });

    test('should find deprecated code with node type filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'deprecated-class',
                    type: 'class',
                    name: 'DeprecatedClass',
                    qualified_name: 'com.example.DeprecatedClass'
                  }
                };
              }
              if (field === 'deprecation_annotation') {
                return {
                  name: '@Deprecated',
                  category: 'deprecation'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        node_type: 'class' as const
      };

      const result = await findDeprecatedCode(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND n.type = $node_type'),
        { node_type: 'class' }
      );
      expect(result.deprecated_nodes).toHaveLength(1);
      expect(result.deprecated_nodes[0].type).toBe('class');
    });

    test('should find deprecated code with dependencies', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'deprecated-class',
                    type: 'class',
                    name: 'DeprecatedClass',
                    qualified_name: 'com.example.DeprecatedClass'
                  }
                };
              }
              if (field === 'deprecation_annotation') {
                return {
                  name: '@Deprecated',
                  category: 'deprecation'
                };
              }
              if (field === 'dependencies') {
                return [
                  {
                    node: 'com.example.ClientClass',
                    relationship: 'extends',
                    type: 'class'
                  },
                  {
                    node: 'com.example.AnotherClass.method',
                    relationship: 'calls',
                    type: 'method'
                  }
                ];
              }
              if (field === 'dependency_count') {
                return 2;
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        include_dependencies: true
      };

      const result = await findDeprecatedCode(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('OPTIONAL MATCH (n)<-[r:calls|references|extends|implements]-(dependentNode)'),
        {}
      );
      expect(result.deprecated_nodes).toHaveLength(1);
      expect(result.deprecated_nodes[0].dependencies).toHaveLength(2);
      expect(result.deprecated_nodes[0].dependency_count).toBe(2);
      expect(result.deprecated_nodes[0].dependencies[0].node).toBe('com.example.ClientClass');
      expect(result.deprecated_nodes[0].dependencies[0].relationship).toBe('extends');
    });

    test('should handle empty results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findDeprecatedCode(mockNeo4jClient);

      expect(result.deprecated_nodes).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findDeprecatedCode(mockNeo4jClient);

      expect(result.deprecated_nodes).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(findDeprecatedCode(mockNeo4jClient)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findUsageOfDeprecatedCode', () => {
    test('should find usage of deprecated code without details', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'deprecated_node') {
                return 'com.example.DeprecatedClass';
              }
              if (field === 'deprecated_type') {
                return 'class';
              }
              if (field === 'usage_count') {
                return 5;
              }
              return null;
            })
          },
          {
            get: jest.fn((field) => {
              if (field === 'deprecated_node') {
                return 'com.example.oldMethod';
              }
              if (field === 'deprecated_type') {
                return 'method';
              }
              if (field === 'usage_count') {
                return 3;
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findUsageOfDeprecatedCode(mockNeo4jClient);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (deprecated)<-[r:calls|references|extends|implements]-(using)')
      );
      expect(result.deprecated_usage).toHaveLength(2);
      expect(result.deprecated_usage[0].deprecated_node).toBe('com.example.DeprecatedClass');
      expect(result.deprecated_usage[0].usage_count).toBe(5);
      expect(result.deprecated_usage[1].deprecated_node).toBe('com.example.oldMethod');
      expect(result.deprecated_usage[1].usage_count).toBe(3);
      expect(result.total_deprecated_items).toBe(2);
    });

    test('should find usage of deprecated code with details', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'deprecated_node') {
                return 'com.example.DeprecatedClass';
              }
              if (field === 'deprecated_type') {
                return 'class';
              }
              if (field === 'usage_count') {
                return 2;
              }
              if (field === 'deprecation_info') {
                return {
                  name: '@Deprecated',
                  message: 'Use NewClass instead'
                };
              }
              if (field === 'usage_details') {
                return [
                  {
                    using_node: 'com.example.ClientClass',
                    using_type: 'class',
                    relationship: 'extends',
                    source_file: 'ClientClass.java'
                  },
                  {
                    using_node: 'com.example.AnotherClass.method',
                    using_type: 'method',
                    relationship: 'references',
                    source_file: 'AnotherClass.java'
                  }
                ];
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        include_usage_details: true
      };

      const result = await findUsageOfDeprecatedCode(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('deprecation_info')
      );
      expect(result.deprecated_usage).toHaveLength(1);
      expect(result.deprecated_usage[0].deprecated_node).toBe('com.example.DeprecatedClass');
      expect(result.deprecated_usage[0].deprecation_info.message).toBe('Use NewClass instead');
      expect(result.deprecated_usage[0].usage_details).toHaveLength(2);
      expect(result.deprecated_usage[0].usage_details[0].using_node).toBe('com.example.ClientClass');
      expect(result.deprecated_usage[0].usage_details[0].relationship).toBe('extends');
    });

    test('should handle empty results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findUsageOfDeprecatedCode(mockNeo4jClient);

      expect(result.deprecated_usage).toHaveLength(0);
      expect(result.total_deprecated_items).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await findUsageOfDeprecatedCode(mockNeo4jClient);

      expect(result.deprecated_usage).toHaveLength(0);
      expect(result.total_deprecated_items).toBe(0);
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Neo4j timeout'));

      await expect(findUsageOfDeprecatedCode(mockNeo4jClient)).rejects.toThrow('Neo4j timeout');
    });
  });
});