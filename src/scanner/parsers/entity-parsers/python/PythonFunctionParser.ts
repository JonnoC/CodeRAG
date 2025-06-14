import { ParsedEntity, ParsedRelationship } from '../../../types.js';
import { EntityFactory } from '../../base/EntityFactory.js';
import { RelationshipBuilder } from '../../base/RelationshipBuilder.js';
import { PythonContentExtractor } from '../../extractors/python/PythonContentExtractor.js';
import { DocstringExtractor } from '../../extractors/python/DocstringExtractor.js';
import { PythonFrameworkDetector } from '../../framework-detection/PythonFrameworkDetector.js';

export class PythonFunctionParser {
  private contentExtractor = new PythonContentExtractor();
  private docExtractor = new DocstringExtractor();
  private frameworkDetector = new PythonFrameworkDetector();

  parseFunctions(
    content: string, 
    filePath: string, 
    moduleName: string,
    entities: ParsedEntity[], 
    relationships: ParsedRelationship[],
    addEntity: (entity: Omit<ParsedEntity, 'project_id'>) => void,
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void
  ): void {
    const extractionResult = this.contentExtractor.extractContent(content, filePath);
    
    for (const parsedFunction of extractionResult.functions) {
      // Determine if this is a method (inside a class) or a standalone function
      const containingClass = this.findContainingClass(content, parsedFunction.startLine || 1, entities);
      
      let functionId: string;
      let qualifiedName: string;
      let entityType: 'function' | 'method';
      
      if (containingClass) {
        // This is a method
        functionId = `${containingClass.qualified_name}.${parsedFunction.name}`;
        qualifiedName = `${containingClass.qualified_name}.${parsedFunction.name}`;
        entityType = 'method';
      } else {
        // This is a standalone function
        functionId = `${moduleName}.${parsedFunction.name}`;
        qualifiedName = `${moduleName}.${parsedFunction.name}`;
        entityType = 'function';
      }
      
      // Extract documentation
      const documentation = parsedFunction.startLine 
        ? this.docExtractor.extractDocumentation(content, this.getPositionFromLine(content, parsedFunction.startLine))
        : undefined;

      // Extract decorators
      const decorators = this.extractDecorators(content, parsedFunction.startLine || 1);

      // Create function/method entity
      const functionEntity = entityType === 'method' 
        ? EntityFactory.createMethod(
            functionId,
            parsedFunction.name,
            qualifiedName,
            filePath,
            parsedFunction.startLine,
            parsedFunction.endLine,
            parsedFunction.modifiers,
            documentation,
            decorators
          )
        : EntityFactory.createFunction(
            functionId,
            parsedFunction.name,
            qualifiedName,
            filePath,
            parsedFunction.startLine,
            parsedFunction.endLine,
            parsedFunction.modifiers,
            documentation,
            decorators
          );

      addEntity(functionEntity);

      // Create containment relationship
      if (containingClass) {
        addRelationship(RelationshipBuilder.createContains(containingClass.id, functionId, filePath));
      } else {
        // Function belongs to module
        addRelationship(RelationshipBuilder.createBelongsTo(functionId, moduleName, filePath));
      }

      // Parse function calls and create call relationships
      this.parseFunctionCalls(content, parsedFunction, functionId, moduleName, extractionResult.imports, addRelationship, filePath);
    }
  }

  private findContainingClass(content: string, functionLine: number, entities: ParsedEntity[]): ParsedEntity | null {
    // Find the class that contains this function based on line numbers and indentation
    const lines = content.split('\n');
    const functionLineContent = lines[functionLine - 1];
    const functionIndentation = this.getIndentation(functionLineContent);
    
    // Look backwards for a class declaration with less indentation
    for (let i = functionLine - 2; i >= 0; i--) {
      const line = lines[i];
      const lineIndentation = this.getIndentation(line);
      
      if (lineIndentation < functionIndentation && line.trim().startsWith('class ')) {
        // Find the corresponding entity
        for (const entity of entities) {
          if (entity.type === 'class' && entity.start_line === i + 1) {
            return entity;
          }
        }
      }
    }
    
    return null;
  }

  private getIndentation(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private parseFunctionCalls(
    content: string, 
    func: any, 
    functionId: string, 
    moduleName: string,
    imports: any[],
    addRelationship: (rel: Omit<ParsedRelationship, 'project_id'>) => void,
    filePath: string
  ): void {
    if (!func.startLine || !func.endLine) return;
    
    const functionBody = this.extractFunctionBody(content, func.startLine, func.endLine);
    
    // Simple regex to find function calls - can be improved
    const functionCallPattern = /([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\s*\(/g;
    let match;
    
    while ((match = functionCallPattern.exec(functionBody)) !== null) {
      const calledFunctionName = match[1];
      
      // Skip common Python keywords and built-in functions
      if (this.isBuiltInFunction(calledFunctionName)) continue;
      
      // Try to resolve the called function
      const calledFunctionId = this.resolveFunctionCall(calledFunctionName, moduleName, imports);
      
      addRelationship(RelationshipBuilder.createCalls(functionId, calledFunctionId, filePath));
    }
  }

  private extractFunctionBody(content: string, startLine: number, endLine: number): string {
    const lines = content.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  private isBuiltInFunction(functionName: string): boolean {
    const builtInFunctions = [
      'print', 'len', 'range', 'str', 'int', 'float', 'bool', 'list', 'dict', 'tuple', 'set',
      'type', 'isinstance', 'hasattr', 'getattr', 'setattr', 'delattr',
      'max', 'min', 'sum', 'any', 'all', 'enumerate', 'zip', 'map', 'filter',
      'open', 'input', 'repr', 'exec', 'eval', 'compile',
      'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 'with',
      'def', 'class', 'return', 'yield', 'import', 'from', 'as', 'pass', 'break', 'continue'
    ];
    
    return builtInFunctions.some(builtin => functionName.includes(builtin));
  }

  private resolveFunctionCall(functionName: string, moduleName: string, imports: any[]): string {
    // Handle method calls (obj.method)
    if (functionName.includes('.')) {
      const parts = functionName.split('.');
      const objectName = parts[0];
      const methodName = parts.slice(1).join('.');
      
      // Try to resolve through imports
      for (const imp of imports) {
        if (imp.alias === objectName || imp.items?.includes(objectName)) {
          return `${imp.module}.${methodName}`;
        }
      }
      
      return `${moduleName}.${functionName}`;
    }
    
    // Simple function call
    return `${moduleName}.${functionName}`;
  }

  private extractDecorators(content: string, startLine: number): any[] {
    const decorators: any[] = [];
    const lines = content.split('\n');
    
    // Look backwards from the function declaration for decorators
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

  private getPositionFromLine(content: string, lineNumber: number): number {
    const lines = content.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    return position;
  }
}