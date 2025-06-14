import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { JavaContentExtractor } from '../../extractors/java/JavaContentExtractor.js';
import { JavaDocExtractor } from '../../extractors/java/JavaDocExtractor.js';
import { JavaFrameworkDetector } from '../../framework-detection/JavaFrameworkDetector.js';

export class JavaClassParser {
  private contentExtractor = new JavaContentExtractor();
  private docExtractor = new JavaDocExtractor();
  private frameworkDetector = new JavaFrameworkDetector();

  parseClasses(
    content: string, 
    filePath: string, 
    packageName: string,
    entities: ParsedEntity[], 
    relationships: ParsedRelationship[],
    addEntity: (entity: Omit<ParsedEntity, 'project_id'>) => void,
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedClass of extractionResult.classes) {
      const classId = `${packageName}.${parsedClass.name}`;
      const qualifiedName = `${packageName}.${parsedClass.name}`;
      
      // Extract documentation
      const documentation = parsedClass.startLine 
        ? this.docExtractor.extractDocumentation(content, this.getPositionFromLine(content, parsedClass.startLine))
        : undefined;

      // Extract annotations
      const annotations = this.extractAnnotations(content, parsedClass.startLine || 1);

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
        annotations
      );

      addEntity(classEntity);

      // Create package relationship
      const packageId = packageName;
      addRelationship(RelationshipBuilder.createBelongsTo(classId, packageId, filePath));

      // Handle inheritance
      if (parsedClass.extends && parsedClass.extends.length > 0) {
        for (const parentClass of parsedClass.extends) {
          const parentId = this.resolveType(parentClass.trim(), packageName, extractionResult.imports);
          addRelationship(RelationshipBuilder.createExtends(classId, parentId, filePath));
        }
      }

      // Handle interfaces
      if (parsedClass.implements && parsedClass.implements.length > 0) {
        for (const interfaceName of parsedClass.implements) {
          const interfaceId = this.resolveType(interfaceName.trim(), packageName, extractionResult.imports);
          addRelationship(RelationshipBuilder.createImplements(classId, interfaceId, filePath));
        }
      }
    }
  }

  private extractAnnotations(content: string, startLine: number): any[] {
    const annotations: any[] = [];
    const lines = content.split('\n');
    
    // Look backwards from the class declaration for annotations
    for (let i = startLine - 2; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('/*')) continue;
      
      const annotationMatch = line.match(/@([A-Za-z_][A-Za-z0-9_]*)/);
      if (annotationMatch) {
        const annotationName = annotationMatch[1];
        const framework = this.frameworkDetector.detectFramework(annotationName) || 'Unknown';
        const category = this.frameworkDetector.categorizeAnnotation(annotationName) || 'unknown';
        
        annotations.unshift({
          name: annotationName,
          framework,
          category
        });
      } else if (line && !line.startsWith('@')) {
        break; // Stop at non-annotation content
      }
    }
    
    return annotations;
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

  private getPositionFromLine(content: string, lineNumber: number): number {
    const lines = content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    return position;
  }
}