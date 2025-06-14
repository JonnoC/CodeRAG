import * as path from 'path';
import { BaseLanguageParser } from './base/BaseLanguageParser.js';
import { EntityFactory } from './base/EntityFactory.js';
import { RelationshipBuilder } from './base/RelationshipBuilder.js';
import { JavaContentExtractor } from './extractors/java/JavaContentExtractor.js';
import { JavaClassParser } from './entity-parsers/java/JavaClassParser.js';
import { JavaMethodParser } from './entity-parsers/java/JavaMethodParser.js';
import { JavaFieldParser } from './entity-parsers/java/JavaFieldParser.js';
import { JavaAnnotationExtractor } from './extractors/java/JavaAnnotationExtractor.js';
import { JavaMethodCallExtractor } from './extractors/java/JavaMethodCallExtractor.js';
import { ParsedEntity, ParsedRelationship, ParseError } from '../types.js';

export class JavaParser extends BaseLanguageParser {
  private contentExtractor = new JavaContentExtractor();
  private classParser = new JavaClassParser();
  private methodParser = new JavaMethodParser();
  private fieldParser = new JavaFieldParser();
  private annotationExtractor = new JavaAnnotationExtractor();
  private methodCallExtractor = new JavaMethodCallExtractor();
  private createdPackages: Map<string, Set<string>> = new Map();

  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.java';
  }

  async parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }> {
    this.setCurrentProject(projectId);
    
    // Initialize created packages set for this project if not exists
    if (!this.createdPackages.has(projectId)) {
      this.createdPackages.set(projectId, new Set());
    }

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Check if file is effectively empty (only whitespace/comments)
      const trimmedContent = content.trim();
      if (trimmedContent === '') {
        // Empty file - return empty arrays
        return { entities, relationships, errors };
      }

      // Extract basic content structure
      const extractionResult = this.contentExtractor.extractContent(content, filePath);
      const packageName = extractionResult.packageName || this.getPackageFromPath(filePath);
      const packageId = packageName;

      // Create package entity if not already created
      const createdPackagesForProject = this.createdPackages.get(projectId)!;
      if (!createdPackagesForProject.has(packageId)) {
        const packageEntity = EntityFactory.createPackage(
          packageId,
          packageName,
          packageName,
          filePath,
          `Package: ${packageName}`
        );
        this.addEntity(entities, packageEntity);
        createdPackagesForProject.add(packageId);
      }

      // Create module entity
      const moduleId = `${packageName}.${path.basename(filePath, '.java')}`;
      const moduleEntity = EntityFactory.createModule(
        moduleId,
        path.basename(filePath, '.java'),
        moduleId,
        filePath,
        `Java file: ${path.basename(filePath)}`
      );
      this.addEntity(entities, moduleEntity);
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(moduleId, packageId, filePath));

      // Parse different entity types using specialized parsers
      this.classParser.parseClasses(
        content, filePath, packageName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      this.methodParser.parseMethods(
        content, filePath, packageName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      this.fieldParser.parseFields(
        content, filePath, packageName, entities, relationships,
        (entity) => this.addEntity(entities, entity),
        (rel) => this.addRelationship(relationships, rel)
      );

      // Parse interfaces and enums using content extractor
      this.parseInterfaces(content, filePath, packageName, entities, relationships);
      this.parseEnums(content, filePath, packageName, entities, relationships);

    } catch (error) {
      this.addError(errors, {
        message: `Failed to parse Java file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        line: 1,
        file_path: filePath
      });
    }

    return { entities, relationships, errors };
  }

  private parseInterfaces(
    content: string,
    filePath: string,
    packageName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedInterface of extractionResult.interfaces) {
      const interfaceId = `${packageName}.${parsedInterface.name}`;
      const qualifiedName = `${packageName}.${parsedInterface.name}`;
      
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
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(interfaceId, packageName, filePath));

      // Handle interface inheritance
      if (parsedInterface.extends && parsedInterface.extends.length > 0) {
        for (const parentInterface of parsedInterface.extends) {
          const parentId = this.resolveType(parentInterface.trim(), packageName, extractionResult.imports);
          this.addRelationship(relationships, RelationshipBuilder.createExtends(interfaceId, parentId, filePath));
        }
      }
    }
  }

  private parseEnums(
    content: string,
    filePath: string,
    packageName: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[]
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedEnum of extractionResult.enums) {
      const enumId = `${packageName}.${parsedEnum.name}`;
      const qualifiedName = `${packageName}.${parsedEnum.name}`;
      
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
      this.addRelationship(relationships, RelationshipBuilder.createBelongsTo(enumId, packageName, filePath));
    }
  }

  private resolveType(typeName: string, packageName: string, imports: any[]): string {
    // Remove generic type parameters
    const baseType = typeName.split('<')[0].trim();
    
    // Check if it's a fully qualified name
    if (baseType.includes('.')) {
      return baseType;
    }
    
    // Check imports for the type
    for (const imp of imports) {
      if (imp.items?.includes(baseType) || imp.module.endsWith(`.${baseType}`)) {
        return imp.module.includes('.') ? imp.module : `${packageName}.${baseType}`;
      }
    }
    
    // Default to same package
    return `${packageName}.${baseType}`;
  }

  private getPackageFromPath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const parts = normalized.split(path.sep);
    
    // Find src/main/java or just src directory
    const srcIndex = parts.findIndex(part => part === 'src');
    if (srcIndex !== -1) {
      const startIndex = parts.includes('main') ? srcIndex + 3 : srcIndex + 1;
      const packageParts = parts.slice(startIndex, -1); // Exclude filename
      return packageParts.join('.');
    }
    
    return 'default';
  }
}