import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { JavaContentExtractor } from '../../extractors/java/JavaContentExtractor.js';
import { JavaDocExtractor } from '../../extractors/java/JavaDocExtractor.js';
import { JavaFrameworkDetector } from '../../framework-detection/java/JavaFrameworkDetector.js';

export class JavaMethodParser {
  private contentExtractor = new JavaContentExtractor();
  private docExtractor = new JavaDocExtractor();
  private frameworkDetector = new JavaFrameworkDetector();

  parseMethods(
    content: string, 
    filePath: string, 
    packageName: string,
    entities: ParsedEntity[], 
    relationships: ParsedRelationship[],
    addEntity: (entity: Omit<ParsedEntity, 'project_id'>) => void,
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedMethod of extractionResult.functions) {
      // Determine the containing class
      const containingClass = this.findContainingClass(content, parsedMethod.startLine || 1, entities);
      if (!containingClass) continue; // Skip if not in a class
      
      const methodId = `${containingClass.qualified_name}.${parsedMethod.name}`;
      const qualifiedName = `${containingClass.qualified_name}.${parsedMethod.name}`;
      
      // Extract documentation
      const documentation = parsedMethod.startLine 
        ? this.docExtractor.extractDocumentation(content, this.getPositionFromLine(content, parsedMethod.startLine))
        : undefined;

      // Extract annotations
      const annotations = this.extractAnnotations(content, parsedMethod.startLine || 1);

      // Create method entity
      const methodEntity = EntityFactory.createMethod(
        methodId,
        parsedMethod.name,
        qualifiedName,
        filePath,
        parsedMethod.startLine,
        parsedMethod.endLine,
        parsedMethod.modifiers,
        documentation,
        annotations
      );

      addEntity(methodEntity);

      // Create containment relationship
      addRelationship(RelationshipBuilder.createContains(containingClass.id, methodId, filePath));

      // Parse method calls and create call relationships
      this.parseMethodCalls(content, parsedMethod, methodId, packageName, extractionResult.imports, addRelationship, filePath);
    }
  }

  private findContainingClass(content: string, methodLine: number, entities: ParsedEntity[]): ParsedEntity | null {
    // Find the class that contains this method based on line numbers
    for (const entity of entities) {
      if (entity.type === 'class' && 
          entity.start_line && 
          entity.end_line &&
          methodLine >= entity.start_line && 
          methodLine <= entity.end_line) {
        return entity;
      }
    }
    return null;
  }

  private parseMethodCalls(
    content: string, 
    method: any, 
    methodId: string, 
    packageName: string,
    imports: any[],
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void,
    filePath: string
  ): void {
    if (!method.startLine || !method.endLine) return;
    
    const methodBody = this.extractMethodBody(content, method.startLine, method.endLine);
    
    // Simple regex to find method calls - can be improved
    const methodCallPattern = /([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
    let match;
    
    while ((match = methodCallPattern.exec(methodBody)) !== null) {
      const calledMethodName = match[1];
      
      // Skip common Java keywords and built-in methods
      if (this.isBuiltInMethod(calledMethodName)) continue;
      
      // Try to resolve the called method
      const calledMethodId = this.resolveMethodCall(calledMethodName, packageName, imports);
      
      addRelationship(RelationshipBuilder.createCalls(methodId, calledMethodId, filePath));
    }
  }

  private extractMethodBody(content: string, startLine: number, endLine: number): string {
    const lines = content.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  private isBuiltInMethod(methodName: string): boolean {
    const builtInMethods = [
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
      'try', 'catch', 'finally', 'throw', 'throws', 'return', 'new',
      'this', 'super', 'class', 'interface', 'enum', 'extends', 'implements',
      'public', 'private', 'protected', 'static', 'final', 'abstract',
      'println', 'print', 'toString', 'equals', 'hashCode', 'getClass'
    ];
    
    return builtInMethods.includes(methodName);
  }

  private resolveMethodCall(methodName: string, packageName: string, imports: any[]): string {
    // Simple resolution - can be enhanced with more sophisticated type analysis
    return `${packageName}.${methodName}`;
  }

  private extractAnnotations(content: string, startLine: number): any[] {
    const annotations: any[] = [];
    const lines = content.split('\n');
    
    // Look backwards from the method declaration for annotations
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