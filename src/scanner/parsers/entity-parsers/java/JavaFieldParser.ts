import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { JavaContentExtractor } from '../../extractors/java/JavaContentExtractor.js';
import { JavaDocExtractor } from '../../extractors/java/JavaDocExtractor.js';
import { JavaFrameworkDetector } from '../../framework-detection/JavaFrameworkDetector.js';

export class JavaFieldParser {
  private contentExtractor = new JavaContentExtractor();
  private docExtractor = new JavaDocExtractor();
  private frameworkDetector = new JavaFrameworkDetector();

  parseFields(
    content: string, 
    filePath: string, 
    packageName: string,
    entities: ParsedEntity[], 
    relationships: ParsedRelationship[],
    addEntity: (entity: Omit<ParsedEntity, 'project_id'>) => void,
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedField of extractionResult.fields) {
      // Determine the containing class
      const containingClass = this.findContainingClass(content, parsedField.startLine || 1, entities);
      if (!containingClass) continue; // Skip if not in a class
      
      const fieldId = `${containingClass.qualified_name}.${parsedField.name}`;
      const qualifiedName = `${containingClass.qualified_name}.${parsedField.name}`;
      
      // Extract documentation
      const documentation = parsedField.startLine 
        ? this.docExtractor.extractDocumentation(content, this.getPositionFromLine(content, parsedField.startLine))
        : undefined;

      // Extract annotations
      const annotations = this.extractAnnotations(content, parsedField.startLine || 1);

      // Create field entity
      const fieldEntity = EntityFactory.createField(
        fieldId,
        parsedField.name,
        qualifiedName,
        filePath,
        parsedField.startLine,
        parsedField.endLine,
        parsedField.modifiers,
        documentation,
        annotations
      );

      addEntity(fieldEntity);

      // Create containment relationship
      addRelationship(RelationshipBuilder.createContains(containingClass.id, fieldId, filePath));

      // Create type reference if the field has a custom type
      if (parsedField.type) {
        const referencedType = this.resolveType(parsedField.type, packageName, extractionResult.imports);
        if (referencedType !== parsedField.type && !this.isBuiltInType(referencedType)) {
          addRelationship(RelationshipBuilder.createReferences(fieldId, referencedType, filePath));
        }
      }
    }
  }

  private findContainingClass(content: string, fieldLine: number, entities: ParsedEntity[]): ParsedEntity | null {
    // Find the class that contains this field based on line numbers
    for (const entity of entities) {
      if (entity.type === 'class' && 
          entity.start_line && 
          entity.end_line &&
          fieldLine >= entity.start_line && 
          fieldLine <= entity.end_line) {
        return entity;
      }
    }
    return null;
  }

  private resolveType(typeName: string, packageName: string, imports: any[]): string {
    // Remove generic type parameters and array brackets
    const baseType = typeName.replace(/[<>\[\]]/g, '').split(/[<,\s]/)[0].trim();
    
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

  private isBuiltInType(typeName: string): boolean {
    const builtInTypes = [
      'int', 'long', 'short', 'byte', 'float', 'double', 'boolean', 'char',
      'Integer', 'Long', 'Short', 'Byte', 'Float', 'Double', 'Boolean', 'Character',
      'String', 'Object', 'void', 'Void',
      'List', 'Set', 'Map', 'Collection', 'ArrayList', 'HashMap', 'HashSet'
    ];
    
    return builtInTypes.some(type => typeName.includes(type));
  }

  private extractAnnotations(content: string, startLine: number): any[] {
    const annotations: any[] = [];
    const lines = content.split('\n');
    
    // Look backwards from the field declaration for annotations
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

  private getPositionFromLine(content: string, lineNumber: number): number {
    const lines = content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    return position;
  }
}