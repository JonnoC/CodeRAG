import { SemanticSearchManager } from '../../../src/services/semantic-search-manager.js';
import { 
  semanticSearch, 
  updateEmbeddings, 
  getSimilarCode, 
  initializeSemanticSearch,
  SemanticSearchToolParams,
  UpdateEmbeddingsParams,
  GetSimilarCodeParams
} from '../../../src/mcp/tools/semantic-search.js';
import { SemanticSearchResult } from '../../../src/types.js';

// Mock the SemanticSearchManager
jest.mock('../../../src/services/semantic-search-manager.js');

describe('Semantic Search MCP Tools', () => {
  let mockSemanticSearchManager: jest.Mocked<SemanticSearchManager>;

  const mockSearchResult: SemanticSearchResult = {
    node: {
      id: 'test-node',
      project_id: 'test-project',
      type: 'function',
      name: 'validateEmail',
      qualified_name: 'utils.validateEmail',
      description: 'Validates email addresses'
    },
    similarity_score: 0.85,
    matched_content: 'email validation function'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSemanticSearchManager = {
      semanticSearch: jest.fn(),
      hybridSearch: jest.fn(),
      getSimilarNodes: jest.fn(),
      updateEmbeddings: jest.fn(),
      initializeVectorIndexes: jest.fn(),
      addEmbeddingToNode: jest.fn()
    } as any;
  });

  describe('semanticSearch', () => {
    const basicParams: SemanticSearchToolParams = {
      query: 'email validation functions'
    };

    it('should perform basic semantic search', async () => {
      const expectedResults = [mockSearchResult];
      mockSemanticSearchManager.semanticSearch.mockResolvedValue(expectedResults);

      const result = await semanticSearch(mockSemanticSearchManager, basicParams);

      expect(result).toEqual({
        results: expectedResults,
        total_found: 1
      });

      expect(mockSemanticSearchManager.semanticSearch).toHaveBeenCalledWith({
        query: 'email validation functions',
        project_id: undefined,
        node_types: undefined,
        limit: undefined,
        similarity_threshold: undefined
      });
    });

    it('should perform semantic search with all parameters', async () => {
      const fullParams: SemanticSearchToolParams = {
        query: 'user authentication functions',
        project_id: 'my-project',
        node_types: ['function', 'method'],
        limit: 10,
        similarity_threshold: 0.8,
        include_graph_context: false,
        max_hops: 2
      };

      const expectedResults = [mockSearchResult];
      mockSemanticSearchManager.semanticSearch.mockResolvedValue(expectedResults);

      const result = await semanticSearch(mockSemanticSearchManager, fullParams);

      expect(result).toEqual({
        results: expectedResults,
        total_found: 1
      });

      expect(mockSemanticSearchManager.semanticSearch).toHaveBeenCalledWith({
        query: 'user authentication functions',
        project_id: 'my-project',
        node_types: ['function', 'method'],
        limit: 10,
        similarity_threshold: 0.8
      });
    });

    it('should perform hybrid search when graph context enabled', async () => {
      const hybridParams: SemanticSearchToolParams = {
        query: 'database operations',
        include_graph_context: true,
        max_hops: 3
      };

      const expectedResults = [mockSearchResult];
      mockSemanticSearchManager.hybridSearch.mockResolvedValue(expectedResults);

      const result = await semanticSearch(mockSemanticSearchManager, hybridParams);

      expect(result).toEqual({
        results: expectedResults,
        total_found: 1
      });

      expect(mockSemanticSearchManager.hybridSearch).toHaveBeenCalledWith(
        {
          query: 'database operations',
          project_id: undefined,
          node_types: undefined,
          limit: undefined,
          similarity_threshold: undefined
        },
        {
          includeRelationships: true,
          maxHops: 3
        }
      );
    });

    it('should handle search errors', async () => {
      const error = new Error('Search failed');
      mockSemanticSearchManager.semanticSearch.mockRejectedValue(error);

      await expect(
        semanticSearch(mockSemanticSearchManager, basicParams)
      ).rejects.toThrow('Semantic search failed: Search failed');
    });

    it('should handle hybrid search errors', async () => {
      const hybridParams: SemanticSearchToolParams = {
        query: 'test query',
        include_graph_context: true
      };

      const error = new Error('Hybrid search failed');
      mockSemanticSearchManager.hybridSearch.mockRejectedValue(error);

      await expect(
        semanticSearch(mockSemanticSearchManager, hybridParams)
      ).rejects.toThrow('Semantic search failed: Hybrid search failed');
    });

    it('should return empty results gracefully', async () => {
      mockSemanticSearchManager.semanticSearch.mockResolvedValue([]);

      const result = await semanticSearch(mockSemanticSearchManager, basicParams);

      expect(result).toEqual({
        results: [],
        total_found: 0
      });
    });
  });

  describe('updateEmbeddings', () => {
    it('should update embeddings with no parameters', async () => {
      const params: UpdateEmbeddingsParams = {};
      const mockResult = { updated: 15, failed: 2 };

      mockSemanticSearchManager.updateEmbeddings.mockResolvedValue(mockResult);

      const result = await updateEmbeddings(mockSemanticSearchManager, params);

      expect(result).toEqual({
        message: 'Embedding update completed. Updated: 15, Failed: 2',
        updated: 15,
        failed: 2
      });

      expect(mockSemanticSearchManager.updateEmbeddings).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });

    it('should update embeddings with project filter', async () => {
      const params: UpdateEmbeddingsParams = {
        project_id: 'my-project'
      };
      const mockResult = { updated: 8, failed: 0 };

      mockSemanticSearchManager.updateEmbeddings.mockResolvedValue(mockResult);

      const result = await updateEmbeddings(mockSemanticSearchManager, params);

      expect(result).toEqual({
        message: 'Embedding update completed. Updated: 8, Failed: 0',
        updated: 8,
        failed: 0
      });

      expect(mockSemanticSearchManager.updateEmbeddings).toHaveBeenCalledWith(
        'my-project',
        undefined
      );
    });

    it('should update embeddings with node type filter', async () => {
      const params: UpdateEmbeddingsParams = {
        project_id: 'my-project',
        node_types: ['function', 'method']
      };
      const mockResult = { updated: 5, failed: 1 };

      mockSemanticSearchManager.updateEmbeddings.mockResolvedValue(mockResult);

      const result = await updateEmbeddings(mockSemanticSearchManager, params);

      expect(result).toEqual({
        message: 'Embedding update completed. Updated: 5, Failed: 1',
        updated: 5,
        failed: 1
      });

      expect(mockSemanticSearchManager.updateEmbeddings).toHaveBeenCalledWith(
        'my-project',
        ['function', 'method']
      );
    });

    it('should handle update errors', async () => {
      const params: UpdateEmbeddingsParams = {};
      const error = new Error('Update failed');

      mockSemanticSearchManager.updateEmbeddings.mockRejectedValue(error);

      await expect(
        updateEmbeddings(mockSemanticSearchManager, params)
      ).rejects.toThrow('Failed to update embeddings: Update failed');
    });

    it('should handle unknown errors', async () => {
      const params: UpdateEmbeddingsParams = {};
      mockSemanticSearchManager.updateEmbeddings.mockRejectedValue('String error');

      await expect(
        updateEmbeddings(mockSemanticSearchManager, params)
      ).rejects.toThrow('Failed to update embeddings: Unknown error');
    });
  });

  describe('getSimilarCode', () => {
    const params: GetSimilarCodeParams = {
      node_id: 'test-node',
      project_id: 'test-project'
    };

    it('should get similar code with default limit', async () => {
      const expectedResults = [mockSearchResult];
      mockSemanticSearchManager.getSimilarNodes.mockResolvedValue(expectedResults);

      const result = await getSimilarCode(mockSemanticSearchManager, params);

      expect(result).toEqual({
        results: expectedResults,
        total_found: 1
      });

      expect(mockSemanticSearchManager.getSimilarNodes).toHaveBeenCalledWith(
        'test-node',
        'test-project',
        5
      );
    });

    it('should get similar code with custom limit', async () => {
      const paramsWithLimit: GetSimilarCodeParams = {
        ...params,
        limit: 10
      };

      const expectedResults = [mockSearchResult];
      mockSemanticSearchManager.getSimilarNodes.mockResolvedValue(expectedResults);

      const result = await getSimilarCode(mockSemanticSearchManager, paramsWithLimit);

      expect(result).toEqual({
        results: expectedResults,
        total_found: 1
      });

      expect(mockSemanticSearchManager.getSimilarNodes).toHaveBeenCalledWith(
        'test-node',
        'test-project',
        10
      );
    });

    it('should handle get similar code errors', async () => {
      const error = new Error('Node not found');
      mockSemanticSearchManager.getSimilarNodes.mockRejectedValue(error);

      await expect(
        getSimilarCode(mockSemanticSearchManager, params)
      ).rejects.toThrow('Failed to get similar code: Node not found');
    });

    it('should return empty results when no similar code found', async () => {
      mockSemanticSearchManager.getSimilarNodes.mockResolvedValue([]);

      const result = await getSimilarCode(mockSemanticSearchManager, params);

      expect(result).toEqual({
        results: [],
        total_found: 0
      });
    });

    it('should handle unknown errors in getSimilarCode', async () => {
      mockSemanticSearchManager.getSimilarNodes.mockRejectedValue(42);

      await expect(
        getSimilarCode(mockSemanticSearchManager, params)
      ).rejects.toThrow('Failed to get similar code: Unknown error');
    });
  });

  describe('initializeSemanticSearch', () => {
    it('should initialize semantic search successfully', async () => {
      mockSemanticSearchManager.initializeVectorIndexes.mockResolvedValue();

      const result = await initializeSemanticSearch(mockSemanticSearchManager);

      expect(result).toEqual({
        message: 'Semantic search initialized successfully. Vector indexes created.',
        success: true
      });

      expect(mockSemanticSearchManager.initializeVectorIndexes).toHaveBeenCalledWith();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Initialization failed');
      mockSemanticSearchManager.initializeVectorIndexes.mockRejectedValue(error);

      const result = await initializeSemanticSearch(mockSemanticSearchManager);

      expect(result).toEqual({
        message: 'Failed to initialize semantic search: Initialization failed',
        success: false
      });
    });

    it('should handle unknown initialization errors', async () => {
      mockSemanticSearchManager.initializeVectorIndexes.mockRejectedValue('Unknown error');

      const result = await initializeSemanticSearch(mockSemanticSearchManager);

      expect(result).toEqual({
        message: 'Failed to initialize semantic search: Unknown error',
        success: false
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined parameters gracefully', async () => {
      // semanticSearch with minimal params
      mockSemanticSearchManager.semanticSearch.mockResolvedValue([]);
      
      const result = await semanticSearch(mockSemanticSearchManager, {
        query: 'test',
        project_id: undefined,
        node_types: undefined
      });

      expect(result.results).toEqual([]);
    });

    it('should handle empty string queries', async () => {
      mockSemanticSearchManager.semanticSearch.mockResolvedValue([]);

      const result = await semanticSearch(mockSemanticSearchManager, {
        query: ''
      });

      expect(result.results).toEqual([]);
      expect(mockSemanticSearchManager.semanticSearch).toHaveBeenCalledWith({
        query: '',
        project_id: undefined,
        node_types: undefined,
        limit: undefined,
        similarity_threshold: undefined
      });
    });

    it('should handle very large result sets', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSearchResult,
        node: { ...mockSearchResult.node, id: `node-${i}` }
      }));

      mockSemanticSearchManager.semanticSearch.mockResolvedValue(largeResultSet);

      const result = await semanticSearch(mockSemanticSearchManager, {
        query: 'test',
        limit: 1000
      });

      expect(result.total_found).toBe(1000);
      expect(result.results).toHaveLength(1000);
    });

    it('should handle special characters in queries', async () => {
      const specialQuery = 'functions with @annotations & "special chars" (parentheses)';
      mockSemanticSearchManager.semanticSearch.mockResolvedValue([]);

      await semanticSearch(mockSemanticSearchManager, {
        query: specialQuery
      });

      expect(mockSemanticSearchManager.semanticSearch).toHaveBeenCalledWith({
        query: specialQuery,
        project_id: undefined,
        node_types: undefined,
        limit: undefined,
        similarity_threshold: undefined
      });
    });

    it('should preserve all similarity scores in results', async () => {
      const resultsWithVariousScores = [
        { ...mockSearchResult, similarity_score: 0.95 },
        { ...mockSearchResult, similarity_score: 0.75 },
        { ...mockSearchResult, similarity_score: 0.65 }
      ];

      mockSemanticSearchManager.semanticSearch.mockResolvedValue(resultsWithVariousScores);

      const result = await semanticSearch(mockSemanticSearchManager, {
        query: 'test'
      });

      expect(result.results[0].similarity_score).toBe(0.95);
      expect(result.results[1].similarity_score).toBe(0.75);
      expect(result.results[2].similarity_score).toBe(0.65);
    });
  });
});