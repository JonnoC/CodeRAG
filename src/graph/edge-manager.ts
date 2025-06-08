import { Neo4jClient } from './neo4j-client.js';
import { CodeEdge, QueryResult } from '../types.js';

export class EdgeManager {
  constructor(private client: Neo4jClient) {}

  async addEdge(edge: CodeEdge): Promise<CodeEdge> {
    let query = `
      MATCH (source:CodeNode {id: $source, project_id: $project_id}), 
            (target:CodeNode {id: $target, project_id: $project_id})
      CREATE (source)-[r:${edge.type.toUpperCase()} {
        id: $id,
        project_id: $project_id,
        type: $type,
        attributes_json: $attributes_json
      }]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
    `;

    const params = {
      id: edge.id,
      project_id: edge.project_id,
      type: edge.type,
      source: edge.source,
      target: edge.target,
      attributes_json: JSON.stringify(edge.attributes || {})
    };

    let result = await this.client.runQuery(query, this.ensurePlainObject(params));

    // If the exact target isn't found and this is an implements relationship,
    // try to find the interface by name within the same project
    if (result.records.length === 0 && edge.type === 'implements') {
      const targetName = edge.target.split('.').pop(); // Get just the interface name
      
      const findInterfaceQuery = `
        MATCH (source:CodeNode {id: $source, project_id: $project_id}), 
              (target:Interface {project_id: $project_id})
        WHERE target.name = $targetName
        CREATE (source)-[r:${edge.type.toUpperCase()} {
          id: $id,
          project_id: $project_id,
          type: $type,
          attributes_json: $attributes_json
        }]->(target)
        RETURN r, source.id as sourceId, target.id as targetId
      `;
      
      const findParams = {
        ...params,
        targetName
      };
      
      result = await this.client.runQuery(findInterfaceQuery, this.ensurePlainObject(findParams));
    }

    if (result.records.length === 0) {
      throw new Error('Failed to create edge - source or target node not found');
    }

    return this.recordToEdge(result.records[0]);
  }

  async updateEdge(edgeId: string, projectId: string, updates: Partial<CodeEdge>): Promise<CodeEdge> {
    const setParts: string[] = [];
    const parameters: Record<string, any> = { id: edgeId };

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'source' && key !== 'target' && value !== undefined) {
        const paramKey = `update_${index}`;
        setParts.push(`r.${key} = $${paramKey}`);
        parameters[paramKey] = value;
      }
    });

    if (setParts.length === 0) {
      throw new Error('No valid updates provided');
    }

    const query = `
      MATCH (source)-[r {id: $id, project_id: $project_id}]->(target)
      SET ${setParts.join(', ')}
      RETURN r, source.id as sourceId, target.id as targetId
    `;

    parameters.project_id = projectId;

    const result = await this.client.runQuery(query, parameters);

    if (result.records.length === 0) {
      throw new Error(`Edge with id ${edgeId} not found`);
    }

    return this.recordToEdge(result.records[0]);
  }

  async getEdge(edgeId: string, projectId: string): Promise<CodeEdge | null> {
    const query = `
      MATCH (source)-[r {id: $id, project_id: $project_id}]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
    `;
    
    const result = await this.client.runQuery(query, { id: edgeId, project_id: projectId });

    if (result.records.length === 0) {
      return null;
    }

    return this.recordToEdge(result.records[0]);
  }

  async deleteEdge(edgeId: string, projectId: string): Promise<boolean> {
    const query = `
      MATCH ()-[r {id: $id, project_id: $project_id}]->()
      DELETE r
      RETURN count(r) as deleted
    `;

    const result = await this.client.runQuery(query, { id: edgeId, project_id: projectId });
    return result.records[0].get('deleted').toNumber() > 0;
  }

  async findEdgesByType(type: CodeEdge['type'], projectId: string): Promise<CodeEdge[]> {
    const query = `
      MATCH (source)-[r:${type.toUpperCase()} {project_id: $project_id}]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
    `;
    
    const result = await this.client.runQuery(query, { project_id: projectId });
    return result.records.map(record => this.recordToEdge(record));
  }

  async findEdgesBySource(sourceId: string, projectId: string): Promise<CodeEdge[]> {
    const query = `
      MATCH (source {id: $sourceId, project_id: $project_id})-[r {project_id: $project_id}]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
    `;
    
    const result = await this.client.runQuery(query, { sourceId, project_id: projectId });
    return result.records.map(record => this.recordToEdge(record));
  }

  async findEdgesByTarget(targetId: string, projectId: string): Promise<CodeEdge[]> {
    const query = `
      MATCH (source)-[r {project_id: $project_id}]->(target {id: $targetId, project_id: $project_id})
      RETURN r, source.id as sourceId, target.id as targetId
    `;
    
    const result = await this.client.runQuery(query, { targetId, project_id: projectId });
    return result.records.map(record => this.recordToEdge(record));
  }

  async findEdgesBetween(sourceId: string, targetId: string, projectId: string): Promise<CodeEdge[]> {
    const query = `
      MATCH (source {id: $sourceId, project_id: $project_id})-[r {project_id: $project_id}]->(target {id: $targetId, project_id: $project_id})
      RETURN r, source.id as sourceId, target.id as targetId
    `;
    
    const result = await this.client.runQuery(query, { sourceId, targetId, project_id: projectId });
    return result.records.map(record => this.recordToEdge(record));
  }

  async getAllEdges(projectId: string): Promise<CodeEdge[]> {
    const query = `
      MATCH (source)-[r {project_id: $project_id}]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
      LIMIT 1000
    `;
    
    const result = await this.client.runQuery(query, { project_id: projectId });
    return result.records.map(record => this.recordToEdge(record));
  }

  // Complex queries for code analysis
  async findClassesThatCallMethod(methodName: string, projectId: string): Promise<string[]> {
    const query = `
      MATCH (class:CodeNode {type: 'class', project_id: $project_id})-[:CONTAINS {project_id: $project_id}]->(method1:CodeNode {project_id: $project_id})
      -[:CALLS {project_id: $project_id}]->(method2:CodeNode {name: $methodName, project_id: $project_id})
      RETURN DISTINCT class.name as className
      ORDER BY className
    `;
    
    const result = await this.client.runQuery(query, { methodName, project_id: projectId });
    return result.records.map(record => record.get('className'));
  }

  async findClassesThatImplementInterface(interfaceName: string, projectId: string): Promise<string[]> {
    const query = `
      MATCH (class:CodeNode {type: 'class', project_id: $project_id})-[:IMPLEMENTS {project_id: $project_id}]->
      (interface:CodeNode {type: 'interface', name: $interfaceName, project_id: $project_id})
      RETURN class.name as className
      ORDER BY className
    `;
    
    const result = await this.client.runQuery(query, { interfaceName, project_id: projectId });
    return result.records.map(record => record.get('className'));
  }

  async findInheritanceHierarchy(className: string, projectId: string): Promise<string[]> {
    const query = `
      MATCH path = (child:CodeNode {name: $className, project_id: $project_id})-[:EXTENDS* {project_id: $project_id}]->
      (ancestor:CodeNode {project_id: $project_id})
      RETURN [node IN nodes(path) | node.name] as hierarchy
    `;
    
    const result = await this.client.runQuery(query, { className, project_id: projectId });
    return result.records.length > 0 ? result.records[0].get('hierarchy') : [];
  }

  // Cross-project methods (use with caution)
  async findEdgesByTypeAcrossProjects(type: CodeEdge['type']): Promise<CodeEdge[]> {
    const query = `
      MATCH (source)-[r:${type.toUpperCase()}]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
      ORDER BY r.project_id
    `;
    
    const result = await this.client.runQuery(query);
    return result.records.map(record => this.recordToEdge(record));
  }

  async getAllEdgesAcrossProjects(): Promise<CodeEdge[]> {
    const query = `
      MATCH (source)-[r]->(target)
      RETURN r, source.id as sourceId, target.id as targetId
      ORDER BY r.project_id, r.type
      LIMIT 1000
    `;
    
    const result = await this.client.runQuery(query);
    return result.records.map(record => this.recordToEdge(record));
  }

  async findCrossProjectDependencies(): Promise<CodeEdge[]> {
    const query = `
      MATCH (source:CodeNode)-[r]->(target:CodeNode)
      WHERE source.project_id <> target.project_id
      RETURN r, source.id as sourceId, target.id as targetId
      ORDER BY source.project_id, target.project_id
    `;
    
    const result = await this.client.runQuery(query);
    return result.records.map(record => this.recordToEdge(record));
  }

  private recordToEdge(record: any): CodeEdge {
    const relationship = record.get('r');
    const properties = relationship.properties;
    
    return {
      id: properties.id,
      project_id: properties.project_id,
      type: properties.type,
      source: record.get('sourceId'),
      target: record.get('targetId'),
      attributes: properties.attributes_json ? JSON.parse(properties.attributes_json) : {}
    };
  }

  private ensurePlainObject(value: any): any {
    // Force JSON serialization to ensure completely plain objects
    try {
      if (value === null || value === undefined) {
        return value;
      }
      // JSON serialization will convert Maps, Sets, and other complex objects to plain objects
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      // Fallback to original logic if JSON serialization fails
      if (value instanceof Map) {
        const obj: any = {};
        for (const [k, v] of value.entries()) {
          obj[k] = this.ensurePlainObject(v);
        }
        return obj;
      }
      if (Array.isArray(value)) {
        return value.map(item => this.ensurePlainObject(item));
      }
      if (value && typeof value === 'object' && value.constructor === Object) {
        const obj: any = {};
        for (const [k, v] of Object.entries(value)) {
          obj[k] = this.ensurePlainObject(v);
        }
        return obj;
      }
      return value;
    }
  }
}