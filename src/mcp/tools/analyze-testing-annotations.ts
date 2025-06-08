import { Neo4jClient } from '../../graph/neo4j-client.js';

export interface AnalyzeTestingAnnotationsParams {
  project: string;
  framework?: string;
  include_coverage_analysis?: boolean;
}

export async function analyzeTestingAnnotations(
  neo4jClient: Neo4jClient,
  params: AnalyzeTestingAnnotationsParams
) {
  const { project, framework, include_coverage_analysis = false } = params;
  
  let query = `
    MATCH (n)
    WHERE n.project_id = $project
    AND n.attributes IS NOT NULL 
    AND n.attributes.annotations IS NOT NULL
    AND any(annotation IN n.attributes.annotations 
         WHERE annotation.category = 'testing'
  `;
  
  const queryParams: any = { project };
  
  if (framework) {
    query += ` AND annotation.framework = $framework`;
    queryParams.framework = framework;
  }
  
  query += ')';
  
  query += `
    WITH n,
         [annotation IN n.attributes.annotations 
          WHERE annotation.category = 'testing'] as test_annotations
    
    RETURN n.qualified_name as test_entity,
           n.type as entity_type,
           n.source_file as source_file,
           test_annotations,
           size(test_annotations) as annotation_count
    ORDER BY annotation_count DESC, test_entity
  `;
  
  const result = await neo4jClient.runQuery(query, queryParams);
  
  const testEntities = result.records?.map(record => ({
    test_entity: record.get('test_entity'),
    entity_type: record.get('entity_type'),
    source_file: record.get('source_file'),
    test_annotations: record.get('test_annotations'),
    annotation_count: record.get('annotation_count')
  })) || [];
  
  // Get testing framework statistics
  const frameworkStatsQuery = `
    MATCH (n)
    WHERE n.attributes IS NOT NULL 
    AND n.attributes.annotations IS NOT NULL
    AND any(annotation IN n.attributes.annotations 
         WHERE annotation.category = 'testing')
    UNWIND n.attributes.annotations as annotation
    WHERE annotation.category = 'testing'
    WITH annotation.framework as framework,
         annotation.name as annotation_name,
         count(*) as usage_count
    WHERE framework IS NOT NULL
    RETURN framework,
           collect({name: annotation_name, count: usage_count}) as annotations,
           sum(usage_count) as total_usage
    ORDER BY total_usage DESC
  `;
  
  const frameworkResult = await neo4jClient.runQuery(frameworkStatsQuery);
  const frameworkStats = frameworkResult.records?.map(record => ({
    framework: record.get('framework'),
    annotations: record.get('annotations'),
    total_usage: record.get('total_usage')
  })) || [];
  
  let coverageAnalysis = null;
  
  if (include_coverage_analysis) {
    // Analyze test coverage by looking for non-test methods without corresponding test methods
    const coverageQuery = `
      MATCH (method)
      WHERE method.project_id = $project
      AND method.type = 'method'
      AND NOT any(annotation IN coalesce(method.attributes.annotations, []) 
                  WHERE annotation.category = 'testing')
      AND NOT method.qualified_name CONTAINS 'test'
      AND NOT method.qualified_name CONTAINS 'Test'
      
      OPTIONAL MATCH (testMethod)
      WHERE testMethod.project_id = $project
      AND testMethod.type = 'method'
      AND any(annotation IN coalesce(testMethod.attributes.annotations, []) 
              WHERE annotation.category = 'testing')
      AND (testMethod.qualified_name CONTAINS method.name 
           OR testMethod.name CONTAINS method.name)
      
      WITH method, count(testMethod) as test_count
      
      RETURN 
        count(method) as total_methods,
        sum(CASE WHEN test_count > 0 THEN 1 ELSE 0 END) as methods_with_tests,
        sum(CASE WHEN test_count = 0 THEN 1 ELSE 0 END) as methods_without_tests,
        round(100.0 * sum(CASE WHEN test_count > 0 THEN 1 ELSE 0 END) / count(method)) as coverage_percentage
    `;
    
    const coverageResult = await neo4jClient.runQuery(coverageQuery, queryParams);
    const coverageRecord = coverageResult.records?.[0];
    
    if (coverageRecord) {
      coverageAnalysis = {
        total_methods: coverageRecord.get('total_methods'),
        methods_with_tests: coverageRecord.get('methods_with_tests'),
        methods_without_tests: coverageRecord.get('methods_without_tests'),
        coverage_percentage: coverageRecord.get('coverage_percentage')
      };
    }
  }
  
  return {
    test_entities: testEntities,
    framework_statistics: frameworkStats,
    coverage_analysis: coverageAnalysis,
    summary: {
      total_test_entities: testEntities.length,
      frameworks_used: frameworkStats.length,
      total_testing_annotations: frameworkStats.reduce((sum, fs) => sum + fs.total_usage, 0)
    }
  };
}

export async function findUntestableCode(neo4jClient: Neo4jClient, params: { project: string }) {
  const { project } = params;
  
  const query = `
    MATCH (n)
    WHERE n.project_id = $project
    AND n.type IN ['method', 'function']
    AND NOT any(annotation IN coalesce(n.attributes.annotations, []) 
                WHERE annotation.category = 'testing')
    
    // Look for methods that are private or have testing-unfriendly patterns
    WITH n,
         CASE 
           WHEN any(modifier IN coalesce(n.modifiers, []) WHERE modifier = 'private') THEN 'private'
           WHEN any(modifier IN coalesce(n.modifiers, []) WHERE modifier = 'static') THEN 'static'
           WHEN n.qualified_name CONTAINS '__' THEN 'private_python'
           WHEN size(coalesce(n.attributes.parameters, [])) > 10 THEN 'too_many_parameters'
           ELSE 'public'
         END as testability_concern
    
    WHERE testability_concern <> 'public'
    
    RETURN testability_concern,
           collect({
             qualified_name: n.qualified_name,
             type: n.type,
             source_file: n.source_file,
             parameter_count: size(coalesce(n.attributes.parameters, []))
           }) as methods,
           count(n) as count
    ORDER BY count DESC
  `;
  
  const result = await neo4jClient.runQuery(query, { project });
  
  return {
    testability_issues: result.records?.map(record => ({
      concern: record.get('testability_concern'),
      methods: record.get('methods'),
      count: record.get('count')
    })) || [],
    total_concerning_methods: result.records?.reduce((sum, record) => sum + record.get('count'), 0) || 0
  };
}

export const analyzeTestingAnnotationsTool = {
  name: 'analyze_testing_annotations',
  description: 'Analyze testing patterns and coverage based on test annotations/decorators',
  inputSchema: {
    type: 'object',
    properties: {
      framework: {
        type: 'string',
        description: 'Optional: Filter by testing framework (e.g., JUnit, Pytest, Jest)'
      },
      include_coverage_analysis: {
        type: 'boolean',
        description: 'Whether to include test coverage analysis',
        default: false
      }
    },
    required: []
  }
};

export const findUntestableCodeTool = {
  name: 'find_untestable_code',
  description: 'Find code patterns that may be difficult to test (private methods, static methods, etc.)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};