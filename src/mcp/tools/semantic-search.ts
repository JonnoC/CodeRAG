import { SemanticSearchManager } from '../../services/semantic-search-manager.js';
import { SemanticSearchParams, SemanticSearchResult } from '../../types.js';

export interface SemanticSearchToolParams {
  query: string;
  project_id?: string;
  node_types?: string[];
  limit?: number;
  similarity_threshold?: number;
  include_graph_context?: boolean;
  max_hops?: number;
}

export interface UpdateEmbeddingsParams {
  project_id?: string;
  node_types?: string[];
}

export interface GetSimilarCodeParams {
  node_id: string;
  project_id: string;
  limit?: number;
}

export async function semanticSearch(
  semanticSearchManager: SemanticSearchManager,
  params: SemanticSearchToolParams
): Promise<{ results: SemanticSearchResult[]; total_found: number }> {
  try {
    const searchParams: SemanticSearchParams = {
      query: params.query,
      project_id: params.project_id,
      node_types: params.node_types as any[],
      limit: params.limit,
      similarity_threshold: params.similarity_threshold
    };

    let results: SemanticSearchResult[];

    if (params.include_graph_context) {
      results = await semanticSearchManager.hybridSearch(searchParams, {
        includeRelationships: true,
        maxHops: params.max_hops || 2
      });
    } else {
      results = await semanticSearchManager.semanticSearch(searchParams);
    }

    return {
      results,
      total_found: results.length
    };
  } catch (error) {
    throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateEmbeddings(
  semanticSearchManager: SemanticSearchManager,
  params: UpdateEmbeddingsParams
): Promise<{ message: string; updated: number; failed: number }> {
  try {
    const result = await semanticSearchManager.updateEmbeddings(
      params.project_id,
      params.node_types
    );

    return {
      message: `Embedding update completed. Updated: ${result.updated}, Failed: ${result.failed}`,
      updated: result.updated,
      failed: result.failed
    };
  } catch (error) {
    throw new Error(`Failed to update embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSimilarCode(
  semanticSearchManager: SemanticSearchManager,
  params: GetSimilarCodeParams
): Promise<{ results: SemanticSearchResult[]; total_found: number }> {
  try {
    const results = await semanticSearchManager.getSimilarNodes(
      params.node_id,
      params.project_id,
      params.limit || 5
    );

    return {
      results,
      total_found: results.length
    };
  } catch (error) {
    throw new Error(`Failed to get similar code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function initializeSemanticSearch(
  semanticSearchManager: SemanticSearchManager
): Promise<{ message: string; success: boolean }> {
  try {
    await semanticSearchManager.initializeVectorIndexes();
    
    return {
      message: 'Semantic search initialized successfully. Vector indexes created.',
      success: true
    };
  } catch (error) {
    return {
      message: `Failed to initialize semantic search: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    };
  }
}