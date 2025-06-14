import { ParsedRelationship } from '../../types.js';

export class RelationshipBuilder {
  static createExtends(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_extends_${targetId}`,
      type: 'extends',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createImplements(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_implements_${targetId}`,
      type: 'implements',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createContains(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_contains_${targetId}`,
      type: 'contains',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createCalls(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_calls_${targetId}`,
      type: 'calls',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createReferences(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_references_${targetId}`,
      type: 'references',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createThrows(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_throws_${targetId}`,
      type: 'throws',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }

  static createBelongsTo(
    sourceId: string,
    targetId: string,
    sourceFile: string
  ): Omit<ParsedRelationship, 'project_id'> {
    return {
      id: `${sourceId}_belongs_to_${targetId}`,
      type: 'belongs_to',
      source: sourceId,
      target: targetId,
      source_file: sourceFile
    };
  }
}