import { Neo4jClient } from '../../graph/neo4j-client.js';

export interface FindDeprecatedCodeParams {
  include_dependencies?: boolean;
  node_type?: 'class' | 'interface' | 'enum' | 'exception' | 'function' | 'method' | 'field' | 'package' | 'module';
}

export async function findDeprecatedCode(
  neo4jClient: Neo4jClient,
  params: FindDeprecatedCodeParams = {}
) {
  const { include_dependencies = false, node_type } = params;
  
  let query = `
    MATCH (n)
    WHERE n.attributes IS NOT NULL 
    AND n.attributes.annotations IS NOT NULL
    AND any(annotation IN n.attributes.annotations 
         WHERE annotation.name IN ['@Deprecated', 'deprecated', '@deprecated'])
  `;
  
  const queryParams: any = {};
  
  if (node_type) {
    query += ` AND n.type = $node_type`;
    queryParams.node_type = node_type;
  }
  
  if (include_dependencies) {
    query += `
      OPTIONAL MATCH (n)<-[r:calls|references|extends|implements]-(dependentNode)
      WITH n, 
           [annotation IN n.attributes.annotations 
            WHERE annotation.name IN ['@Deprecated', 'deprecated', '@deprecated']][0] as deprecation_annotation,
           collect(DISTINCT {
             node: dependentNode.qualified_name,
             relationship: type(r),
             type: dependentNode.type
           }) as dependencies
      RETURN n,
             deprecation_annotation,
             dependencies,
             size(dependencies) as dependency_count
      ORDER BY dependency_count DESC, n.qualified_name
    `;
  } else {
    query += `
      WITH n,
           [annotation IN n.attributes.annotations 
            WHERE annotation.name IN ['@Deprecated', 'deprecated', '@deprecated']][0] as deprecation_annotation
      RETURN n,
             deprecation_annotation
      ORDER BY n.qualified_name
    `;
  }
  
  const result = await neo4jClient.runQuery(query, queryParams);
  
  return {
    deprecated_nodes: result.records?.map(record => {
      const node = record.get('n').properties;
      const deprecationAnnotation = record.get('deprecation_annotation');
      const response: any = {
        ...node,
        deprecation_info: deprecationAnnotation
      };
      
      if (include_dependencies) {
        response.dependencies = record.get('dependencies') || [];
        response.dependency_count = record.get('dependency_count') || 0;
      }
      
      return response;
    }) || [],
    total_count: result.records?.length || 0
  };
}

export async function findUsageOfDeprecatedCode(
  neo4jClient: Neo4jClient,
  params: { include_usage_details?: boolean } = {}
) {
  const { include_usage_details = false } = params;
  
  const query = `
    MATCH (deprecated)
    WHERE deprecated.attributes IS NOT NULL 
    AND deprecated.attributes.annotations IS NOT NULL
    AND any(annotation IN deprecated.attributes.annotations 
         WHERE annotation.name IN ['@Deprecated', 'deprecated', '@deprecated'])
    
    MATCH (deprecated)<-[r:calls|references|extends|implements]-(using)
    
    ${include_usage_details ? `
      WITH deprecated, using, r,
           [annotation IN deprecated.attributes.annotations 
            WHERE annotation.name IN ['@Deprecated', 'deprecated', '@deprecated']][0] as deprecation_info
      RETURN deprecated.qualified_name as deprecated_node,
             deprecated.type as deprecated_type,
             deprecation_info,
             collect({
               using_node: using.qualified_name,
               using_type: using.type,
               relationship: type(r),
               source_file: using.source_file
             }) as usage_details,
             count(using) as usage_count
      ORDER BY usage_count DESC
    ` : `
      RETURN deprecated.qualified_name as deprecated_node,
             deprecated.type as deprecated_type,
             count(using) as usage_count
      ORDER BY usage_count DESC
    `}
  `;
  
  const result = await neo4jClient.runQuery(query);
  
  return {
    deprecated_usage: result.records?.map(record => {
      const response: any = {
        deprecated_node: record.get('deprecated_node'),
        deprecated_type: record.get('deprecated_type'),
        usage_count: record.get('usage_count')
      };
      
      if (include_usage_details) {
        response.deprecation_info = record.get('deprecation_info');
        response.usage_details = record.get('usage_details');
      }
      
      return response;
    }) || [],
    total_deprecated_items: result.records?.length || 0
  };
}

export const findDeprecatedCodeTool = {
  name: 'find_deprecated_code',
  description: 'Find all code elements marked as deprecated and optionally their dependencies',
  inputSchema: {
    type: 'object',
    properties: {
      include_dependencies: {
        type: 'boolean',
        description: 'Whether to include information about what depends on deprecated code',
        default: false
      },
      node_type: {
        type: 'string',
        enum: ['class', 'interface', 'enum', 'exception', 'function', 'method', 'field', 'package', 'module'],
        description: 'Optional: Filter by node type'
      }
    },
    required: []
  }
};

export const findUsageOfDeprecatedCodeTool = {
  name: 'find_usage_of_deprecated_code',
  description: 'Find code that uses deprecated elements and assess migration impact',
  inputSchema: {
    type: 'object',
    properties: {
      include_usage_details: {
        type: 'boolean',
        description: 'Whether to include detailed information about each usage',
        default: false
      }
    },
    required: []
  }
};