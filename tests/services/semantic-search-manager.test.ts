import { SemanticSearchManager } from '../../src/services/semantic-search-manager.js';
import { EmbeddingService } from '../../src/services/embedding-service.js';
import { Neo4jClient } from '../../src/graph/neo4j-client.js';
import { SemanticSearchParams, SemanticEmbedding, CodeNode } from '../../src/types.js';

// Mock dependencies
jest.mock('../../src/services/embedding-service.js');
jest.mock('../../src/graph/neo4j-client.js');

describe('SemanticSearchManager', () => {
  let manager: SemanticSearchManager;
  let mockNeo4jClient: jest.Mocked<Neo4jClient>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const mockEmbedding: SemanticEmbedding = {
    vector: [0.1, 0.2, 0.3, 0.4, 0.5],
    model: 'text-embedding-3-small',
    version: '1.0',
    created_at: new Date('2024-01-01')
  };

  const mockCodeNode: CodeNode = {
    id: 'test-node',
    project_id: 'test-project',
    type: 'function',
    name: 'validateEmail',
    qualified_name: 'utils.validateEmail',
    description: 'Validates email addresses'
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocked instances
    mockNeo4jClient = {
      runQuery: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      healthCheck: jest.fn(),
      initializeDatabase: jest.fn(),
      createProject: jest.fn(),
      getProject: jest.fn(),
      listProjects: jest.fn(),
      deleteProject: jest.fn()
    } as any;

    mockEmbeddingService = {
      isEnabled: jest.fn(),
      generateEmbedding: jest.fn(),
      generateEmbeddings: jest.fn(),
      extractSemanticContent: jest.fn()
    } as any;

    manager = new SemanticSearchManager(mockNeo4jClient, mockEmbeddingService);
  });

  describe('Constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(manager).toBeInstanceOf(SemanticSearchManager);
    });

    it('should create default embedding service if not provided', () => {
      const managerWithoutService = new SemanticSearchManager(mockNeo4jClient);
      expect(managerWithoutService).toBeInstanceOf(SemanticSearchManager);
    });
  });

  describe('initializeVectorIndexes', () => {
    it('should skip initialization when embedding service is disabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(false);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.initializeVectorIndexes();

      expect(consoleSpy).toHaveBeenCalledWith('Semantic search disabled, skipping vector index initialization');
      expect(mockNeo4jClient.runQuery).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should create vector index when embedding service is enabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [] });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.initializeVectorIndexes();

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE VECTOR INDEX semantic_embeddings'),
        expect.objectContaining({ dimensions: expect.any(Number) })
      );
      expect(consoleSpy).toHaveBeenCalledWith('Vector indexes initialized successfully');

      consoleSpy.mockRestore();
    });

    it('should handle initialization errors', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      const error = new Error('Database error');
      mockNeo4jClient.runQuery.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(manager.initializeVectorIndexes()).rejects.toThrow('Database error');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize vector indexes:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('addEmbeddingToNode', () => {
    it('should successfully add embedding to node', async () => {
      mockNeo4jClient.runQuery.mockResolvedValue({ 
        records: [{ get: () => mockCodeNode }] 
      });

      await manager.addEmbeddingToNode('test-node', 'test-project', mockEmbedding);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('SET n.semantic_embedding'),
        expect.objectContaining({
          nodeId: 'test-node',
          projectId: 'test-project',
          vector: mockEmbedding.vector,
          model: mockEmbedding.model,
          version: mockEmbedding.version,
          createdAt: mockEmbedding.created_at.toISOString()
        })
      );
    });

    it('should throw error when node not found', async () => {
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [] });

      await expect(
        manager.addEmbeddingToNode('missing-node', 'test-project', mockEmbedding)
      ).rejects.toThrow('Node not found: missing-node in project test-project');
    });
  });

  describe('semanticSearch', () => {
    const searchParams: SemanticSearchParams = {
      query: 'email validation functions',
      project_id: 'test-project',
      limit: 5,
      similarity_threshold: 0.7
    };

    it('should throw error when embedding service is disabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(false);

      await expect(manager.semanticSearch(searchParams)).rejects.toThrow('Semantic search is disabled');
    });

    it('should throw error when query embedding generation fails', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(null);

      await expect(manager.semanticSearch(searchParams)).rejects.toThrow('Failed to generate embedding for query');
    });

    it('should perform successful semantic search', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingService.extractSemanticContent.mockReturnValue('email validation function');

      const mockRecord = {
        get: jest.fn()
          .mockReturnValueOnce({ properties: mockCodeNode }) // for 'n'
          .mockReturnValueOnce(0.85) // for 'similarity'
      };

      mockNeo4jClient.runQuery.mockResolvedValue({
        records: [mockRecord]
      });

      const results = await manager.semanticSearch(searchParams);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        node: mockCodeNode,
        similarity_score: 0.85,
        matched_content: 'email validation function'
      });

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('vector.similarity.cosine'),
        expect.objectContaining({
          queryVector: mockEmbedding.vector,
          limit: 5,
          threshold: 0.7,
          projectId: 'test-project'
        })
      );
    });

    it('should handle search with node type filters', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [] });

      const paramsWithFilter = {
        ...searchParams,
        node_types: ['function', 'method'] as any[]
      };

      await manager.semanticSearch(paramsWithFilter);

      expect(mockNeo4jClient.runQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND n.type IN $nodeTypes'),
        expect.objectContaining({
          nodeTypes: ['function', 'method']
        })
      );
    });

    it('should handle search query errors', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockNeo4jClient.runQuery.mockRejectedValue(new Error('Query failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(manager.semanticSearch(searchParams)).rejects.toThrow('Semantic search failed: Query failed');

      consoleSpy.mockRestore();
    });
  });

  describe('hybridSearch', () => {
    const searchParams: SemanticSearchParams = {
      query: 'user authentication',
      project_id: 'test-project'
    };

    it('should return semantic results when graph context disabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingService.extractSemanticContent.mockReturnValue('user authentication');

      const mockRecord = {
        get: jest.fn()
          .mockReturnValueOnce({ properties: mockCodeNode })
          .mockReturnValueOnce(0.8)
      };

      mockNeo4jClient.runQuery.mockResolvedValue({ records: [mockRecord] });

      const results = await manager.hybridSearch(searchParams);

      expect(results).toHaveLength(1);
      expect(results[0].node).toEqual(mockCodeNode);
    });

    it('should enhance results with graph context when enabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingService.extractSemanticContent.mockReturnValue('user authentication');

      // Mock semantic search result
      const semanticRecord = {
        get: jest.fn()
          .mockReturnValueOnce({ properties: mockCodeNode })
          .mockReturnValueOnce(0.8)
      };

      // Mock context query result
      const relatedNode = { ...mockCodeNode, id: 'related-node', name: 'UserService' };
      const contextRecord = {
        get: jest.fn().mockReturnValue({ properties: relatedNode })
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce({ records: [semanticRecord] }) // semantic search
        .mockResolvedValueOnce({ records: [contextRecord] }); // context query

      const results = await manager.hybridSearch(searchParams, {
        includeRelationships: true,
        maxHops: 2
      });

      expect(results).toHaveLength(1);
      expect(results[0].matched_content).toContain('Related: UserService (function)');
    });

    it('should handle context query failures gracefully', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingService.extractSemanticContent.mockReturnValue('user authentication');

      const semanticRecord = {
        get: jest.fn()
          .mockReturnValueOnce({ properties: mockCodeNode })
          .mockReturnValueOnce(0.8)
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce({ records: [semanticRecord] })
        .mockRejectedValueOnce(new Error('Context query failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const results = await manager.hybridSearch(searchParams, {
        includeRelationships: true
      });

      expect(results).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get graph context'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getSimilarNodes', () => {
    it('should find similar nodes successfully', async () => {
      const targetEmbedding = [0.1, 0.2, 0.3];
      
      // Mock target node query
      const targetRecord = {
        get: jest.fn()
          .mockReturnValueOnce(targetEmbedding) // embedding
          .mockReturnValueOnce({ properties: mockCodeNode }) // node
      };

      // Mock similar nodes query
      const similarNode = { ...mockCodeNode, id: 'similar-node', name: 'validatePhone' };
      const similarRecord = {
        get: jest.fn()
          .mockReturnValueOnce({ properties: similarNode })
          .mockReturnValueOnce(0.75)
      };

      mockNeo4jClient.runQuery
        .mockResolvedValueOnce({ records: [targetRecord] }) // target node
        .mockResolvedValueOnce({ records: [similarRecord] }); // similar nodes

      mockEmbeddingService.extractSemanticContent.mockReturnValue('phone validation');

      const results = await manager.getSimilarNodes('test-node', 'test-project', 5);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        node: similarNode,
        similarity_score: 0.75,
        matched_content: 'phone validation'
      });
    });

    it('should throw error when target node not found', async () => {
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [] });

      await expect(
        manager.getSimilarNodes('missing-node', 'test-project')
      ).rejects.toThrow('Node not found or has no embedding: missing-node');
    });
  });

  describe('updateEmbeddings', () => {
    it('should throw error when embedding service is disabled', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(false);

      await expect(manager.updateEmbeddings()).rejects.toThrow('Semantic search is disabled');
    });

    it('should successfully update embeddings for nodes', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);

      // Mock nodes query
      const nodeRecord = {
        get: jest.fn().mockReturnValue({ properties: mockCodeNode })
      };
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [nodeRecord] });

      // Mock embedding generation
      mockEmbeddingService.extractSemanticContent.mockReturnValue('email validation');
      mockEmbeddingService.generateEmbeddings.mockResolvedValue([mockEmbedding]);

      // Mock successful embedding storage
      const addEmbeddingSpy = jest.spyOn(manager, 'addEmbeddingToNode').mockResolvedValue();

      const result = await manager.updateEmbeddings('test-project', ['function']);

      expect(result.updated).toBe(1);
      expect(result.failed).toBe(0);
      expect(addEmbeddingSpy).toHaveBeenCalledWith('test-node', 'test-project', mockEmbedding);

      addEmbeddingSpy.mockRestore();
    });

    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);

      const nodeRecord = {
        get: jest.fn().mockReturnValue({ properties: mockCodeNode })
      };
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [nodeRecord] });

      mockEmbeddingService.extractSemanticContent.mockReturnValue('email validation');
      mockEmbeddingService.generateEmbeddings.mockResolvedValue([null]); // Failed generation

      const result = await manager.updateEmbeddings();

      expect(result.updated).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('should handle embedding storage failures', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);

      const nodeRecord = {
        get: jest.fn().mockReturnValue({ properties: mockCodeNode })
      };
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [nodeRecord] });

      mockEmbeddingService.extractSemanticContent.mockReturnValue('email validation');
      mockEmbeddingService.generateEmbeddings.mockResolvedValue([mockEmbedding]);

      // Mock embedding storage failure
      const addEmbeddingSpy = jest.spyOn(manager, 'addEmbeddingToNode')
        .mockRejectedValue(new Error('Storage failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.updateEmbeddings();

      expect(result.updated).toBe(0);
      expect(result.failed).toBe(1);

      addEmbeddingSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle batch processing errors', async () => {
      mockEmbeddingService.isEnabled.mockReturnValue(true);

      const nodeRecord = {
        get: jest.fn().mockReturnValue({ properties: mockCodeNode })
      };
      mockNeo4jClient.runQuery.mockResolvedValue({ records: [nodeRecord] });

      mockEmbeddingService.extractSemanticContent.mockReturnValue('email validation');
      mockEmbeddingService.generateEmbeddings.mockRejectedValue(new Error('Batch failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await manager.updateEmbeddings();

      expect(result.updated).toBe(0);
      expect(result.failed).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('neo4jRecordToCodeNode', () => {
    it('should convert Neo4j record to CodeNode correctly', () => {
      const record = {
        properties: {
          id: 'test-id',
          project_id: 'test-project',
          type: 'function',
          name: 'testFunction',
          qualified_name: 'utils.testFunction',
          description: 'A test function',
          source_file: 'utils.ts',
          start_line: '10',
          end_line: '20',
          modifiers: ['public'],
          attributes: '{"return_type": "string"}'
        }
      };

      // Access private method for testing
      const result = (manager as any).neo4jRecordToCodeNode(record);

      expect(result).toEqual({
        id: 'test-id',
        project_id: 'test-project',
        type: 'function',
        name: 'testFunction',
        qualified_name: 'utils.testFunction',
        description: 'A test function',
        source_file: 'utils.ts',
        start_line: 10,
        end_line: 20,
        modifiers: ['public'],
        attributes: { return_type: 'string' }
      });
    });

    it('should handle missing optional properties', () => {
      const record = {
        properties: {
          id: 'test-id',
          project_id: 'test-project',
          type: 'function',
          name: 'testFunction',
          qualified_name: 'utils.testFunction'
        }
      };

      const result = (manager as any).neo4jRecordToCodeNode(record);

      expect(result).toEqual({
        id: 'test-id',
        project_id: 'test-project',
        type: 'function',
        name: 'testFunction',
        qualified_name: 'utils.testFunction',
        description: undefined,
        source_file: undefined,
        start_line: undefined,
        end_line: undefined,
        modifiers: undefined,
        attributes: undefined
      });
    });
  });
});