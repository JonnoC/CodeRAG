import { Neo4jClient } from '../graph/neo4j-client.js';
import { EmbeddingService } from './embedding-service.js';
import { CodeNode, SemanticSearchParams, SemanticSearchResult, SemanticEmbedding } from '../types.js';
import { getSemanticSearchConfig } from '../config.js';

export class SemanticSearchManager {
  private neo4jClient: Neo4jClient;
  private embeddingService: EmbeddingService;
  private config: ReturnType<typeof getSemanticSearchConfig>;

  constructor(neo4jClient: Neo4jClient, embeddingService?: EmbeddingService) {
    this.neo4jClient = neo4jClient;
    this.embeddingService = embeddingService || new EmbeddingService();
    this.config = getSemanticSearchConfig();
  }

  async initializeVectorIndexes(): Promise<void> {
    if (!this.embeddingService.isEnabled()) {
      console.log('Semantic search disabled, skipping vector index initialization');
      return;
    }

    try {
      // Create vector index for semantic embeddings
      const indexQuery = `
        CREATE VECTOR INDEX semantic_embeddings IF NOT EXISTS
        FOR (n:CodeEntity)
        ON (n.semantic_embedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: $dimensions,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `;

      await this.neo4jClient.runQuery(indexQuery, { 
        dimensions: this.config.dimensions 
      });

      console.log('Vector indexes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize vector indexes:', error);
      throw error;
    }
  }

  async addEmbeddingToNode(nodeId: string, projectId: string, embedding: SemanticEmbedding): Promise<void> {
    const query = `
      MATCH (n:CodeEntity {id: $nodeId, project_id: $projectId})
      SET n.semantic_embedding = $vector,
          n.embedding_model = $model,
          n.embedding_version = $version,
          n.embedding_created_at = $createdAt
      RETURN n
    `;

    const result = await this.neo4jClient.runQuery(query, {
      nodeId,
      projectId,
      vector: embedding.vector,
      model: embedding.model,
      version: embedding.version,
      createdAt: embedding.created_at.toISOString()
    });

    if (result.records.length === 0) {
      throw new Error(`Node not found: ${nodeId} in project ${projectId}`);
    }
  }

  async semanticSearch(params: SemanticSearchParams): Promise<SemanticSearchResult[]> {
    if (!this.embeddingService.isEnabled()) {
      throw new Error('Semantic search is disabled');
    }

    // Generate embedding for the query
    const queryEmbedding = await this.embeddingService.generateEmbedding(params.query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate embedding for query');
    }

    // Build the search query
    const limit = params.limit || 10;
    const threshold = params.similarity_threshold || this.config.similarity_threshold;
    
    let whereClause = 'n.semantic_embedding IS NOT NULL';
    const queryParams: Record<string, any> = {
      queryVector: queryEmbedding.vector,
      limit: limit,
      threshold: threshold
    };

    // Add project filter
    if (params.project_id) {
      whereClause += ' AND n.project_id = $projectId';
      queryParams.projectId = params.project_id;
    }

    // Add node type filter
    if (params.node_types && params.node_types.length > 0) {
      whereClause += ' AND n.type IN $nodeTypes';
      queryParams.nodeTypes = params.node_types;
    }

    const searchQuery = `
      MATCH (n:CodeEntity)
      WHERE ${whereClause}
      WITH n, vector.similarity.cosine(n.semantic_embedding, $queryVector) AS similarity
      WHERE similarity >= $threshold
      RETURN n, similarity
      ORDER BY similarity DESC
      LIMIT $limit
    `;

    try {
      const result = await this.neo4jClient.runQuery(searchQuery, queryParams);
      
      return result.records.map(record => {
        const node = this.neo4jRecordToCodeNode(record.get('n'));
        const similarity = record.get('similarity');
        
        return {
          node,
          similarity_score: similarity,
          matched_content: this.embeddingService.extractSemanticContent(node)
        };
      });
    } catch (error) {
      console.error('Semantic search query failed:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async hybridSearch(params: SemanticSearchParams, graphContext?: {
    includeRelationships?: boolean;
    maxHops?: number;
  }): Promise<SemanticSearchResult[]> {
    // First perform semantic search
    const semanticResults = await this.semanticSearch(params);
    
    if (!graphContext?.includeRelationships) {
      return semanticResults;
    }

    // Enhance results with graph context
    const enhancedResults: SemanticSearchResult[] = [];
    const maxHops = graphContext.maxHops || 2;

    for (const result of semanticResults) {
      // Get related nodes within maxHops
      const contextQuery = `
        MATCH (n:CodeEntity {id: $nodeId, project_id: $projectId})
        MATCH (n)-[*1..${maxHops}]-(related:CodeEntity)
        WHERE related.project_id = $projectId
        RETURN DISTINCT related
        LIMIT 5
      `;

      try {
        const contextResult = await this.neo4jClient.runQuery(contextQuery, {
          nodeId: result.node.id,
          projectId: result.node.project_id
        });

        const relatedNodes = contextResult.records.map(record => 
          this.neo4jRecordToCodeNode(record.get('related'))
        );

        // Enhance the matched content with related context
        const contextualContent = [
          result.matched_content,
          ...relatedNodes.map(node => `Related: ${node.name} (${node.type})`)
        ].join(' | ');

        enhancedResults.push({
          ...result,
          matched_content: contextualContent
        });
      } catch (error) {
        console.warn(`Failed to get graph context for node ${result.node.id}:`, error);
        enhancedResults.push(result);
      }
    }

    return enhancedResults;
  }

  async getSimilarNodes(nodeId: string, projectId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    // Get the embedding of the target node
    const nodeQuery = `
      MATCH (n:CodeEntity {id: $nodeId, project_id: $projectId})
      WHERE n.semantic_embedding IS NOT NULL
      RETURN n.semantic_embedding AS embedding, n
    `;

    const nodeResult = await this.neo4jClient.runQuery(nodeQuery, { nodeId, projectId });
    
    if (nodeResult.records.length === 0) {
      throw new Error(`Node not found or has no embedding: ${nodeId}`);
    }

    const targetEmbedding = nodeResult.records[0].get('embedding');
    const targetNode = this.neo4jRecordToCodeNode(nodeResult.records[0].get('n'));

    // Find similar nodes
    const similarQuery = `
      MATCH (n:CodeEntity)
      WHERE n.semantic_embedding IS NOT NULL 
        AND n.project_id = $projectId 
        AND n.id <> $nodeId
      WITH n, vector.similarity.cosine(n.semantic_embedding, $targetEmbedding) AS similarity
      WHERE similarity >= $threshold
      RETURN n, similarity
      ORDER BY similarity DESC
      LIMIT $limit
    `;

    const result = await this.neo4jClient.runQuery(similarQuery, {
      projectId,
      nodeId,
      targetEmbedding,
      threshold: this.config.similarity_threshold,
      limit
    });

    return result.records.map(record => {
      const node = this.neo4jRecordToCodeNode(record.get('n'));
      const similarity = record.get('similarity');
      
      return {
        node,
        similarity_score: similarity,
        matched_content: this.embeddingService.extractSemanticContent(node)
      };
    });
  }

  async updateEmbeddings(projectId?: string, nodeTypes?: string[]): Promise<{ updated: number; failed: number }> {
    if (!this.embeddingService.isEnabled()) {
      throw new Error('Semantic search is disabled');
    }

    let whereClause = '1=1';
    const queryParams: Record<string, any> = {};

    if (projectId) {
      whereClause += ' AND n.project_id = $projectId';
      queryParams.projectId = projectId;
    }

    if (nodeTypes && nodeTypes.length > 0) {
      whereClause += ' AND n.type IN $nodeTypes';
      queryParams.nodeTypes = nodeTypes;
    }

    // Get nodes that need embedding updates
    const query = `
      MATCH (n:CodeEntity)
      WHERE ${whereClause}
      RETURN n
      ORDER BY n.id
    `;

    const result = await this.neo4jClient.runQuery(query, queryParams);
    const nodes = result.records.map(record => this.neo4jRecordToCodeNode(record.get('n')));

    let updated = 0;
    let failed = 0;

    // Process nodes in batches
    const batchSize = this.config.batch_size;
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);
      
      try {
        // Extract semantic content for the batch
        const texts = batch.map(node => this.embeddingService.extractSemanticContent(node));
        
        // Generate embeddings
        const embeddings = await this.embeddingService.generateEmbeddings(texts);
        
        // Update nodes with embeddings
        for (let j = 0; j < batch.length; j++) {
          const node = batch[j];
          const embedding = embeddings[j];
          
          if (embedding) {
            try {
              await this.addEmbeddingToNode(node.id, node.project_id, embedding);
              updated++;
            } catch (error) {
              console.error(`Failed to update embedding for node ${node.id}:`, error);
              failed++;
            }
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.error(`Failed to process batch starting at index ${i}:`, error);
        failed += batch.length;
      }
    }

    return { updated, failed };
  }

  private neo4jRecordToCodeNode(record: any): CodeNode {
    const properties = record.properties;
    
    return {
      id: properties.id,
      project_id: properties.project_id,
      type: properties.type,
      name: properties.name,
      qualified_name: properties.qualified_name,
      description: properties.description,
      source_file: properties.source_file,
      start_line: properties.start_line ? parseInt(properties.start_line) : undefined,
      end_line: properties.end_line ? parseInt(properties.end_line) : undefined,
      modifiers: properties.modifiers,
      attributes: properties.attributes ? JSON.parse(properties.attributes) : undefined
    };
  }
}