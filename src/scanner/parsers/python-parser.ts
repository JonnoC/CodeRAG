import * as fs from 'fs';
import * as path from 'path';
import { LanguageParser, ParsedEntity, ParsedRelationship, ParseError } from '../types.js';
import { AnnotationInfo } from '../../types.js';

export class PythonParser implements LanguageParser {
  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.py';
  }

  async parseFile(filePath: string, content: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }> {
    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Get module name from file path
      const moduleName = this.getModuleFromPath(filePath);
      const moduleId = moduleName;

      // Add module entity
      if (moduleName !== '__main__') {
        entities.push({
          id: moduleId,
          type: 'module',
          name: moduleName,
          qualified_name: moduleName,
          source_file: filePath,
          description: `Python module: ${moduleName}`
        });
      }

      // Parse classes
      this.parseClasses(content, entities, relationships, filePath, moduleName, errors);
      
      // Parse functions (top-level functions)
      this.parseFunctions(content, entities, relationships, filePath, moduleName, errors);
      
      // Parse exceptions
      this.parseExceptions(content, entities, relationships, filePath, moduleName, errors);

    } catch (error) {
      errors.push({
        file: filePath,
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return { entities, relationships, errors };
  }

  private parseClasses(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    moduleName: string,
    errors: ParseError[]
  ): void {
    // Match class declarations with inheritance
    const classRegex = /^(\s*)class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(([^)]*)\))?\s*:/gm;
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      const indentation = match[1];
      const className = match[2];
      const inheritance = match[3];
      
      const qualifiedName = moduleName !== '__main__' ? `${moduleName}.${className}` : className;
      const classId = qualifiedName;
      
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      // Extract docstring
      const description = this.extractDocstring(content, match.index + match[0].length);
      
      // Extract decorators
      const annotations = this.extractDecorators(content, match.index);
      
      // Determine if this is an exception class
      const isException = this.isExceptionClass(className, inheritance);
      
      const classEntity: ParsedEntity = {
        id: classId,
        type: isException ? 'exception' : 'class',
        name: className,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        attributes: {
          implements: [], // Python doesn't have interfaces, but we track ABC
          extends: undefined,
          annotations
        }
      };

      // Handle inheritance
      if (inheritance) {
        const parentClasses = inheritance.split(',').map(p => p.trim()).filter(p => p);
        
        for (const parentClass of parentClasses) {
          const parentId = this.resolveTypeReference(parentClass, moduleName);
          
          // First parent is typically the main inheritance
          if (!classEntity.attributes!.extends) {
            classEntity.attributes!.extends = parentId;
            
            relationships.push({
              id: `${classId}_extends_${parentId}`,
              type: 'extends',
              source: classId,
              target: parentId
            });
          } else {
            // Additional parents (multiple inheritance or mixins)
            classEntity.attributes!.implements!.push(parentId);
            
            relationships.push({
              id: `${classId}_implements_${parentId}`,
              type: 'implements',
              source: classId,
              target: parentId
            });
          }
        }
      }

      entities.push(classEntity);

      // Create belongs_to relationship with module
      if (moduleName !== '__main__' && moduleName !== classId) {
        relationships.push({
          id: `${classId}_belongs_to_${moduleName}`,
          type: 'belongs_to',
          source: classId,
          target: moduleName
        });
      }

      // Parse class members
      this.parseClassMembers(content, match.index, indentation, classId, entities, relationships, filePath, errors);
    }
  }

  private parseFunctions(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    moduleName: string,
    errors: ParseError[]
  ): void {
    // Match top-level function declarations (not indented)
    const functionRegex = /^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/gm;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const parameters = match[2];
      const returnType = match[3];
      
      // Skip if this function is inside a class (would be indented)
      const beforeMatch = content.substring(0, match.index);
      const lines = beforeMatch.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Check if function is at top level (no indentation)
      if (currentLine.startsWith('def') && !beforeMatch.endsWith('\n    ') && !beforeMatch.endsWith('\n\t')) {
        const qualifiedName = moduleName !== '__main__' ? `${moduleName}.${functionName}` : functionName;
        const functionId = qualifiedName;
        
        const lineNumber = lines.length;
        const description = this.extractDocstring(content, match.index + match[0].length);
        const paramList = this.parseParameters(parameters);
        const annotations = this.extractDecorators(content, match.index);

        entities.push({
          id: functionId,
          type: 'function',
          name: functionName,
          qualified_name: qualifiedName,
          description,
          source_file: filePath,
          start_line: lineNumber,
          attributes: {
            parameters: paramList,
            return_type: returnType?.trim() || 'Any',
            annotations
          }
        });

        // Create belongs_to relationship with module
        if (moduleName !== '__main__' && moduleName !== functionId) {
          relationships.push({
            id: `${functionId}_belongs_to_${moduleName}`,
            type: 'belongs_to',
            source: functionId,
            target: moduleName
          });
        }
      }
    }
  }

  private parseExceptions(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    moduleName: string,
    errors: ParseError[]
  ): void {
    // Look for exception classes that inherit from Exception, BaseException, or other exceptions
    const exceptionRegex = /^(\s*)class\s+([A-Za-z_][A-Za-z0-9_]*(?:Exception|Error))\s*\(([^)]*(?:Exception|Error|BaseException)[^)]*)\)\s*:/gm;
    
    let match;
    while ((match = exceptionRegex.exec(content)) !== null) {
      const indentation = match[1];
      const exceptionName = match[2];
      const inheritance = match[3];
      
      const qualifiedName = moduleName !== '__main__' ? `${moduleName}.${exceptionName}` : exceptionName;
      const exceptionId = qualifiedName;
      
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      const description = this.extractDocstring(content, match.index + match[0].length);
      const annotations = this.extractDecorators(content, match.index);
      
      entities.push({
        id: exceptionId,
        type: 'exception',
        name: exceptionName,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        attributes: {
          extends: this.resolveTypeReference(inheritance.split(',')[0].trim(), moduleName),
          annotations
        }
      });

      // Create extends relationship with parent exception
      const parentId = this.resolveTypeReference(inheritance.split(',')[0].trim(), moduleName);
      relationships.push({
        id: `${exceptionId}_extends_${parentId}`,
        type: 'extends',
        source: exceptionId,
        target: parentId
      });

      // Create belongs_to relationship
      if (moduleName !== '__main__' && moduleName !== exceptionId) {
        relationships.push({
          id: `${exceptionId}_belongs_to_${moduleName}`,
          type: 'belongs_to',
          source: exceptionId,
          target: exceptionId
        });
      }
    }
  }

  private parseClassMembers(
    content: string,
    classStartIndex: number,
    classIndentation: string,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    errors: ParseError[]
  ): void {
    // Find the class body by looking for the next class/function at the same indentation level
    const classBody = this.extractClassBody(content, classStartIndex, classIndentation);
    if (!classBody) return;

    // Parse methods within the class
    this.parseClassMethods(classBody.content, classId, entities, relationships, filePath, classBody.startLine);
    
    // Parse class variables/attributes
    this.parseClassAttributes(classBody.content, classId, entities, relationships, filePath, classBody.startLine);
  }

  private parseClassMethods(
    classContent: string,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    baseLineNumber: number
  ): void {
    // Match method declarations within the class (indented)
    const methodRegex = /^\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/gm;
    
    let match;
    while ((match = methodRegex.exec(classContent)) !== null) {
      const methodName = match[1];
      const parameters = match[2];
      const returnType = match[3];
      
      const methodId = `${classId}.${methodName}`;
      
      const beforeMatch = classContent.substring(0, match.index);
      const lineNumber = baseLineNumber + beforeMatch.split('\n').length - 1;
      
      const description = this.extractDocstring(classContent, match.index + match[0].length);
      const paramList = this.parseParameters(parameters);
      const annotations = this.extractDecorators(classContent, match.index);
      
      // Determine modifiers based on method name patterns
      const modifiers: string[] = [];
      if (methodName.startsWith('_') && !methodName.startsWith('__')) {
        modifiers.push('protected');
      } else if (methodName.startsWith('__') && methodName.endsWith('__')) {
        modifiers.push('special');
      } else if (methodName.startsWith('__')) {
        modifiers.push('private');
      } else {
        modifiers.push('public');
      }
      
      // Check for static method and class method decorators from annotations
      for (const annotation of annotations) {
        if (annotation.name === 'staticmethod') {
          modifiers.push('static');
        } else if (annotation.name === 'classmethod') {
          modifiers.push('classmethod');
        }
      }

      entities.push({
        id: methodId,
        type: 'method',
        name: methodName,
        qualified_name: methodId,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          parameters: paramList,
          return_type: returnType?.trim() || 'Any',
          annotations
        }
      });

      // Create contains relationship
      relationships.push({
        id: `${classId}_contains_${methodId}`,
        type: 'contains',
        source: classId,
        target: methodId
      });
    }
  }

  private parseClassAttributes(
    classContent: string,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    baseLineNumber: number
  ): void {
    // Match class variable assignments (simple pattern)
    const attributeRegex = /^\s+([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*([^#\n]+)/gm;
    
    let match;
    while ((match = attributeRegex.exec(classContent)) !== null) {
      const attributeName = match[1];
      const attributeValue = match[2].trim();
      
      // Skip if this looks like a method call or complex expression
      if (attributeValue.includes('(') && attributeValue.includes(')')) {
        continue;
      }
      
      const attributeId = `${classId}.${attributeName}`;
      
      const beforeMatch = classContent.substring(0, match.index);
      const lineNumber = baseLineNumber + beforeMatch.split('\n').length - 1;
      
      // Extract decorators for the attribute
      const annotations = this.extractDecorators(classContent, match.index);
      
      // Determine modifiers based on attribute name patterns
      const modifiers: string[] = [];
      if (attributeName.startsWith('_') && !attributeName.startsWith('__')) {
        modifiers.push('protected');
      } else if (attributeName.startsWith('__')) {
        modifiers.push('private');
      } else {
        modifiers.push('public');
      }

      entities.push({
        id: attributeId,
        type: 'field',
        name: attributeName,
        qualified_name: attributeId,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          field_type: this.inferType(attributeValue),
          annotations
        }
      });

      // Create contains relationship
      relationships.push({
        id: `${classId}_contains_${attributeId}`,
        type: 'contains',
        source: classId,
        target: attributeId
      });
    }
  }

  private extractClassBody(content: string, startIndex: number, classIndentation: string): { content: string; startLine: number } | null {
    const lines = content.split('\n');
    const startLine = content.substring(0, startIndex).split('\n').length;
    
    let bodyStart = -1;
    let bodyEnd = lines.length;
    
    // Find the start of the class body (after the class declaration)
    for (let i = startLine - 1; i < lines.length; i++) {
      if (lines[i].includes('class ')) {
        bodyStart = i + 1;
        break;
      }
    }
    
    if (bodyStart === -1) return null;
    
    // Find the end of the class body (next line with same or less indentation that's not empty)
    for (let i = bodyStart; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') continue; // Skip empty lines
      
      // If we find a line with same or less indentation than the class, that's the end
      const lineIndentation = line.match(/^(\s*)/)?.[1] || '';
      if (lineIndentation.length <= classIndentation.length && line.trim() !== '') {
        bodyEnd = i;
        break;
      }
    }
    
    const bodyLines = lines.slice(bodyStart, bodyEnd);
    const bodyContent = bodyLines.join('\n');
    
    return { content: bodyContent, startLine: bodyStart + 1 };
  }

  private extractDocstring(content: string, position: number): string | undefined {
    // Look for docstring after the function/class definition
    const afterPosition = content.substring(position);
    const lines = afterPosition.split('\n');
    
    // Skip empty lines and whitespace
    let docstringStart = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      // Check for docstring patterns
      if (line.startsWith('"""') || line.startsWith("'''")) {
        docstringStart = i;
        break;
      } else if (line.startsWith('#')) {
        continue; // Skip comments
      } else {
        break; // Found non-docstring content
      }
    }
    
    if (docstringStart === -1) return undefined;
    
    const docstringQuote = lines[docstringStart].includes('"""') ? '"""' : "'''";
    let docstringLines: string[] = [];
    
    // Check if single-line docstring
    const firstLine = lines[docstringStart];
    const quoteCount = (firstLine.match(new RegExp(docstringQuote, 'g')) || []).length;
    if (quoteCount >= 2) {
      // Single-line docstring
      return firstLine.replace(new RegExp(docstringQuote, 'g'), '').trim();
    }
    
    // Multi-line docstring
    docstringLines.push(firstLine.replace(docstringQuote, ''));
    
    for (let i = docstringStart + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(docstringQuote)) {
        docstringLines.push(line.replace(docstringQuote, ''));
        break;
      }
      docstringLines.push(line);
    }
    
    return docstringLines.join('\n').trim();
  }

  private parseParameters(paramString: string): Array<{name: string; type: string; description?: string}> {
    if (!paramString.trim()) return [];
    
    const params = paramString.split(',').map(p => p.trim()).filter(p => p);
    
    return params.map(param => {
      // Handle type annotations: name: type = default
      const colonIndex = param.indexOf(':');
      const equalIndex = param.indexOf('=');
      
      let name = param;
      let type = 'Any';
      
      if (colonIndex !== -1) {
        name = param.substring(0, colonIndex).trim();
        const typeEnd = equalIndex !== -1 ? equalIndex : param.length;
        type = param.substring(colonIndex + 1, typeEnd).trim();
      } else if (equalIndex !== -1) {
        name = param.substring(0, equalIndex).trim();
        // Try to infer type from default value
        const defaultValue = param.substring(equalIndex + 1).trim();
        type = this.inferType(defaultValue);
      }
      
      return {
        name,
        type,
        description: undefined
      };
    });
  }

  private inferType(value: string): string {
    value = value.trim();
    
    // Remove quotes to check content
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return 'str';
    }
    
    if (value === 'True' || value === 'False') return 'bool';
    if (value === 'None') return 'None';
    if (/^\d+$/.test(value)) return 'int';
    if (/^\d+\.\d+$/.test(value)) return 'float';
    if (value.startsWith('[') && value.endsWith(']')) return 'List';
    if (value.startsWith('{') && value.endsWith('}')) return 'Dict';
    if (value.startsWith('(') && value.endsWith(')')) return 'Tuple';
    
    return 'Any';
  }

  private resolveTypeReference(typeName: string, currentModule: string): string {
    // Clean up type name
    const cleanTypeName = typeName.trim();
    
    // If it's already qualified (contains dots), return as is
    if (cleanTypeName.includes('.')) {
      return cleanTypeName;
    }
    
    // Common built-in types
    const builtinTypes = [
      'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'frozenset',
      'bytes', 'bytearray', 'object', 'type', 'None', 'Any',
      'Exception', 'BaseException', 'ValueError', 'TypeError', 'RuntimeError'
    ];
    
    if (builtinTypes.includes(cleanTypeName)) {
      return cleanTypeName;
    }
    
    // Assume it's in the current module
    return currentModule !== '__main__' ? `${currentModule}.${cleanTypeName}` : cleanTypeName;
  }

  private isExceptionClass(className: string, inheritance?: string): boolean {
    if (className.endsWith('Exception') || className.endsWith('Error')) {
      return true;
    }
    
    if (inheritance) {
      const parentClasses = inheritance.split(',').map(p => p.trim().toLowerCase());
      return parentClasses.some(parent => 
        parent.includes('exception') || 
        parent.includes('error') || 
        parent.includes('baseexception')
      );
    }
    
    return false;
  }

  private getModuleFromPath(filePath: string): string {
    const pathParts = path.dirname(filePath).split(path.sep);
    const fileName = path.basename(filePath, '.py');
    
    // Look for common Python project structure markers
    const markers = ['src', 'lib', 'app', 'packages'];
    let startIndex = -1;
    
    for (const marker of markers) {
      const index = pathParts.findIndex(part => part === marker);
      if (index >= 0) {
        startIndex = index + 1;
        break;
      }
    }
    
    // If no marker found, use the directory structure as is
    if (startIndex === -1) {
      startIndex = 0;
    }
    
    const moduleParts = pathParts.slice(startIndex);
    
    // Handle __init__.py files
    if (fileName === '__init__') {
      return moduleParts.join('.');
    }
    
    // Handle regular files
    if (moduleParts.length > 0) {
      return `${moduleParts.join('.')}.${fileName}`;
    }
    
    return fileName === 'main' ? '__main__' : fileName;
  }

  private extractDecorators(content: string, entityPosition: number): AnnotationInfo[] {
    const beforeEntity = content.substring(0, entityPosition);
    const lines = beforeEntity.split('\n');
    const decorators: AnnotationInfo[] = [];
    
    // Scan backwards from entity to find decorators
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      if (line.startsWith('@')) {
        const match = line.match(/@([A-Za-z_][A-Za-z0-9_.]*)(?:\(([^)]*)\))?/);
        if (match) {
          const decoratorName = match[1];
          const parametersString = match[2];
          
          decorators.unshift({
            name: decoratorName,
            type: 'decorator',
            parameters: this.parseDecoratorParameters(parametersString),
            source_line: i + 1,
            framework: this.detectPythonFramework(decoratorName),
            category: this.categorizeDecorator(decoratorName)
          });
        }
      } else if (line && !line.startsWith('#')) {
        // Stop on non-comment, non-decorator content
        break;
      }
    }
    
    return decorators;
  }

  private parseDecoratorParameters(parametersString?: string): Array<{name?: string; value: string; type?: string}> {
    if (!parametersString || !parametersString.trim()) {
      return [];
    }
    
    const params: Array<{name?: string; value: string; type?: string}> = [];
    const paramString = parametersString.trim();
    
    // Handle different parameter patterns
    if (paramString.includes('=')) {
      // Named parameters like @decorator(param1=value1, param2=value2)
      const assignments = this.splitParameters(paramString);
      for (const assignment of assignments) {
        const parts = assignment.split('=').map(p => p.trim());
        if (parts.length === 2) {
          params.push({
            name: parts[0],
            value: parts[1].replace(/^["']|["']$/g, ''), // Remove quotes
            type: this.inferParameterType(parts[1])
          });
        }
      }
    } else {
      // Positional parameters like @decorator(value1, value2)
      const values = this.splitParameters(paramString);
      for (const value of values) {
        params.push({
          value: value.trim().replace(/^["']|["']$/g, ''), // Remove quotes
          type: this.inferParameterType(value.trim())
        });
      }
    }
    
    return params;
  }

  private splitParameters(paramString: string): string[] {
    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < paramString.length; i++) {
      const char = paramString[i];
      
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        inString = false;
        stringChar = '';
      } else if (!inString) {
        if (char === '(' || char === '[' || char === '{') {
          depth++;
        } else if (char === ')' || char === ']' || char === '}') {
          depth--;
        } else if (char === ',' && depth === 0) {
          parameters.push(current.trim());
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      parameters.push(current.trim());
    }
    
    return parameters;
  }

  private inferParameterType(value: string): string {
    value = value.trim();
    
    if (value.startsWith('"') || value.startsWith("'")) return 'string';
    if (value === 'True' || value === 'False') return 'boolean';
    if (value === 'None') return 'none';
    if (/^\d+$/.test(value)) return 'number';
    if (/^\d+\.\d+$/.test(value)) return 'number';
    if (value.startsWith('[') || value.startsWith('(')) return 'collection';
    
    return 'identifier';
  }

  private detectPythonFramework(decoratorName: string): string | undefined {
    const frameworkMap: Record<string, string> = {
      // Flask
      'app.route': 'Flask',
      'route': 'Flask',
      'before_request': 'Flask',
      'after_request': 'Flask',
      'teardown_request': 'Flask',
      'context_processor': 'Flask',
      'template_filter': 'Flask',
      'template_global': 'Flask',
      
      // Django
      'login_required': 'Django',
      'permission_required': 'Django',
      'user_passes_test': 'Django',
      'csrf_exempt': 'Django',
      'require_http_methods': 'Django',
      'require_GET': 'Django',
      'require_POST': 'Django',
      'require_safe': 'Django',
      'cache_page': 'Django',
      'never_cache': 'Django',
      'vary_on_headers': 'Django',
      'vary_on_cookie': 'Django',
      
      // FastAPI
      'app.get': 'FastAPI',
      'app.post': 'FastAPI',
      'app.put': 'FastAPI',
      'app.delete': 'FastAPI',
      'app.patch': 'FastAPI',
      'app.options': 'FastAPI',
      'app.head': 'FastAPI',
      'app.trace': 'FastAPI',
      'Depends': 'FastAPI',
      'HTTPException': 'FastAPI',
      
      // Pytest
      'pytest.fixture': 'Pytest',
      'pytest.mark.parametrize': 'Pytest',
      'pytest.mark.skip': 'Pytest',
      'pytest.mark.skipif': 'Pytest',
      'pytest.mark.xfail': 'Pytest',
      'pytest.mark.slow': 'Pytest',
      'fixture': 'Pytest',
      'mark.parametrize': 'Pytest',
      'mark.skip': 'Pytest',
      'mark.skipif': 'Pytest',
      'mark.xfail': 'Pytest',
      
      // Celery
      'task': 'Celery',
      'periodic_task': 'Celery',
      'shared_task': 'Celery',
      
      // SQLAlchemy
      'validates': 'SQLAlchemy',
      'reconstructor': 'SQLAlchemy',
      'hybrid_property': 'SQLAlchemy',
      'hybrid_method': 'SQLAlchemy',
      
      // Pydantic
      'validator': 'Pydantic',
      'root_validator': 'Pydantic',
      'field_validator': 'Pydantic',
      'model_validator': 'Pydantic',
      
      // Python built-ins
      'property': 'Python',
      'staticmethod': 'Python',
      'classmethod': 'Python',
      'cached_property': 'Python',
      'lru_cache': 'Python',
      'singledispatch': 'Python',
      'wraps': 'Python',
      'dataclass': 'Python',
      'total_ordering': 'Python',
      
      // Click
      'click.command': 'Click',
      'click.group': 'Click',
      'click.option': 'Click',
      'click.argument': 'Click',
      'command': 'Click',
      'group': 'Click',
      'option': 'Click',
      'argument': 'Click',
      
      // Typing
      'overload': 'Typing',
      'final': 'Typing',
      'runtime_checkable': 'Typing',
      
      // Deprecated
      'deprecated': 'Deprecated'
    };
    
    return frameworkMap[decoratorName];
  }

  private categorizeDecorator(decoratorName: string): string | undefined {
    const categoryMap: Record<string, string> = {
      // Web/API
      'app.route': 'web',
      'route': 'web',
      'app.get': 'web',
      'app.post': 'web',
      'app.put': 'web',
      'app.delete': 'web',
      'app.patch': 'web',
      'require_http_methods': 'web',
      'require_GET': 'web',
      'require_POST': 'web',
      
      // Authentication/Security
      'login_required': 'security',
      'permission_required': 'security',
      'user_passes_test': 'security',
      'csrf_exempt': 'security',
      
      // Caching
      'cache_page': 'caching',
      'never_cache': 'caching',
      'lru_cache': 'caching',
      'cached_property': 'caching',
      
      // Testing
      'pytest.fixture': 'testing',
      'fixture': 'testing',
      'pytest.mark.parametrize': 'testing',
      'mark.parametrize': 'testing',
      'pytest.mark.skip': 'testing',
      'mark.skip': 'testing',
      'pytest.mark.skipif': 'testing',
      'mark.skipif': 'testing',
      'pytest.mark.xfail': 'testing',
      'mark.xfail': 'testing',
      
      // Data/Persistence
      'validates': 'persistence',
      'validator': 'validation',
      'root_validator': 'validation',
      'field_validator': 'validation',
      'model_validator': 'validation',
      
      // Language Features
      'property': 'language',
      'staticmethod': 'language',
      'classmethod': 'language',
      'dataclass': 'language',
      'total_ordering': 'language',
      'overload': 'language',
      'final': 'language',
      'runtime_checkable': 'language',
      
      // Lifecycle/Events
      'before_request': 'lifecycle',
      'after_request': 'lifecycle',
      'teardown_request': 'lifecycle',
      'reconstructor': 'lifecycle',
      
      // Async/Tasks
      'task': 'async',
      'periodic_task': 'async',
      'shared_task': 'async',
      
      // CLI
      'click.command': 'cli',
      'command': 'cli',
      'click.group': 'cli',
      'group': 'cli',
      'click.option': 'cli',
      'option': 'cli',
      'click.argument': 'cli',
      'argument': 'cli',
      
      // Utilities
      'wraps': 'utility',
      'singledispatch': 'utility',
      'deprecated': 'utility',
      'vary_on_headers': 'utility',
      'vary_on_cookie': 'utility',
      
      // Templates
      'template_filter': 'template',
      'template_global': 'template',
      'context_processor': 'template'
    };
    
    return categoryMap[decoratorName];
  }
}