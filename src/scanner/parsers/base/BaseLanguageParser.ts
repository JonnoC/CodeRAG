import { LanguageParser, ParsedEntity, ParsedRelationship, ParseError } from '../../types.js';

export abstract class BaseLanguageParser implements LanguageParser {
  protected currentProjectId: string = '';

  abstract canParse(filePath: string): boolean;

  abstract parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }>;

  protected addEntity(entities: ParsedEntity[], entity: Omit<ParsedEntity, 'project_id'>): void {
    entities.push({
      ...entity,
      project_id: this.currentProjectId
    });
  }

  protected addRelationship(relationships: ParsedRelationship[], relationship: Omit<ParsedRelationship, 'project_id'>): void {
    relationships.push({
      ...relationship,
      project_id: this.currentProjectId
    });
  }

  protected addError(errors: ParseError[], error: Omit<ParseError, 'project_id'>): void {
    errors.push({
      ...error,
      project_id: this.currentProjectId
    });
  }

  protected setCurrentProject(projectId: string): void {
    this.currentProjectId = projectId;
  }
}