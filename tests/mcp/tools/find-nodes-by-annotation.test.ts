import { Neo4jClient } from '../../../src/graph/neo4j-client.js';
import { findNodesByAnnotation } from '../../../src/mcp/tools/find-nodes-by-annotation.js';

// Mock the Neo4jClient
jest.mock('../../../src/graph/neo4j-client.js');

describe('Find Nodes By Annotation Tool', () => {
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockNeo4jClient = {
      runQuery: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findNodesByAnnotation', () => {
    test('should find nodes by annotation name only', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'test-class',
                    type: 'class',
                    name: 'TestClass',
                    qualified_name: 'com.example.TestClass',
                    source_file: 'TestClass.java'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@Component',
                  framework: 'Spring',
                  category: 'injection',
                  parameters: { value: 'testService' }
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
                    id: 'another-class',
                    type: 'class',
                    name: 'AnotherClass',
                    qualified_name: 'com.example.AnotherClass',
                    source_file: 'AnotherClass.java'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@Component',
                  framework: 'Spring',
                  category: 'injection'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@Component'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE annotation.name = $annotation_name'),
        { annotation_name: '@Component' }
      );
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].name).toBe('TestClass');
      expect(result.nodes[0].matched_annotation.name).toBe('@Component');
      expect(result.nodes[0].matched_annotation.framework).toBe('Spring');
      expect(result.nodes[1].name).toBe('AnotherClass');
      expect(result.total_count).toBe(2);
    });

    test('should find nodes by annotation with framework filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'spring-component',
                    type: 'class',
                    name: 'SpringComponent',
                    qualified_name: 'com.example.SpringComponent'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@Component',
                  framework: 'Spring',
                  category: 'injection'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@Component',
        framework: 'Spring'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.framework = $framework'),
        { annotation_name: '@Component', framework: 'Spring' }
      );
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].matched_annotation.framework).toBe('Spring');
    });

    test('should find nodes by annotation with category filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'test-method',
                    type: 'method',
                    name: 'testMethod',
                    qualified_name: 'com.example.TestClass.testMethod'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@Test',
                  framework: 'JUnit',
                  category: 'testing'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@Test',
        category: 'testing'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.category = $category'),
        { annotation_name: '@Test', category: 'testing' }
      );
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].matched_annotation.category).toBe('testing');
    });

    test('should find nodes by annotation with node type filter', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'test-class',
                    type: 'class',
                    name: 'TestClass',
                    qualified_name: 'com.example.TestClass'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@Entity',
                  framework: 'JPA',
                  category: 'persistence'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@Entity',
        node_type: 'class' as const
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND n.type = $node_type'),
        { annotation_name: '@Entity', node_type: 'class' }
      );
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('class');
    });

    test('should find nodes with all filters applied', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'rest-controller',
                    type: 'class',
                    name: 'UserController',
                    qualified_name: 'com.example.controller.UserController'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@RestController',
                  framework: 'Spring',
                  category: 'web',
                  parameters: { value: '/api/users' }
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@RestController',
        framework: 'Spring',
        category: 'web',
        node_type: 'class' as const
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.framework = $framework'),
        {
          annotation_name: '@RestController',
          framework: 'Spring',
          category: 'web',
          node_type: 'class'
        }
      );
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].name).toBe('UserController');
      expect(result.nodes[0].matched_annotation.name).toBe('@RestController');
      expect(result.nodes[0].matched_annotation.framework).toBe('Spring');
      expect(result.nodes[0].matched_annotation.category).toBe('web');
    });

    test('should handle empty results', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@NonExistentAnnotation'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(result.nodes).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@TestAnnotation'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(result.nodes).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    test('should handle annotations with special characters', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'python-method',
                    type: 'method',
                    name: 'static_method',
                    qualified_name: 'example.MyClass.static_method'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: 'staticmethod',
                  framework: 'Python',
                  category: 'builtin'
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: 'staticmethod'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].matched_annotation.name).toBe('staticmethod');
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Database connection failed'));

      const params = {
        annotation_name: '@Component'
      };

      await expect(findNodesByAnnotation(mockNeo4jClient, params)).rejects.toThrow('Database connection failed');
    });

    test('should handle nodes with complex annotation parameters', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((field) => {
              if (field === 'n') {
                return {
                  properties: {
                    id: 'endpoint-method',
                    type: 'method',
                    name: 'getUserById',
                    qualified_name: 'com.example.UserController.getUserById'
                  }
                };
              }
              if (field === 'matched_annotation') {
                return {
                  name: '@GetMapping',
                  framework: 'Spring',
                  category: 'web',
                  parameters: {
                    value: '/users/{id}',
                    produces: 'application/json',
                    headers: ['Accept=application/json']
                  }
                };
              }
              return null;
            })
          }
        ]
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        annotation_name: '@GetMapping'
      };

      const result = await findNodesByAnnotation(mockNeo4jClient, params);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].matched_annotation.parameters.value).toBe('/users/{id}');
      expect(result.nodes[0].matched_annotation.parameters.produces).toBe('application/json');
    });
  });
});