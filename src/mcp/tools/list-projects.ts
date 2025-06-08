import { Neo4jClient } from '../../graph/neo4j-client.js';

export interface ListProjectsParams {
  include_stats?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'entity_count';
  limit?: number;
}

export async function listProjects(
  neo4jClient: Neo4jClient,
  params: ListProjectsParams = {}
) {
  const { include_stats = false, sort_by = 'name', limit = 100 } = params;
  
  try {
    // Get basic project information
    const projects = await neo4jClient.listProjects();
    
    if (!include_stats) {
      // Simple list without statistics
      const sortedProjects = sortProjects(projects, sort_by);
      return {
        projects: sortedProjects.slice(0, limit),
        total_count: projects.length
      };
    }

    // Enhanced list with statistics
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await getProjectStats(neo4jClient, project.project_id);
        return {
          ...project,
          stats
        };
      })
    );

    const sortedProjects = sortProjectsWithStats(projectsWithStats, sort_by);
    
    return {
      projects: sortedProjects.slice(0, limit),
      total_count: projects.length,
      summary: {
        total_projects: projects.length,
        total_entities: projectsWithStats.reduce((sum, p) => sum + p.stats.entity_count, 0),
        total_relationships: projectsWithStats.reduce((sum, p) => sum + p.stats.relationship_count, 0)
      }
    };
  } catch (error) {
    throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function getProjectStats(neo4jClient: Neo4jClient, projectId: string) {
  const statsQuery = `
    MATCH (n:CodeNode {project_id: $project_id})
    OPTIONAL MATCH (n)-[r {project_id: $project_id}]-()
    RETURN 
      count(DISTINCT n) as entity_count,
      count(DISTINCT r) as relationship_count,
      collect(DISTINCT n.type) as entity_types,
      collect(DISTINCT type(r)) as relationship_types
  `;
  
  const result = await neo4jClient.runQuery(statsQuery, { project_id: projectId });
  
  if (result.records.length === 0) {
    return {
      entity_count: 0,
      relationship_count: 0,
      entity_types: [],
      relationship_types: []
    };
  }
  
  const record = result.records[0];
  return {
    entity_count: record.get('entity_count').toNumber(),
    relationship_count: record.get('relationship_count').toNumber(),
    entity_types: record.get('entity_types').filter((type: string) => type !== null),
    relationship_types: record.get('relationship_types').filter((type: string) => type !== null)
  };
}

function sortProjects(projects: any[], sortBy: string) {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || a.project_id).localeCompare(b.name || b.project_id);
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'updated_at':
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      default:
        return (a.name || a.project_id).localeCompare(b.name || b.project_id);
    }
  });
}

function sortProjectsWithStats(projects: any[], sortBy: string) {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || a.project_id).localeCompare(b.name || b.project_id);
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'updated_at':
        return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      case 'entity_count':
        return b.stats.entity_count - a.stats.entity_count;
      default:
        return (a.name || a.project_id).localeCompare(b.name || b.project_id);
    }
  });
}

export const listProjectsTool = {
  name: 'list_projects',
  description: 'List all projects in the CodeRAG graph database with optional statistics',
  inputSchema: {
    type: 'object',
    properties: {
      include_stats: {
        type: 'boolean',
        description: 'Include detailed statistics for each project (entity counts, types, etc.)',
        default: false
      },
      sort_by: {
        type: 'string',
        enum: ['name', 'created_at', 'updated_at', 'entity_count'],
        description: 'Sort projects by the specified field',
        default: 'name'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of projects to return',
        default: 100,
        minimum: 1,
        maximum: 1000
      }
    },
    required: []
  }
};