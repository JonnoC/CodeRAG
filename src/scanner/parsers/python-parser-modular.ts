import * as path from 'path';
import { BaseLanguageParser } from './base/BaseLanguageParser.js';
import { EntityFactory } from './base/EntityFactory.js';
import { RelationshipBuilder } from './base/RelationshipBuilder.js';
import { PythonContentExtractor } from './extractors/python/PythonContentExtractor.js';
import { PythonClassParser } from './entity-parsers/python/PythonClassParser.js';
import { PythonFunctionParser } from './entity-parsers/python/PythonFunctionParser.js';
import { ParsedEntity, ParsedRelationship, ParseError } from '../types.js';

export class ModularPythonParser extends BaseLanguageParser {
  private contentExtractor = new PythonContentExtractor();
  private classParser = new PythonClassParser();
  private functionParser = new PythonFunctionParser();

  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.py';
  }

  async parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }> {
    this.setCurrentProject(projectId);

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Extract basic content structure
      const extractionResult = this.contentExtractor.extractContent(content, filePath);
      const moduleName = extractionResult.moduleName || this.getModuleFromPath(filePath);
      const moduleId = moduleName;

      // Create module entity
      if (moduleName !== '__main__') {
        const moduleEntity = EntityFactory.createModule(
          moduleId,
          moduleName,
          moduleName,
          filePath,
          `Python module: ${moduleName}`
        );
        this.addEntity(entities, moduleEntity);
      }

      // Parse different entity types using specialized parsers
      this.classParser.parseClasses(
        content, filePath, moduleName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      this.functionParser.parseFunctions(
        content, filePath, moduleName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      // Parse enums and module-level attributes
      this.parseEnums(content, filePath, moduleName, entities, relationships);
      this.parseModuleAttributes(content, filePath, moduleName, entities, relationships);

    } catch (error) {
      this.addError(errors, {
        message: `Failed to parse Python file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 1,
        file_path: filePath
      });
    }

    return { entities, relationships, errors };
  }

  private parseEnums(
    content: string,
    filePath: string,
    moduleName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedEnum of extractionResult.enums) {
      const enumId = `${moduleName}.${parsedEnum.name}`;
      const qualifiedName = `${moduleName}.${parsedEnum.name}`;
      
      const enumEntity = EntityFactory.createEnum(
        enumId,
        parsedEnum.name,
        qualifiedName,
        filePath,
        parsedEnum.startLine,
        parsedEnum.endLine,
        parsedEnum.modifiers
      );

      this.addEntity(entities, enumEntity);
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(enumId, moduleName, filePath));
    }
  }

  private parseModuleAttributes(
    content: string,
    filePath: string,
    moduleName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedField of extractionResult.fields) {
      const fieldId = `${moduleName}.${parsedField.name}`;
      const qualifiedName = `${moduleName}.${parsedField.name}`;
      
      const fieldEntity = EntityFactory.createField(
        fieldId,
        parsedField.name,
        qualifiedName,
        filePath,
        parsedField.startLine,
        parsedField.endLine,
        parsedField.modifiers
      );

      this.addEntity(entities, fieldEntity);
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(fieldId, moduleName, filePath));
    }
  }

  private getModuleFromPath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const parsed = path.parse(normalized);
    
    if (parsed.name === '__init__') {
      // For __init__.py files, use the directory name
      return path.basename(parsed.dir);
    }
    
    return parsed.name;
  }
}