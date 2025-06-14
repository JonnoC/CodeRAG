import { Neo4jClient } from '../../../src/graph/neo4j-client.js';
import { getFrameworkUsage } from '../../../src/mcp/tools/get-framework-usage.js';

// Mock the Neo4jClient
jest.mock('../../../src/graph/neo4j-client.js');

describe('Get Framework Usage Tool', () => {
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockNeo4jClient = {
      runQuery: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getFrameworkUsage', () => {
    test('should get framework usage without parameters (default)', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Spring';
                case 'total_framework_usage': return 25;
                case 'annotations': return [
                  {
                    name: '@Component',
                    category: 'injection',
                    usage_count: 10,
                    sample_nodes: [
                      'com.example.UserService',
                      'com.example.OrderService',
                      'com.example.ProductService'
                    ]
                  },
                  {
                    name: '@Autowired',
                    category: 'injection',
                    usage_count: 8,
                    sample_nodes: [
                      'com.example.UserController.userService',
                      'com.example.OrderController.orderService'
                    ]
                  },
                  {
                    name: '@RestController',
                    category: 'web',
                    usage_count: 7,
                    sample_nodes: [
                      'com.example.UserController',
                      'com.example.OrderController'
                    ]
                  }
                ];
                default: return null;
              }
            })
          },
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'JUnit';
                case 'total_framework_usage': return 15;
                case 'annotations': return [
                  {
                    name: '@Test',
                    category: 'testing',
                    usage_count: 12,
                    sample_nodes: [
                      'com.example.UserServiceTest.testCreateUser',
                      'com.example.UserServiceTest.testDeleteUser'
                    ]
                  },
                  {
                    name: '@BeforeEach',
                    category: 'testing',
                    usage_count: 3,
                    sample_nodes: [
                      'com.example.UserServiceTest.setUp'
                    ]
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getFrameworkUsage(mockNeo4jClient);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE annotation.framework IS NOT NULL'),
        { min_usage_count: 1 }
      );
      expect(result.frameworks).toHaveLength(2);
      expect(result.frameworks[0].framework).toBe('Spring');
      expect(result.frameworks[0].total_usage).toBe(25);
      expect(result.frameworks[0].annotations).toHaveLength(3);
      expect(result.frameworks[0].annotations[0].name).toBe('@Component');
      expect(result.frameworks[1].framework).toBe('JUnit');
      expect(result.frameworks[1].total_usage).toBe(15);
      expect(result.total_frameworks).toBe(2);
    });

    test('should get framework usage with parameters included', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Spring';
                case 'total_framework_usage': return 5;
                case 'annotations': return [
                  {
                    name: '@GetMapping',
                    category: 'web',
                    usage_count: 3,
                    parameters: {
                      value: '/users/{id}',
                      produces: 'application/json'
                    },
                    sample_nodes: [
                      'com.example.UserController.getUser'
                    ]
                  },
                  {
                    name: '@PostMapping',
                    category: 'web',
                    usage_count: 2,
                    parameters: {
                      value: '/users',
                      consumes: 'application/json'
                    },
                    sample_nodes: [
                      'com.example.UserController.createUser'
                    ]
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        include_parameters: true
      };

      const result = await getFrameworkUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('annotation.parameters as parameters'),
        { min_usage_count: 1 }
      );
      expect(result.frameworks).toHaveLength(1);
      expect(result.frameworks[0].annotations[0].parameters).toEqual({
        value: '/users/{id}',
        produces: 'application/json'
      });
      expect(result.frameworks[0].annotations[1].parameters).toEqual({
        value: '/users',
        consumes: 'application/json'
      });
    });

    test('should filter by minimum usage count', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Spring';
                case 'total_framework_usage': return 15;
                case 'annotations': return [
                  {
                    name: '@Component',
                    category: 'injection',
                    usage_count: 10,
                    sample_nodes: ['com.example.UserService']
                  },
                  {
                    name: '@RestController',
                    category: 'web',
                    usage_count: 5,
                    sample_nodes: ['com.example.UserController']
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        min_usage_count: 5
      };

      const result = await getFrameworkUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE usage_count >= $min_usage_count'),
        { min_usage_count: 5 }
      );
      expect(result.frameworks).toHaveLength(1);
      expect(result.frameworks[0].framework).toBe('Spring');
      expect(result.frameworks[0].annotations).toHaveLength(2);
      // Both annotations should have usage_count >= 5
      expect(result.frameworks[0].annotations[0].usage_count).toBeGreaterThanOrEqual(5);
      expect(result.frameworks[0].annotations[1].usage_count).toBeGreaterThanOrEqual(5);
    });

    test('should handle frameworks with many annotations', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Spring';
                case 'total_framework_usage': return 50;
                case 'annotations': return [
                  {
                    name: '@Component',
                    category: 'injection',
                    usage_count: 15,
                    sample_nodes: [
                      'com.example.UserService',
                      'com.example.OrderService',
                      'com.example.ProductService',
                      'com.example.PaymentService',
                      'com.example.NotificationService'
                    ]
                  },
                  {
                    name: '@Service',
                    category: 'injection',
                    usage_count: 12,
                    sample_nodes: [
                      'com.example.BusinessService',
                      'com.example.DataService'
                    ]
                  },
                  {
                    name: '@Repository',
                    category: 'persistence',
                    usage_count: 8,
                    sample_nodes: [
                      'com.example.UserRepository',
                      'com.example.OrderRepository'
                    ]
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getFrameworkUsage(mockNeo4jClient);

      expect(result.frameworks).toHaveLength(1);
      expect(result.frameworks[0].annotations).toHaveLength(3);
      expect(result.frameworks[0].annotations[0].sample_nodes).toHaveLength(5);
      expect(result.frameworks[0].total_usage).toBe(50);
    });

    test('should handle combined parameters', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'Django';
                case 'total_framework_usage': return 8;
                case 'annotations': return [
                  {
                    name: '@login_required',
                    category: 'security',
                    usage_count: 5,
                    parameters: {
                      login_url: '/login/',
                      redirect_field_name: 'next'
                    },
                    sample_nodes: [
                      'myapp.views.dashboard',
                      'myapp.views.profile'
                    ]
                  },
                  {
                    name: '@permission_required',
                    category: 'security',
                    usage_count: 3,
                    parameters: {
                      perm: 'myapp.can_edit',
                      raise_exception: true
                    },
                    sample_nodes: [
                      'myapp.views.edit_user'
                    ]
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        include_parameters: true,
        min_usage_count: 3
      };

      const result = await getFrameworkUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('annotation.parameters as parameters'),
        { min_usage_count: 3 }
      );
      expect(result.frameworks).toHaveLength(1);
      expect(result.frameworks[0].framework).toBe('Django');
      expect(result.frameworks[0].annotations).toHaveLength(2);
      expect(result.frameworks[0].annotations[0].parameters).toBeDefined();
      expect(result.frameworks[0].annotations[1].parameters).toBeDefined();
    });

    test('should handle empty results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getFrameworkUsage(mockNeo4jClient);

      expect(result.frameworks).toHaveLength(0);
      expect(result.total_frameworks).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getFrameworkUsage(mockNeo4jClient);

      expect(result.frameworks).toHaveLength(0);
      expect(result.total_frameworks).toBe(0);
    });

    test('should handle high minimum usage count that filters out all results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        min_usage_count: 100
      };

      const result = await getFrameworkUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.anything(),
        { min_usage_count: 100 }
      );
      expect(result.frameworks).toHaveLength(0);
      expect(result.total_frameworks).toBe(0);
    });

    test('should handle frameworks with annotations but no category', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              switch (field) {
                case 'framework': return 'CustomFramework';
                case 'total_framework_usage': return 3;
                case 'annotations': return [
                  {
                    name: '@CustomAnnotation',
                    category: null,
                    usage_count: 3,
                    sample_nodes: [
                      'com.example.CustomClass'
                    ]
                  }
                ];
                default: return null;
              }
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const result = await getFrameworkUsage(mockNeo4jClient);

      expect(result.frameworks).toHaveLength(1);
      expect(result.frameworks[0].annotations[0].category).toBeNull();
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Connection timeout'));

      await expect(getFrameworkUsage(mockNeo4jClient)).rejects.toThrow('Connection timeout');
    });

    test('should validate min_usage_count parameter is passed correctly', async () => {
      const mockResult = { records: [] };
      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        min_usage_count: 10
      };

      await getFrameworkUsage(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.anything(),
        { min_usage_count: 10 }
      );
    });
  });
});