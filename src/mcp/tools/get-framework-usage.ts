import { Neo4jClient } from '../../graph/neo4j-client.js';

export interface GetFrameworkUsageParams {
  include_parameters?: boolean;
  min_usage_count?: number;
}

export async function getFrameworkUsage(
  neo4jClient: Neo4jClient,
  params: GetFrameworkUsageParams = {}
) {
  const { include_parameters = false, min_usage_count = 1 } = params;
  
  const query = `
    MATCH (n)
    WHERE n.attributes IS NOT NULL 
    AND n.attributes.annotations IS NOT NULL
    UNWIND n.attributes.annotations as annotation
    WHERE annotation.framework IS NOT NULL
    WITH annotation.framework as framework,
         annotation.name as annotation_name,
         annotation.category as category${include_parameters ? ',\n         annotation.parameters as parameters' : ''},
         count(*) as usage_count,
         collect(DISTINCT n.qualified_name) as nodes_using
    WHERE usage_count >= $min_usage_count
    RETURN framework,
           collect({
             name: annotation_name,
             category: category,
             usage_count: usage_count${include_parameters ? ',\n             parameters: parameters' : ''},
             sample_nodes: nodes_using[0..5]
           }) as annotations,
           sum(usage_count) as total_framework_usage
    ORDER BY total_framework_usage DESC
  `;
  
  const result = await neo4jClient.runQuery(query, { min_usage_count });
  
  return {
    frameworks: result.records?.map(record => ({
      framework: record.get('framework'),
      total_usage: record.get('total_framework_usage'),
      annotations: record.get('annotations')
    })) || [],
    total_frameworks: result.records?.length || 0
  };
}

export const getFrameworkUsageTool = {
  name: 'get_framework_usage',
  description: 'Get statistics on framework usage based on annotations/decorators across the codebase',
  inputSchema: {
    type: 'object',
    properties: {
      include_parameters: {
        type: 'boolean',
        description: 'Whether to include annotation parameters in the results',
        default: false
      },
      min_usage_count: {
        type: 'number',
        description: 'Minimum usage count to include in results',
        default: 1,
        minimum: 1
      }
    },
    required: []
  }
};