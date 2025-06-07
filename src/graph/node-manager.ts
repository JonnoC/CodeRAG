import { Neo4jClient } from './neo4j-client.js';
import { CodeNode, QueryResult } from '../types.js';

export class NodeManager {
  constructor(private client: Neo4jClient) {}

  async addNode(node: CodeNode): Promise<CodeNode> {
    // Get the proper node label based on type
    const nodeLabel = this.getNodeLabel(node.type);
    
    const query = `
      CREATE (n:${nodeLabel}:CodeNode {
        id: $id,
        type: $type,
        name: $name,
        qualified_name: $qualified_name,
        description: $description,
        source_file: $source_file,
        start_line: $start_line,
        end_line: $end_line,
        modifiers: $modifiers,
        attributes_json: $attributes_json
      })
      RETURN n
    `;

    const params = {
      id: node.id,
      type: node.type,
      name: node.name,
      qualified_name: node.qualified_name,
      description: node.description || null,
      source_file: node.source_file || null,
      start_line: node.start_line || null,
      end_line: node.end_line || null,
      modifiers: this.ensurePlainObject(node.modifiers || []),
      attributes_json: JSON.stringify(node.attributes || {})
    };

    const result = await this.client.runQuery(query, this.ensurePlainObject(params));

    if (result.records.length === 0) {
      throw new Error('Failed to create node');
    }

    return this.recordToNode(result.records[0].get('n'));
  }

  async updateNode(nodeId: string, updates: Partial<CodeNode>): Promise<CodeNode> {
    const setParts: string[] = [];
    const parameters: Record<string, any> = { id: nodeId };

    Object.entries(updates).forEach(([key, value], index) => {
      if (key !== 'id' && value !== undefined) {
        const paramKey = `update_${index}`;
        setParts.push(`n.${key} = $${paramKey}`);
        parameters[paramKey] = value;
      }
    });

    if (setParts.length === 0) {
      throw new Error('No valid updates provided');
    }

    const query = `
      MATCH (n:CodeNode {id: $id})
      SET ${setParts.join(', ')}
      RETURN n
    `;

    const result = await this.client.runQuery(query, parameters);

    if (result.records.length === 0) {
      throw new Error(`Node with id ${nodeId} not found`);
    }

    return this.recordToNode(result.records[0].get('n'));
  }

  async getNode(nodeId: string): Promise<CodeNode | null> {
    const query = 'MATCH (n:CodeNode {id: $id}) RETURN n';
    const result = await this.client.runQuery(query, { id: nodeId });

    if (result.records.length === 0) {
      return null;
    }

    return this.recordToNode(result.records[0].get('n'));
  }

  async deleteNode(nodeId: string): Promise<boolean> {
    const query = `
      MATCH (n:CodeNode {id: $id})
      DETACH DELETE n
      RETURN count(n) as deleted
    `;

    const result = await this.client.runQuery(query, { id: nodeId });
    return result.records[0].get('deleted').toNumber() > 0;
  }

  async findNodesByType(type: CodeNode['type']): Promise<CodeNode[]> {
    const query = 'MATCH (n:CodeNode {type: $type}) RETURN n ORDER BY n.name';
    const result = await this.client.runQuery(query, { type });

    return result.records.map(record => this.recordToNode(record.get('n')));
  }

  async findNodesByName(name: string): Promise<CodeNode[]> {
    const query = 'MATCH (n:CodeNode) WHERE n.name CONTAINS $name RETURN n ORDER BY n.name';
    const result = await this.client.runQuery(query, { name });

    return result.records.map(record => this.recordToNode(record.get('n')));
  }

  async findNodesByQualifiedName(qualifiedName: string): Promise<CodeNode[]> {
    const query = 'MATCH (n:CodeNode {qualified_name: $qualified_name}) RETURN n';
    const result = await this.client.runQuery(query, { qualified_name: qualifiedName });

    return result.records.map(record => this.recordToNode(record.get('n')));
  }

  async searchNodes(searchTerm: string): Promise<CodeNode[]> {
    const query = `
      MATCH (n:CodeNode)
      WHERE n.name CONTAINS $searchTerm 
         OR n.qualified_name CONTAINS $searchTerm 
         OR n.description CONTAINS $searchTerm
      RETURN n
      ORDER BY n.name
      LIMIT 100
    `;

    const result = await this.client.runQuery(query, { searchTerm });
    return result.records.map(record => this.recordToNode(record.get('n')));
  }

  async getAllNodes(): Promise<CodeNode[]> {
    const query = 'MATCH (n:CodeNode) RETURN n ORDER BY n.type, n.name LIMIT 1000';
    const result = await this.client.runQuery(query);

    return result.records.map(record => this.recordToNode(record.get('n')));
  }

  private recordToNode(record: any): CodeNode {
    const properties = record.properties;
    return {
      id: properties.id,
      type: properties.type,
      name: properties.name,
      qualified_name: properties.qualified_name,
      description: properties.description,
      source_file: properties.source_file,
      start_line: typeof properties.start_line?.toNumber === 'function' ? properties.start_line.toNumber() : properties.start_line,
      end_line: typeof properties.end_line?.toNumber === 'function' ? properties.end_line.toNumber() : properties.end_line,
      modifiers: properties.modifiers || [],
      attributes: properties.attributes_json ? JSON.parse(properties.attributes_json) : {}
    };
  }

  private getNodeLabel(type: CodeNode['type']): string {
    // Capitalize the first letter and handle special cases
    switch (type) {
      case 'class': return 'Class';
      case 'interface': return 'Interface';
      case 'enum': return 'Enum';
      case 'method': return 'Method';
      case 'function': return 'Function';
      case 'field': return 'Field';
      case 'module': return 'Module';
      case 'package': return 'Package';
      default: return 'CodeNode';
    }
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