import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { PythonContentExtractor } from '../../extractors/python/PythonContentExtractor.js';
import { DocstringExtractor } from '../../extractors/python/DocstringExtractor.js';
import { PythonFrameworkDetector } from '../../framework-detection/PythonFrameworkDetector.js';

export class PythonClassParser {
  private contentExtractor = new PythonContentExtractor();
  private docExtractor = new DocstringExtractor();
  private frameworkDetector = new PythonFrameworkDetector();

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

      // Extract decorators
      const decorators = this.extractDecorators(content, parsedClass.startLine || 1);

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
    }
  }

  private extractDecorators(content: string, startLine: number): any[] {
    const decorators: any[] = [];
    const lines = content.split('\n');
    
    // Look backwards from the class declaration for decorators
    for (let i = startLine - 2; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      const decoratorMatch = line.match(/@([A-Za-z_][A-Za-z0-9_.]*)(?:\(([^)]*)\))?/);
      if (decoratorMatch) {
        const decoratorName = decoratorMatch[1];
        const framework = this.frameworkDetector.detectFramework(decoratorName) || 'Unknown';
        const category = this.frameworkDetector.categorizeAnnotation(decoratorName) || 'unknown';
        
        decorators.unshift({
          name: decoratorName,
          framework,
          category,
          parameters: decoratorMatch[2] ? decoratorMatch[2].split(',').map(p => p.trim()) : []
        });
      } else if (line && !line.startsWith('@')) {
        break; // Stop at non-decorator content
      }
    }
    
    return decorators;
  }

  private resolveType(typeName: string, moduleName: string, imports: any[]): string {
    // Remove generic type parameters
    const baseType = typeName.split('[')[0].trim();
    
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
      return `builtins.${baseType}`;
    }
    
    // Default to same module
    return `${moduleName}.${baseType}`;
  }

  private isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      'object', 'str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'set',
      'Exception', 'BaseException', 'ValueError', 'TypeError', 'AttributeError'
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