import * as path from 'path';
import { BaseLanguageParser } from './base/BaseLanguageParser.js';
import { EntityFactory } from './base/EntityFactory.js';
import { RelationshipBuilder } from './base/RelationshipBuilder.js';
import { TypeScriptContentExtractor } from './extractors/typescript/TypeScriptContentExtractor.js';
import { TypeScriptClassParser } from './entity-parsers/typescript/TypeScriptClassParser.js';
import { ParsedEntity, ParsedRelationship, ParseError } from '../types.js';

export class ModularTypeScriptParser extends BaseLanguageParser {
  private contentExtractor = new TypeScriptContentExtractor();
  private classParser = new TypeScriptClassParser();

  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx';
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
      const moduleEntity = EntityFactory.createModule(
        moduleId,
        moduleName,
        moduleName,
        filePath,
        `TypeScript module: ${moduleName}`
      );
      this.addEntity(entities, moduleEntity);

      // Parse different entity types using specialized parsers
      this.classParser.parseClasses(
        content, filePath, moduleName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      // Parse other entity types using content extractor
      this.parseInterfaces(content, filePath, moduleName, entities, relationships);
      this.parseEnums(content, filePath, moduleName, entities, relationships);
      this.parseFunctions(content, filePath, moduleName, entities, relationships);
      this.parseFields(content, filePath, moduleName, entities, relationships);

    } catch (error) {
      this.addError(errors, {
        message: `Failed to parse TypeScript file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 1,
        file_path: filePath
      });
    }

    return { entities, relationships, errors };
  }

  private parseInterfaces(
    content: string,
    filePath: string,
    moduleName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedInterface of extractionResult.interfaces) {
      const interfaceId = `${moduleName}.${parsedInterface.name}`;
      const qualifiedName = `${moduleName}.${parsedInterface.name}`;
      
      const interfaceEntity = EntityFactory.createInterface(
        interfaceId,
        parsedInterface.name,
        qualifiedName,
        filePath,
        parsedInterface.startLine,
        parsedInterface.endLine,
        parsedInterface.modifiers
      );

      this.addEntity(entities, interfaceEntity);
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(interfaceId, moduleName, filePath));

      // Handle interface inheritance
      if (parsedInterface.extends && parsedInterface.extends.length > 0) {
        for (const parentInterface of parsedInterface.extends) {
          const parentId = this.resolveType(parentInterface.trim(), moduleName, extractionResult.imports);
          this.addRelationship(relationships, RelationshipBuilder.createExtends(interfaceId, parentId, filePath));
        }
      }
    }
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

  private parseFunctions(
    content: string,
    filePath: string,
    moduleName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedFunction of extractionResult.functions) {
      const functionId = `${moduleName}.${parsedFunction.name}`;
      const qualifiedName = `${moduleName}.${parsedFunction.name}`;
      
      const functionEntity = EntityFactory.createFunction(
        functionId,
        parsedFunction.name,
        qualifiedName,
        filePath,
        parsedFunction.startLine,
        parsedFunction.endLine,
        parsedFunction.modifiers
      );

      this.addEntity(entities, functionEntity);
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(functionId, moduleName, filePath));
    }
  }

  private parseFields(
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

  private resolveType(typeName: string, moduleName: string, imports: any[]): string {
    // Remove generic type parameters
    const baseType = typeName.split('<')[0].trim();
    
    // Check if it's already a qualified name
    if (baseType.includes('.')) {
      return baseType;
    }
    
    // Check imports for the type
    for (const imp of imports) {
      if (imp.items?.includes(baseType)) {
        return imp.module ? `${imp.module}.${baseType}` : baseType;
      }
      if (imp.alias === baseType) {
        return imp.module;
      }
    }
    
    // Check for built-in types
    if (this.isBuiltInType(baseType)) {
      return `typescript.${baseType}`;
    }
    
    // Default to same module
    return `${moduleName}.${baseType}`;
  }

  private isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      'string', 'number', 'boolean', 'object', 'any', 'void', 'never', 'unknown',
      'Array', 'Object', 'Function', 'Date', 'RegExp', 'Error',
      'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet'
    ];
    
    return builtInTypes.includes(typeName);
  }

  private getModuleFromPath(filePath: string): string {
    const parsed = path.parse(filePath);
    return parsed.name;
  }
}