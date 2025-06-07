import { Neo4jClient } from '../../graph/neo4j-client.js';

export interface FindNodesByAnnotationParams {
  annotation_name: string;
  framework?: string;
  category?: string;
  node_type?: 'class' | 'interface' | 'enum' | 'exception' | 'function' | 'method' | 'field' | 'package' | 'module';
}

export async function findNodesByAnnotation(
  neo4jClient: Neo4jClient,
  params: FindNodesByAnnotationParams
) {
  const { annotation_name, framework, category, node_type } = params;
  
  let query = `
    MATCH (n)
    WHERE n.attributes IS NOT NULL 
    AND n.attributes.annotations IS NOT NULL
    AND any(annotation IN n.attributes.annotations 
         WHERE annotation.name = $annotation_name
  `;
  
  const queryParams: any = { annotation_name };
  
  if (framework) {
    query += ` AND annotation.framework = $framework`;
    queryParams.framework = framework;
  }
  
  if (category) {
    query += ` AND annotation.category = $category`;
    queryParams.category = category;
  }
  
  query += ')';
  
  if (node_type) {
    query += ` AND n.type = $node_type`;
    queryParams.node_type = node_type;
  }
  
  query += `
    RETURN n, 
           [annotation IN n.attributes.annotations 
            WHERE annotation.name = $annotation_name][0] as matched_annotation
    ORDER BY n.qualified_name
  `;
  
  const result = await neo4jClient.runQuery(query, queryParams);
  
  return {
    nodes: result.records?.map(record => ({
      ...record.get('n').properties,
      matched_annotation: record.get('matched_annotation')
    })) || [],
    total_count: result.records?.length || 0
  };
}

export const findNodesByAnnotationTool = {
  name: 'find_nodes_by_annotation',
  description: 'Find code nodes (classes, methods, etc.) that have specific annotations/decorators',
  inputSchema: {
    type: 'object',
    properties: {
      annotation_name: {
        type: 'string',
        description: 'The annotation/decorator name to search for (e.g., @Component, @Override, staticmethod)'
      },
      framework: {
        type: 'string',
        description: 'Optional: Filter by framework (e.g., Spring, Angular, Flask, Django)'
      },
      category: {
        type: 'string',
        description: 'Optional: Filter by annotation category (e.g., web, testing, injection, persistence)'
      },
      node_type: {
        type: 'string',
        enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module'],
        description: 'Optional: Filter by node type'
      }
    },
    required: ['annotation_name']
  }
};