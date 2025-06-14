import { Neo4jClient } from '../../../src/graph/neo4j-client.js';
import { getAnnotationUsage } from '../../../src/mcp/tools/get-annotation-usage.js';

// Mock the Neo4jClient
jest.mock('../../../src/graph/neo4j-client.js');

describe('Get Annotation Usage Tool', () => {
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockNeo4jClient = {
      runQuery: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAnnotationUsage', () => {
    test('should get annotation usage grouped by annotation (default)', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@Component';
                case 'framework': return 'Spring';
                case 'category': return 'injection';
                case 'annotation_type': return 'class';
                case 'usage_count': return 15;
                case 'node_types': return ['class', 'interface'];
                case 'sample_nodes': return [
                  'com.example.UserService',
                  'com.example.OrderService',
                  'com.example.ProductService'
                ];
                default: return null;
              }
            })
          },
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@Test';
                case 'framework': return 'JUnit';
                case 'category': return 'testing';
                case 'annotation_type': return 'method';
                case 'usage_count': return 12;
                case 'node_types': return ['method'];
                case 'sample_nodes': return [
                  'com.example.UserServiceTest.testCreateUser',
                  'com.example.UserServiceTest.testDeleteUser'
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getAnnotationUsage(mockNeo4jClient);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY usage_count DESC'),
        {}
      );
      expect(result.annotations).toHaveLength(2);
      expect(result.annotations[0].annotation_name).toBe('@Component');
      expect(result.annotations[0].framework).toBe('Spring');
      expect(result.annotations[0].usage_count).toBe(15);
      expect(result.annotations[0].sample_nodes).toHaveLength(3);
      expect(result.annotations[1].annotation_name).toBe('@Test');
      expect(result.total_annotations).toBe(2);
    });

    test('should get annotation usage with category filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@Test';
                case 'framework': return 'JUnit';
                case 'category': return 'testing';
                case 'annotation_type': return 'method';
                case 'usage_count': return 8;
                case 'node_types': return ['method'];
                case 'sample_nodes': return ['com.example.test.MyTest.testMethod'];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        category: 'testing'
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.category = $category'),
        { category: 'testing' }
      );
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].category).toBe('testing');
    });

    test('should get annotation usage with framework filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@Autowired';
                case 'framework': return 'Spring';
                case 'category': return 'injection';
                case 'annotation_type': return 'field';
                case 'usage_count': return 5;
                case 'node_types': return ['field'];
                case 'sample_nodes': return ['com.example.UserController.userService'];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        framework: 'Spring'
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.framework = $framework'),
        { framework: 'Spring' }
      );
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].framework).toBe('Spring');
    });

    test('should exclude deprecated annotations when include_deprecated is false', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@Component';
                case 'framework': return 'Spring';
                case 'category': return 'injection';
                case 'annotation_type': return 'class';
                case 'usage_count': return 3;
                case 'node_types': return ['class'];
                case 'sample_nodes': return ['com.example.ActiveService'];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        include_deprecated: false
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining("AND annotation.name <> '@Deprecated'"),
        {}
      );
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].annotation_name).toBe('@Component');
    });

    test('should group by category', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'category': return 'testing';
                case 'annotations': return [
                  {
                    name: '@Test',
                    framework: 'JUnit',
                    usage_count: 10,
                    node_types: ['method'],
                    sample_nodes: ['com.example.test.MyTest.testMethod']
                  },
                  {
                    name: '@BeforeEach',
                    framework: 'JUnit',
                    usage_count: 5,
                    node_types: ['method'],
                    sample_nodes: ['com.example.test.MyTest.setUp']
                  }
                ];
                case 'total_usage': return 15;
                default: return null;
              }
            })
          },
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'category': return 'injection';
                case 'annotations': return [
                  {
                    name: '@Component',
                    framework: 'Spring',
                    usage_count: 8,
                    node_types: ['class'],
                    sample_nodes: ['com.example.UserService']
                  }
                ];
                case 'total_usage': return 8;
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        group_by: 'category' as const
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WITH annotation.category as grouping_key'),
        {}
      );
      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].category).toBe('testing');
      expect(result.groups[0].total_usage).toBe(15);
      expect(result.groups[0].annotations).toHaveLength(2);
      expect(result.groups[1].category).toBe('injection');
      expect(result.total_groups).toBe(2);
    });

    test('should group by framework', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Spring';
                case 'annotations': return [
                  {
                    name: '@Component',
                    category: 'injection',
                    usage_count: 12,
                    node_types: ['class'],
                    sample_nodes: ['com.example.UserService']
                  },
                  {
                    name: '@Autowired',
                    category: 'injection',
                    usage_count: 8,
                    node_types: ['field'],
                    sample_nodes: ['com.example.UserController.userService']
                  }
                ];
                case 'total_usage': return 20;
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        group_by: 'framework' as const
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WITH annotation.framework as grouping_key'),
        {}
      );
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].framework).toBe('Spring');
      expect(result.groups[0].total_usage).toBe(20);
      expect(result.groups[0].annotations).toHaveLength(2);
    });

    test('should handle empty results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getAnnotationUsage(mockNeo4jClient);

      expect(result.annotations).toHaveLength(0);
      expect(result.total_annotations).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getAnnotationUsage(mockNeo4jClient);

      expect(result.annotations).toHaveLength(0);
      expect(result.total_annotations).toBe(0);
    });

    test('should handle empty results when grouping', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        group_by: 'category' as const
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(result.groups).toHaveLength(0);
      expect(result.total_groups).toBe(0);
    });

    test('should handle complex filtering with all parameters', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'annotation_name': return '@GetMapping';
                case 'framework': return 'Spring';
                case 'category': return 'web';
                case 'annotation_type': return 'method';
                case 'usage_count': return 3;
                case 'node_types': return ['method'];
                case 'sample_nodes': return ['com.example.UserController.getUser'];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        category: 'web',
        framework: 'Spring',
        include_deprecated: false
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.category = $category'),
        { category: 'web', framework: 'Spring' }
      );
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].annotation_name).toBe('@GetMapping');
      expect(result.annotations[0].category).toBe('web');
      expect(result.annotations[0].framework).toBe('Spring');
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Database timeout'));

      await expect(getAnnotationUsage(mockNeo4jClient)).rejects.toThrow('Database timeout');
    });

    test('should handle annotations without framework when grouping by framework', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'JUnit';
                case 'annotations': return [
                  {
                    name: '@Test',
                    category: 'testing',
                    usage_count: 5,
                    node_types: ['method'],
                    sample_nodes: ['test.method']
                  }
                ];
                case 'total_usage': return 5;
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        group_by: 'framework' as const
      };

      const result = await getAnnotationUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE grouping_key IS NOT NULL'),
        {}
      );
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].framework).toBe('JUnit');
    });
  });
});