import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { TypeScriptContentExtractor } from '../../extractors/typescript/TypeScriptContentExtractor.js';
import { JsDocExtractor } from '../../extractors/typescript/JsDocExtractor.js';
import { TypeScriptFrameworkDetector } from '../../framework-detection/typescript/TypeScriptFrameworkDetector.js';
import { TypeScriptAnnotationExtractor } from '../../extractors/typescript/TypeScriptAnnotationExtractor.js';

export class TypeScriptClassParser {
  private contentExtractor = new TypeScriptContentExtractor();
  private docExtractor = new JsDocExtractor();
  private frameworkDetector = new TypeScriptFrameworkDetector();
  private annotationExtractor = new TypeScriptAnnotationExtractor();

  parseClasses(
    content: string, 
    filePath: string, 
    moduleName: string,
    entities: ParsedEntity[], 
    relationships: ParsedRelationship[],
    addEntity: (entity: Omit<ParsedEntity, 'project_id'>) => void,
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedClass of extractionResult.classes) {
      const classId = `${moduleName}.${parsedClass.name}`;
      const qualifiedName = `${moduleName}.${parsedClass.name}`;
      
      // Extract documentation
      const documentation = parsedClass.startLine 
        ? this.docExtractor.extractDocumentation(content, this.getPositionFromLine(content, parsedClass.startLine))
        : undefined;

      // Extract decorators using modular extractor
      const decoratorResult = this.annotationExtractor.extractAnnotations(content, this.getPositionFromLine(content, parsedClass.startLine || 1));
      const decorators = decoratorResult.annotations;

      // Create class entity
      const classEntity = EntityFactory.createClass(
        classId,
        parsedClass.name,
        qualifiedName,
        filePath,
        parsedClass.startLine,
        parsedClass.endLine,
        parsedClass.modifiers,
        documentation,
        decorators
      );

      addEntity(classEntity);

      // Create module relationship
      const moduleId = moduleName;
      addRelationship(RelationshipBuilder.createBelongsTo(classId, moduleId, filePath));

      // Handle inheritance
      if (parsedClass.extends && parsedClass.extends.length > 0) {
        for (const parentClass of parsedClass.extends) {
          const parentId = this.resolveType(parentClass.trim(), moduleName, extractionResult.imports);
          addRelationship(RelationshipBuilder.createExtends(classId, parentId, filePath));
        }
      }

      // Handle interfaces
      if (parsedClass.implements && parsedClass.implements.length > 0) {
        for (const interfaceName of parsedClass.implements) {
          const interfaceId = this.resolveType(interfaceName.trim(), moduleName, extractionResult.imports);
          addRelationship(RelationshipBuilder.createImplements(classId, interfaceId, filePath));
        }
      }
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

  private getPositionFromLine(content: string, lineNumber: number): number {
    const lines = content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    return position;
  }
}