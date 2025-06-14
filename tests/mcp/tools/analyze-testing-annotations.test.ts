import { Neo4jClient } from '../../../src/graph/neo4j-client.js';
import { analyzeTestingAnnotations, findUntestableCode } from '../../../src/mcp/tools/analyze-testing-annotations.js';

// Mock the Neo4jClient
jest.mock('../../../src/graph/neo4j-client.js');

describe('Analyze Testing Annotations Tools', () => {
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;

  beforeEach(() => {
    mockNeo4jClient = {
      runQuery: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeTestingAnnotations', () => {
    test('should analyze testing annotations without framework filter', async () => {
      const mockMainResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('com.example.TestClass.testMethod')
              .mockReturnValueOnce('method')
              .mockReturnValueOnce('TestClass.java')
              .mockReturnValueOnce([
                { name: '@Test', category: 'testing', framework: 'JUnit' },
                { name: '@BeforeEach', category: 'testing', framework: 'JUnit' }
              ])
              .mockReturnValueOnce(2)
          },
          {
            get: jest.fn()
              .mockReturnValueOnce('com.example.AnotherTestClass.anotherTest')
              .mockReturnValueOnce('method')
              .mockReturnValueOnce('AnotherTestClass.java')
              .mockReturnValueOnce([
                { name: '@Test', category: 'testing', framework: 'JUnit' }
              ])
              .mockReturnValueOnce(1)
          }
        ]
      };

      const mockFrameworkResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('JUnit')
              .mockReturnValueOnce([
                { name: '@Test', count: 2 },
                { name: '@BeforeEach', count: 1 }
              ])
              .mockReturnValueOnce(3)
          }
        ]
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult);

      const params = {
        project: 'test-project'
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledTimes(2);
      expect(result.test_entities).toHaveLength(2);
      expect(result.test_entities[0].test_entity).toBe('com.example.TestClass.testMethod');
      expect(result.test_entities[0].annotation_count).toBe(2);
      expect(result.framework_statistics).toHaveLength(1);
      expect(result.framework_statistics[0].framework).toBe('JUnit');
      expect(result.framework_statistics[0].total_usage).toBe(3);
      expect(result.coverage_analysis).toBeNull();
      expect(result.summary.total_test_entities).toBe(2);
      expect(result.summary.frameworks_used).toBe(1);
      expect(result.summary.total_testing_annotations).toBe(3);
    });

    test('should analyze testing annotations with framework filter', async () => {
      const mockMainResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('com.example.TestClass.testMethod')
              .mockReturnValueOnce('method')
              .mockReturnValueOnce('TestClass.java')
              .mockReturnValueOnce([
                { name: '@Test', category: 'testing', framework: 'JUnit' }
              ])
              .mockReturnValueOnce(1)
          }
        ]
      };

      const mockFrameworkResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('JUnit')
              .mockReturnValueOnce([
                { name: '@Test', count: 1 }
              ])
              .mockReturnValueOnce(1)
          }
        ]
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult);

      const params = {
        project: 'test-project',
        framework: 'JUnit'
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND annotation.framework = $framework'),
        { project: 'test-project', framework: 'JUnit' }
      );
      expect(result.test_entities).toHaveLength(1);
      expect(result.framework_statistics[0].framework).toBe('JUnit');
    });

    test('should include coverage analysis when requested', async () => {
      const mockMainResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('com.example.TestClass.testMethod')
              .mockReturnValueOnce('method')
              .mockReturnValueOnce('TestClass.java')
              .mockReturnValueOnce([
                { name: '@Test', category: 'testing', framework: 'JUnit' }
              ])
              .mockReturnValueOnce(1)
          }
        ]
      };

      const mockFrameworkResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce('JUnit')
              .mockReturnValueOnce([
                { name: '@Test', count: 1 }
              ])
              .mockReturnValueOnce(1)
          }
        ]
      };

      const mockCoverageResult = {
        records: [
          {
            get: jest.fn()
              .mockReturnValueOnce(10)
              .mockReturnValueOnce(7)
              .mockReturnValueOnce(3)
              .mockReturnValueOnce(70)
          }
        ]
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult)
        .mockResolvedValueOnce(mockCoverageResult);

      const params = {
        project: 'test-project',
        include_coverage_analysis: true
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledTimes(3);
      expect(result.coverage_analysis).not.toBeNull();
      expect(result.coverage_analysis!.total_methods).toBe(10);
      expect(result.coverage_analysis!.methods_with_tests).toBe(7);
      expect(result.coverage_analysis!.methods_without_tests).toBe(3);
      expect(result.coverage_analysis!.coverage_percentage).toBe(70);
    });

    test('should handle empty results', async () => {
      const mockMainResult = { records: [] };
      const mockFrameworkResult = { records: [] };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult);

      const params = {
        project: 'empty-project'
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(result.test_entities).toHaveLength(0);
      expect(result.framework_statistics).toHaveLength(0);
      expect(result.summary.total_test_entities).toBe(0);
      expect(result.summary.frameworks_used).toBe(0);
      expect(result.summary.total_testing_annotations).toBe(0);
    });

    test('should handle null records', async () => {
      const mockMainResult = { records: null };
      const mockFrameworkResult = { records: null };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult);

      const params = {
        project: 'null-project'
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(result.test_entities).toHaveLength(0);
      expect(result.framework_statistics).toHaveLength(0);
      expect(result.summary.total_test_entities).toBe(0);
      expect(result.summary.frameworks_used).toBe(0);
      expect(result.summary.total_testing_annotations).toBe(0);
    });

    test('should handle coverage analysis with no records', async () => {
      const mockMainResult = { records: [] };
      const mockFrameworkResult = { records: [] };
      const mockCoverageResult = { records: [] };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce(mockMainResult)
        .mockResolvedValueOnce(mockFrameworkResult)
        .mockResolvedValueOnce(mockCoverageResult);

      const params = {
        project: 'empty-project',
        include_coverage_analysis: true
      };

      const result = await analyzeTestingAnnotations(mockNeo4jClient, params);

      expect(result.coverage_analysis).toBeNull();
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Database connection failed'));

      const params = {
        project: 'test-project'
      };

      await expect(analyzeTestingAnnotations(mockNeo4jClient, params)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findUntestableCode', () => {
    test('should find untestable code patterns', async () => {
      const mockRecords = [
        {
          get: jest.fn((field) => {
            switch (field) {
              case 'testability_concern': return 'private';
              case 'methods': return [
                {
                  qualified_name: 'com.example.Class.privateMethod',
                  type: 'method',
                  source_file: 'Class.java',
                  parameter_count: 2
                },
                {
                  qualified_name: 'com.example.Class.anotherPrivateMethod',
                  type: 'method',
                  source_file: 'Class.java',
                  parameter_count: 1
                }
              ];
              case 'count': return 2;
              default: return null;
            }
          })
        },
        {
          get: jest.fn((field) => {
            switch (field) {
              case 'testability_concern': return 'too_many_parameters';
              case 'methods': return [
                {
                  qualified_name: 'com.example.Class.complexMethod',
                  type: 'method',
                  source_file: 'Class.java',
                  parameter_count: 15
                }
              ];
              case 'count': return 1;
              default: return null;
            }
          })
        }
      ];

      // Add reduce method to mock records array
      (mockRecords as any).reduce = jest.fn((callback: any, initial: number) => {
        let sum = initial;
        for (const record of mockRecords) {
          sum = callback(sum, record);
        }
        return sum;
      });

      const mockResult = {
        records: mockRecords
      };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        project: 'test-project'
      };

      const result = await findUntestableCode(mockNeo4jClient, params);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE n.project_id = $project'),
        { project: 'test-project' }
      );
      expect(result.testability_issues).toHaveLength(2);
      expect(result.testability_issues[0].concern).toBe('private');
      expect(result.testability_issues[0].methods).toHaveLength(2);
      expect(result.testability_issues[0].count).toBe(2);
      expect(result.testability_issues[1].concern).toBe('too_many_parameters');
      expect(result.testability_issues[1].methods).toHaveLength(1);
      expect(result.testability_issues[1].count).toBe(1);
      expect(result.total_concerning_methods).toBe(3);
    });

    test('should handle no untestable code found', async () => {
      const mockResult = { records: [] };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        project: 'clean-project'
      };

      const result = await findUntestableCode(mockNeo4jClient, params);

      expect(result.testability_issues).toHaveLength(0);
      expect(result.total_concerning_methods).toBe(0);
    });

    test('should handle null records', async () => {
      const mockResult = { records: null };

      mockNeo4jClient.runQuery.mockResolvedValue(mockResult);

      const params = {
        project: 'null-project'
      };

      const result = await findUntestableCode(mockNeo4jClient, params);

      expect(result.testability_issues).toHaveLength(0);
      expect(result.total_concerning_methods).toBe(0);
    });

    test('should propagate database errors', async () => {
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Neo4j connection timeout'));

      const params = {
        project: 'test-project'
      };

      await expect(findUntestableCode(mockNeo4jClient, params)).rejects.toThrow('Neo4j connection timeout');
    });
  });
});