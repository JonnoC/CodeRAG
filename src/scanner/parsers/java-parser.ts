import * as fs from 'fs';
import * as path from 'path';
import { LanguageParser, ParsedEntity, ParsedRelationship, ParseError } from '../types.js';
import { AnnotationInfo } from '../../types.js';

export class JavaParser implements LanguageParser {
  private currentProjectId: string = '';
  private createdPackages: Map<string, Set<string>> = new Map();

  canParse(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.java';
  }

  private addEntity(entities: ParsedEntity[], entity: Omit<ParsedEntity, 'project_id'>): void {
    entities.push({
      ...entity,
      project_id: this.currentProjectId
    });
  }

  private addRelationship(relationships: ParsedRelationship[], relationship: Omit<ParsedRelationship, 'project_id'>): void {
    relationships.push({
      ...relationship,
      project_id: this.currentProjectId
    });
  }

  async parseFile(filePath: string, content: string, projectId: string): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    errors: ParseError[];
  }> {
    this.currentProjectId = projectId;
    
    // Initialize created packages set for this project if not exists
    if (!this.createdPackages.has(projectId)) {
      this.createdPackages.set(projectId, new Set());
    }
    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Get package name from file content and path
      const packageName = this.extractPackageName(content) || this.getPackageFromPath(filePath);
      const packageId = packageName;
      
      // Parse imports for type resolution
      const imports = this.extractImports(content);

      // Add package entity if not default and not already created for this project
      const projectPackages = this.createdPackages.get(projectId)!;
      if (packageName && packageName !== 'default' && !projectPackages.has(packageId)) {
        this.addEntity(entities, {
          id: packageId,
          type: 'package',
          name: packageName,
          qualified_name: packageName,
          source_file: packageName.replace(/\./g, '/'),
          description: `Package: ${packageName}`
        });
        projectPackages.add(packageId);
      }

      // Parse classes, interfaces, enums
      this.parseClasses(content, entities, relationships, filePath, packageName, imports, errors);
      this.parseInterfaces(content, entities, relationships, filePath, packageName, imports, errors);
      this.parseEnums(content, entities, relationships, filePath, packageName, imports, errors);
      this.parseExceptions(content, entities, relationships, filePath, packageName, imports, errors);
      
      // Create placeholder nodes for external types referenced in relationships
      this.createExternalTypeNodes(relationships, entities);

    } catch (error) {
      errors.push({
        file: filePath,
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      });
    }

    return { entities, relationships, errors };
  }

  private extractPackageName(content: string): string | null {
    const packageMatch = content.match(/^\s*package\s+([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*;/m);
    return packageMatch ? packageMatch[1] : null;
  }

  private extractImports(content: string): Map<string, string> {
    const imports = new Map<string, string>();
    const importRegex = /^\s*import\s+(?:static\s+)?([a-zA-Z_$][a-zA-Z0-9_$.]*(?:\.\*)?);/gm;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      if (importPath.endsWith('.*')) {
        // Package import - we can't resolve specific types from this
        continue;
      }
      
      const lastDot = importPath.lastIndexOf('.');
      if (lastDot > 0) {
        const simpleName = importPath.substring(lastDot + 1);
        imports.set(simpleName, importPath);
      }
    }
    
    return imports;
  }

  private parseClasses(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageName: string,
    imports: Map<string, string>,
    errors: ParseError[]
  ): void {
    // Match class declarations with various modifiers
    const classRegex = /(?:(?:public|private|protected|static|final|abstract)\s+)*class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends\s+([^{]+?))?\s*(?:implements\s+([^{]+?))?\s*\{/g;
    
    let match;
    const lines = content.split('\n');
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const extendsClass = match[2];
      const implementsInterfaces = match[3];
      
      const qualifiedName = packageName ? `${packageName}.${className}` : className;
      const classId = qualifiedName;
      
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      // Extract modifiers from the full match
      const fullMatch = match[0];
      const modifiers = this.extractModifiers(fullMatch);
      
      // Extract JavaDoc if present
      const description = this.extractJavaDoc(content, match.index);
      
      // Extract annotations
      const annotations = this.extractAnnotations(content, match.index);

      const classEntity: ParsedEntity = {
        id: classId,
        project_id: this.currentProjectId,
        type: this.isExceptionClass(className) ? 'exception' : 'class',
        name: className,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          implements: [],
          extends: undefined,
          annotations
        }
      };

      // Handle inheritance
      if (extendsClass) {
        const parentId = this.resolveTypeReference(extendsClass, packageName, imports);
        classEntity.attributes!.extends = parentId;

        this.addRelationship(relationships, {
          id: `${classId}_extends_${parentId}`,
          type: 'extends',
          source: classId,
          target: parentId
        });
      }

      // Handle implemented interfaces
      if (implementsInterfaces) {
        const interfaces = implementsInterfaces.split(',').map(i => i.trim());
        for (const interfaceName of interfaces) {
          const interfaceId = this.resolveTypeReference(interfaceName, packageName, imports);
          classEntity.attributes!.implements!.push(interfaceId);

          this.addRelationship(relationships, {
            id: `${classId}_implements_${interfaceId}`,
            type: 'implements',
            source: classId,
            target: interfaceId
          });
        }
      }

      entities.push(classEntity);

      // Create belongs_to relationship with package
      if (packageName && packageName !== classId) {
        this.addRelationship(relationships, {
          id: `${classId}_belongs_to_${packageName}`,
          type: 'belongs_to',
          source: classId,
          target: packageName
        });
      }

      // Parse class members
      this.parseClassMembers(content, match.index, classId, entities, relationships, filePath, errors);
    }
  }

  private parseInterfaces(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageName: string,
    imports: Map<string, string>,
    errors: ParseError[]
  ): void {
    const interfaceRegex = /(?:(?:public|private|protected|static)\s+)*interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends\s+([^{]+?))?\s*\{/g;
    
    let match;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      const extendsInterfaces = match[2];
      
      const qualifiedName = packageName ? `${packageName}.${interfaceName}` : interfaceName;
      const interfaceId = qualifiedName;
      
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      const modifiers = this.extractModifiers(match[0]);
      const description = this.extractJavaDoc(content, match.index);
      const annotations = this.extractAnnotations(content, match.index);

      const interfaceEntity: ParsedEntity = {
        id: interfaceId,
        project_id: this.currentProjectId,
        type: 'interface',
        name: interfaceName,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          annotations
        }
      };

      // Handle interface inheritance
      if (extendsInterfaces) {
        const interfaces = extendsInterfaces.split(',').map(i => i.trim());
        for (const parentInterface of interfaces) {
          const parentId = this.resolveTypeReference(parentInterface, packageName, imports);
          
          this.addRelationship(relationships, {
            id: `${interfaceId}_extends_${parentId}`,
            type: 'extends',
            source: interfaceId,
            target: parentId
          });
        }
      }

      entities.push(interfaceEntity);

      // Create belongs_to relationship
      if (packageName && packageName !== interfaceId) {
        this.addRelationship(relationships, {
          id: `${interfaceId}_belongs_to_${packageName}`,
          type: 'belongs_to',
          source: interfaceId,
          target: packageName
        });
      }

      // Parse interface members
      this.parseInterfaceMembers(content, match.index, interfaceId, entities, relationships, filePath, errors);
    }
  }

  private parseEnums(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageName: string,
    imports: Map<string, string>,
    errors: ParseError[]
  ): void {
    const enumRegex = /(?:(?:public|private|protected|static)\s+)*enum\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:implements\s+([^{]+?))?\s*\{/g;
    
    let match;
    while ((match = enumRegex.exec(content)) !== null) {
      const enumName = match[1];
      const implementsInterfaces = match[2];
      
      const qualifiedName = packageName ? `${packageName}.${enumName}` : enumName;
      const enumId = qualifiedName;
      
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      const modifiers = this.extractModifiers(match[0]);
      const description = this.extractJavaDoc(content, match.index);
      const annotations = this.extractAnnotations(content, match.index);

      this.addEntity(entities, {
        id: enumId,
        type: 'enum',
        name: enumName,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          annotations
        }
      });

      // Handle implemented interfaces
      if (implementsInterfaces) {
        const interfaces = implementsInterfaces.split(',').map(i => i.trim());
        for (const interfaceName of interfaces) {
          const interfaceId = this.resolveTypeReference(interfaceName, packageName, imports);

          this.addRelationship(relationships, {
            id: `${enumId}_implements_${interfaceId}`,
            type: 'implements',
            source: enumId,
            target: interfaceId
          });
        }
      }

      // Create belongs_to relationship
      if (packageName && packageName !== enumId) {
        this.addRelationship(relationships, {
          id: `${enumId}_belongs_to_${packageName}`,
          type: 'belongs_to',
          source: enumId,
          target: packageName
        });
      }
    }
  }

  private parseExceptions(
    content: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    packageName: string,
    imports: Map<string, string>,
    errors: ParseError[]
  ): void {
    // Look for classes that extend Exception or Error
    const exceptionRegex = /(?:(?:public|private|protected|static|final|abstract)\s+)*class\s+([A-Za-z_$][A-Za-z0-9_$]*(?:Exception|Error))\s+extends\s+([A-Za-z_$][A-Za-z0-9_$.<>]*(?:Exception|Error|Throwable))/g;
    
    let match;
    while ((match = exceptionRegex.exec(content)) !== null) {
      const exceptionName = match[1];
      const parentException = match[2];
      
      const qualifiedName = packageName ? `${packageName}.${exceptionName}` : exceptionName;
      const exceptionId = qualifiedName;
      
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      const modifiers = this.extractModifiers(match[0]);
      const description = this.extractJavaDoc(content, match.index);
      const annotations = this.extractAnnotations(content, match.index);

      this.addEntity(entities, {
        id: exceptionId,
        type: 'exception',
        name: exceptionName,
        qualified_name: qualifiedName,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          extends: this.resolveTypeReference(parentException, packageName, imports),
          annotations
        }
      });

      // Create extends relationship
      const parentId = this.resolveTypeReference(parentException, packageName, imports);
      this.addRelationship(relationships, {
        id: `${exceptionId}_extends_${parentId}`,
        type: 'extends',
        source: exceptionId,
        target: parentId
      });

      // Create belongs_to relationship
      if (packageName && packageName !== exceptionId) {
        this.addRelationship(relationships, {
          id: `${exceptionId}_belongs_to_${packageName}`,
          type: 'belongs_to',
          source: exceptionId,
          target: packageName
        });
      }
    }
  }

  private parseClassMembers(
    content: string,
    classStartIndex: number,
    classId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    errors: ParseError[]
  ): void {
    // Find the class body
    const classBody = this.extractClassBody(content, classStartIndex);
    if (!classBody) return;

    // Parse methods
    this.parseMethods(classBody.content, classId, entities, relationships, filePath, classBody.startLine);
    
    // Parse fields
    this.parseFields(classBody.content, classId, entities, relationships, filePath, classBody.startLine);
  }

  private parseInterfaceMembers(
    content: string,
    interfaceStartIndex: number,
    interfaceId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    errors: ParseError[]
  ): void {
    const interfaceBody = this.extractClassBody(content, interfaceStartIndex);
    if (!interfaceBody) return;

    // Parse method signatures
    this.parseMethods(interfaceBody.content, interfaceId, entities, relationships, filePath, interfaceBody.startLine);
  }

  private parseMethods(
    classContent: string,
    parentId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    baseLineNumber: number
  ): void {
    // Parse method declarations at class level using context-aware approach
    // This combines pattern matching with brace-level analysis to distinguish
    // method declarations from method calls inside method bodies
    
    // First pass: identify all method-like patterns
    const methodLikePattern = /(?:^|\n)\s*(?:@[A-Za-z_$][A-Za-z0-9_$]*(?:\([^)]*\))?\s*)*(?:(public|private|protected|static|final|abstract|synchronized|native|default)\s+)*([A-Za-z_$][A-Za-z0-9_$.<>,\[\]\s]*)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*(?:throws\s+[A-Za-z_$][A-Za-z0-9_$.<>,\s]+)?\s*([{;])/gm;
    
    let match;
    
    while ((match = methodLikePattern.exec(classContent)) !== null) {
      const fullMatch = match[0];
      const modifiersPart = match[1] || '';
      const extractedReturnType = match[2]?.trim();
      const methodName = match[3];
      const endChar = match[4]; // Either '{' or ';'
      
      // Skip if this looks like a class declaration or other non-method
      if (methodName === 'class' || methodName === 'interface' || methodName === 'enum') {
        continue;
      }
      
      // Check if this is at class level (not inside a method body)
      if (!this.isAtClassLevel(classContent, match.index)) {
        continue;
      }
      
      // Validate this is a proper method declaration
      if (!this.isValidMethodSignature(fullMatch, modifiersPart, extractedReturnType, methodName, endChar)) {
        continue;
      }
      
      const methodId = `${parentId}.${methodName}`;
      
      const beforeMatch = classContent.substring(0, match.index);
      const lineNumber = baseLineNumber + beforeMatch.split('\n').length - 1;
      
      const modifiers = this.extractModifiers(match[0]);
      const parameters = this.extractMethodParameters(match[0]);
      const returnType = this.extractReturnType(match[0]);
      const description = this.extractJavaDoc(classContent, match.index);
      const annotations = this.extractAnnotations(classContent, match.index);

      this.addEntity(entities, {
        id: methodId,
        type: 'method',
        name: methodName,
        qualified_name: methodId,
        description,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          parameters,
          return_type: returnType,
          annotations
        }
      });

      // Create contains relationship
      this.addRelationship(relationships, {
        id: `${parentId}_contains_${methodId}`,
        type: 'contains',
        source: parentId,
        target: methodId
      });
    }
  }

  private parseFields(
    classContent: string,
    parentId: string,
    entities: ParsedEntity[],
    relationships: ParsedRelationship[],
    filePath: string,
    baseLineNumber: number
  ): void {
    // Match field declarations
    const fieldRegex = /(?:(?:public|private|protected|static|final|volatile|transient)\s+)+([A-Za-z_$][A-Za-z0-9_$.<>,\[\]\s]*)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:=\s*[^;]+)?\s*;/g;
    
    let match;
    while ((match = fieldRegex.exec(classContent)) !== null) {
      const fieldType = match[1].trim();
      const fieldName = match[2];
      const fieldId = `${parentId}.${fieldName}`;
      
      const beforeMatch = classContent.substring(0, match.index);
      const lineNumber = baseLineNumber + beforeMatch.split('\n').length - 1;
      
      const modifiers = this.extractModifiers(match[0]);
      const annotations = this.extractAnnotations(classContent, match.index);

      this.addEntity(entities, {
        id: fieldId,
        type: 'field',
        name: fieldName,
        qualified_name: fieldId,
        source_file: filePath,
        start_line: lineNumber,
        modifiers,
        attributes: {
          field_type: fieldType,
          annotations
        }
      });

      // Create contains relationship
      this.addRelationship(relationships, {
        id: `${parentId}_contains_${fieldId}`,
        type: 'contains',
        source: parentId,
        target: fieldId
      });
    }
  }

  private extractClassBody(content: string, startIndex: number): { content: string; startLine: number } | null {
    let braceCount = 0;
    let inBody = false;
    let bodyStart = -1;
    let bodyEnd = -1;

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      
      if (char === '{') {
        if (!inBody) {
          inBody = true;
          bodyStart = i + 1;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inBody) {
          bodyEnd = i;
          break;
        }
      }
    }

    if (bodyStart === -1 || bodyEnd === -1) return null;

    const bodyContent = content.substring(bodyStart, bodyEnd);
    const beforeBody = content.substring(0, bodyStart);
    const startLine = beforeBody.split('\n').length;

    return { content: bodyContent, startLine };
  }

  private extractModifiers(declaration: string): string[] {
    const modifiers: string[] = [];
    const modifierWords = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized', 'native', 'volatile', 'transient'];
    
    for (const modifier of modifierWords) {
      if (new RegExp(`\\b${modifier}\\b`).test(declaration)) {
        modifiers.push(modifier);
      }
    }
    
    return modifiers;
  }

  private isAtClassLevel(classContent: string, matchIndex: number): boolean {
    // Check if this match is at class level (not inside a method body)
    const beforeMatch = classContent.substring(0, matchIndex);
    
    // Track brace nesting level, excluding strings and comments
    let braceLevel = 0;
    let inString = false;
    let inChar = false;
    let inComment = false;
    let inLineComment = false;
    let lastMethodOpenBrace = -1;
    
    for (let i = 0; i < beforeMatch.length; i++) {
      const char = beforeMatch[i];
      const nextChar = beforeMatch[i + 1];
      
      // Handle line comments
      if (char === '/' && nextChar === '/' && !inString && !inChar && !inComment) {
        inLineComment = true;
        continue;
      }
      if (inLineComment && char === '\n') {
        inLineComment = false;
        continue;
      }
      if (inLineComment) continue;
      
      // Handle block comments
      if (char === '/' && nextChar === '*' && !inString && !inChar) {
        inComment = true;
        i++; // Skip the *
        continue;
      }
      if (inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i++; // Skip the /
        continue;
      }
      if (inComment) continue;
      
      // Handle strings
      if (char === '"' && !inChar && !inComment && beforeMatch[i-1] !== '\\') {
        inString = !inString;
        continue;
      }
      if (char === "'" && !inString && !inComment && beforeMatch[i-1] !== '\\') {
        inChar = !inChar;
        continue;
      }
      if (inString || inChar) continue;
      
      // Count braces
      if (char === '{') {
        braceLevel++;
        // Track if this might be a method opening brace
        if (braceLevel === 1) {
          lastMethodOpenBrace = i;
        }
      } else if (char === '}') {
        braceLevel--;
      }
    }
    
    // We're at class level if brace level is 0 (not inside any method body)
    return braceLevel === 0;
  }

  private isValidMethodSignature(fullMatch: string, modifiersPart: string, returnType: string | undefined, methodName: string, endChar: string): boolean {
    // Skip obvious non-methods
    if (!methodName || methodName.length === 0) {
      return false;
    }
    
    // Must have either access modifiers, other modifiers, or be a constructor
    const hasAccessModifiers = modifiersPart && /^(public|private|protected)/.test(modifiersPart);
    const hasOtherModifiers = modifiersPart && /^(static|final|abstract|synchronized|native|default)/.test(modifiersPart);
    const isConstructor = /^[A-Z]/.test(methodName); // Constructors start with uppercase
    const hasReturnType = returnType && returnType.length > 0 && !/^\s*$/.test(returnType);
    
    // Valid if:
    // 1. Has access modifiers OR
    // 2. Has other modifiers OR  
    // 3. Is a constructor OR
    // 4. Has a clear return type and ends with { or ;
    return Boolean(hasAccessModifiers || hasOtherModifiers || isConstructor || (hasReturnType && (endChar === '{' || endChar === ';')));
  }

  private extractJavaDoc(content: string, position: number): string | undefined {
    // Look backwards for JavaDoc comment
    const beforePosition = content.substring(0, position);
    const lines = beforePosition.split('\n');
    
    // Look for /** ... */ pattern just before the declaration
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.endsWith('*/')) {
        // Found end of JavaDoc, now find the start
        let javadocLines: string[] = [];
        let foundStart = false;
        
        for (let j = i; j >= 0; j--) {
          const docLine = lines[j].trim();
          javadocLines.unshift(docLine);
          
          if (docLine.startsWith('/**')) {
            foundStart = true;
            break;
          }
        }
        
        if (foundStart) {
          return javadocLines.join('\n').replace(/\/\*\*|\*\/|\s*\*/g, '').trim();
        }
      } else if (line && !line.startsWith('*') && !line.startsWith('//') && line !== '') {
        // Found non-comment content, stop looking
        break;
      }
    }
    
    return undefined;
  }

  private extractMethodParameters(methodDeclaration: string): Array<{name: string; type: string; description?: string}> {
    const paramsMatch = methodDeclaration.match(/\(([^)]*)\)/);
    if (!paramsMatch || !paramsMatch[1].trim()) return [];
    
    const paramString = paramsMatch[1].trim();
    const params = paramString.split(',');
    
    return params.map(param => {
      const paramParts = param.trim().split(/\s+/);
      if (paramParts.length >= 2) {
        return {
          name: paramParts[paramParts.length - 1],
          type: paramParts.slice(0, -1).join(' '),
          description: undefined
        };
      }
      return {
        name: 'unknown',
        type: 'unknown',
        description: undefined
      };
    });
  }

  private extractReturnType(methodDeclaration: string): string {
    // Extract return type from method declaration
    const beforeParams = methodDeclaration.split('(')[0];
    const parts = beforeParams.trim().split(/\s+/);
    
    // Find the method name (last part before parentheses)
    const methodNameIndex = parts.length - 1;
    
    // Return type should be the part before the method name
    if (methodNameIndex > 0) {
      // Filter out modifiers
      const modifiers = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized', 'native'];
      const typeParts = parts.slice(0, methodNameIndex).filter(part => !modifiers.includes(part));
      
      return typeParts.length > 0 ? typeParts.join(' ') : 'void';
    }
    
    return 'void';
  }

  private resolveTypeReference(typeName: string, currentPackage: string, imports: Map<string, string>): string {
    // Clean up generic types and whitespace more carefully
    const cleanTypeName = this.extractBaseType(typeName.trim());
    
    // If it's already qualified (contains dots), return as is
    if (cleanTypeName.includes('.')) {
      return cleanTypeName;
    }
    
    // Check if it's in our imports
    if (imports.has(cleanTypeName)) {
      return imports.get(cleanTypeName)!;
    }
    
    // If it's a primitive type, return as is
    const primitives = ['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void'];
    if (primitives.includes(cleanTypeName)) {
      return cleanTypeName;
    }
    
    // Standard Java library types
    const javaLangTypes = ['String', 'Object', 'Exception', 'Error', 'Throwable', 'RuntimeException', 
                          'Class', 'Thread', 'Runnable', 'Comparable', 'CharSequence', 'Number',
                          'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short'];
    if (javaLangTypes.includes(cleanTypeName)) {
      return `java.lang.${cleanTypeName}`;
    }

    // Common framework types - create external references
    const frameworkPrefixes = {
      'Collection': 'java.util.Collection',
      'List': 'java.util.List',
      'Set': 'java.util.Set',
      'Map': 'java.util.Map',
      'ArrayList': 'java.util.ArrayList',
      'HashMap': 'java.util.HashMap',
      'Optional': 'java.util.Optional',
      'Stream': 'java.util.stream.Stream',
      'ServletOutputStream': 'javax.servlet.ServletOutputStream',
      'HttpServletResponseWrapper': 'javax.servlet.http.HttpServletResponseWrapper',
      'OncePerRequestFilter': 'org.springframework.web.filter.OncePerRequestFilter',
      'OAuth2TokenValidator': 'org.springframework.security.oauth2.core.OAuth2TokenValidator',
      'DefaultOAuth2UserService': 'org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService',
      'Converter': 'org.springframework.core.convert.converter.Converter',
      'ElasticsearchRepository': 'org.springframework.data.elasticsearch.repository.ElasticsearchRepository',
      'DomainEvent': 'org.springframework.data.domain.DomainEvent',
      'BaseEntity': 'org.springframework.data.jpa.domain.AbstractPersistable',
      'AggregateId': 'org.springframework.data.domain.AbstractAggregateRoot'
    };
    
    for (const [shortName, fullName] of Object.entries(frameworkPrefixes)) {
      if (cleanTypeName.includes(shortName)) {
        return fullName;
      }
    }
    
    // If not found in imports or standard types, assume it's in the current package
    return currentPackage ? `${currentPackage}.${cleanTypeName}` : cleanTypeName;
  }

  private isExceptionClass(className: string): boolean {
    return className.endsWith('Exception') || className.endsWith('Error');
  }

  private getPackageFromPath(filePath: string): string {
    const pathParts = path.dirname(filePath).split(path.sep);
    const srcIndex = pathParts.findIndex(part => part === 'src' || part === 'main' || part === 'java');
    
    if (srcIndex >= 0 && srcIndex < pathParts.length - 1) {
      return pathParts.slice(srcIndex + 1).join('.');
    }
    
    return 'default';
  }

  private createExternalTypeNodes(relationships: ParsedRelationship[], entities: ParsedEntity[]): void {
    const existingEntityIds = new Set(entities.map(e => e.id));
    const referencedTypes = new Set<string>();
    
    // Collect all referenced types from relationships
    relationships.forEach(rel => {
      referencedTypes.add(rel.source);
      referencedTypes.add(rel.target);
    });
    
    // Create placeholder nodes for external types
    referencedTypes.forEach(typeId => {
      if (!existingEntityIds.has(typeId) && this.isExternalType(typeId)) {
        const typeName = this.getSimpleNameFromId(typeId);
        const entityType = this.determineExternalEntityType(typeId);
        
        this.addEntity(entities, {
          id: typeId,
          type: entityType,
          name: typeName,
          qualified_name: typeId,
          description: `External ${entityType}: ${typeId}`,
          source_file: 'external',
          attributes: {
            external: true
          }
        });
      }
    });
  }

  private isExternalType(typeId: string): boolean {
    return typeId.startsWith('java.') || 
           typeId.startsWith('javax.') || 
           typeId.startsWith('org.springframework.') ||
           typeId.startsWith('org.hibernate.') ||
           typeId.includes('springframework') ||
           typeId.includes('apache') ||
           !typeId.includes('enterprise.gateway'); // Assuming this is the main package
  }

  private getSimpleNameFromId(qualifiedName: string): string {
    const lastDot = qualifiedName.lastIndexOf('.');
    return lastDot > 0 ? qualifiedName.substring(lastDot + 1) : qualifiedName;
  }

  private determineExternalEntityType(typeId: string): 'class' | 'interface' | 'exception' {
    const name = this.getSimpleNameFromId(typeId);
    
    if (name.endsWith('Exception') || name.endsWith('Error')) {
      return 'exception';
    }
    if (typeId.includes('interface') || name.startsWith('I') || 
        typeId.includes('OAuth2TokenValidator') || typeId.includes('Converter')) {
      return 'interface';
    }
    
    return 'class';
  }

  private extractBaseType(typeName: string): string {
    // Handle complex generic types by finding the base type before any <
    const angleIndex = typeName.indexOf('<');
    if (angleIndex > 0) {
      return typeName.substring(0, angleIndex).trim();
    }
    
    // Handle cases where there might be trailing > without opening <
    const closeAngleIndex = typeName.indexOf('>');
    if (closeAngleIndex > 0 && !typeName.includes('<')) {
      return typeName.substring(0, closeAngleIndex).trim();
    }
    
    return typeName.trim();
  }

  private extractAnnotations(content: string, entityPosition: number): AnnotationInfo[] {
    const beforeEntity = content.substring(0, entityPosition);
    const lines = beforeEntity.split('\n');
    const annotations: AnnotationInfo[] = [];
    
    // Scan backwards from entity to find annotations
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      if (line.startsWith('@')) {
        const match = line.match(/@([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]*)\))?/);
        if (match) {
          const annotationName = match[1];
          const parametersString = match[2];
          
          annotations.unshift({
            name: `@${annotationName}`,
            type: 'annotation',
            parameters: this.parseAnnotationParameters(parametersString),
            source_line: i + 1,
            framework: this.detectJavaFramework(annotationName),
            category: this.categorizeAnnotation(annotationName)
          });
        }
      } else if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
        // Stop on non-comment, non-annotation content
        break;
      }
    }
    
    return annotations;
  }

  private parseAnnotationParameters(parametersString?: string): Array<{name?: string; value: string; type?: string}> {
    if (!parametersString || !parametersString.trim()) {
      return [];
    }
    
    const params: Array<{name?: string; value: string; type?: string}> = [];
    const paramString = parametersString.trim();
    
    // Handle simple cases like @Annotation("value") or @Annotation(value = "something")
    if (paramString.includes('=')) {
      // Named parameters
      const assignments = paramString.split(',');
      for (const assignment of assignments) {
        const parts = assignment.split('=').map(p => p.trim());
        if (parts.length === 2) {
          params.push({
            name: parts[0],
            value: parts[1].replace(/^["']|["']$/g, ''), // Remove quotes
            type: 'string'
          });
        }
      }
    } else {
      // Single value parameter
      params.push({
        value: paramString.replace(/^["']|["']$/g, ''), // Remove quotes
        type: 'string'
      });
    }
    
    return params;
  }

  private detectJavaFramework(annotationName: string): string | undefined {
    const frameworkMap: Record<string, string> = {
      // Spring Framework
      'SpringBootApplication': 'Spring Boot',
      'RestController': 'Spring MVC',
      'Controller': 'Spring MVC',
      'Service': 'Spring',
      'Component': 'Spring',
      'Repository': 'Spring',
      'Autowired': 'Spring',
      'Value': 'Spring',
      'Configuration': 'Spring',
      'Bean': 'Spring',
      'RequestMapping': 'Spring MVC',
      'GetMapping': 'Spring MVC',
      'PostMapping': 'Spring MVC',
      'PutMapping': 'Spring MVC',
      'DeleteMapping': 'Spring MVC',
      'PathVariable': 'Spring MVC',
      'RequestParam': 'Spring MVC',
      'RequestBody': 'Spring MVC',
      'ResponseBody': 'Spring MVC',
      'CrossOrigin': 'Spring MVC',
      'Valid': 'Spring Validation',
      'Validated': 'Spring Validation',
      
      // JPA/Hibernate
      'Entity': 'JPA',
      'Table': 'JPA',
      'Id': 'JPA',
      'GeneratedValue': 'JPA',
      'Column': 'JPA',
      'JoinColumn': 'JPA',
      'OneToMany': 'JPA',
      'ManyToOne': 'JPA',
      'ManyToMany': 'JPA',
      'OneToOne': 'JPA',
      'Transactional': 'Spring Transaction',
      
      // Testing
      'Test': 'JUnit',
      'BeforeEach': 'JUnit',
      'AfterEach': 'JUnit',
      'BeforeAll': 'JUnit',
      'AfterAll': 'JUnit',
      'Mock': 'Mockito',
      'MockBean': 'Spring Test',
      'WebMvcTest': 'Spring Test',
      'SpringBootTest': 'Spring Test',
      'DataJpaTest': 'Spring Test',
      
      // Java Core
      'Override': 'Java Core',
      'Deprecated': 'Java Core',
      'SuppressWarnings': 'Java Core',
      'FunctionalInterface': 'Java Core',
      'SafeVarargs': 'Java Core',
      
      // Validation
      'NotNull': 'Bean Validation',
      'NotEmpty': 'Bean Validation',
      'NotBlank': 'Bean Validation',
      'Size': 'Bean Validation',
      'Min': 'Bean Validation',
      'Max': 'Bean Validation',
      'Email': 'Bean Validation',
      'Pattern': 'Bean Validation',
      
      // Security
      'PreAuthorize': 'Spring Security',
      'PostAuthorize': 'Spring Security',
      'Secured': 'Spring Security',
      'RolesAllowed': 'Spring Security',
      
      // Lombok
      'Data': 'Lombok',
      'Builder': 'Lombok',
      'AllArgsConstructor': 'Lombok',
      'NoArgsConstructor': 'Lombok',
      'RequiredArgsConstructor': 'Lombok',
      'Getter': 'Lombok',
      'Setter': 'Lombok',
      'ToString': 'Lombok',
      'EqualsAndHashCode': 'Lombok'
    };
    
    return frameworkMap[annotationName];
  }

  private categorizeAnnotation(annotationName: string): string | undefined {
    const categoryMap: Record<string, string> = {
      // Lifecycle
      'SpringBootApplication': 'lifecycle',
      'Configuration': 'lifecycle',
      'Bean': 'lifecycle',
      'BeforeEach': 'lifecycle',
      'AfterEach': 'lifecycle',
      'BeforeAll': 'lifecycle',
      'AfterAll': 'lifecycle',
      
      // Dependency Injection
      'Autowired': 'injection',
      'Value': 'injection',
      'Component': 'injection',
      'Service': 'injection',
      'Repository': 'injection',
      'Controller': 'injection',
      'RestController': 'injection',
      
      // Web/REST
      'RequestMapping': 'web',
      'GetMapping': 'web',
      'PostMapping': 'web',
      'PutMapping': 'web',
      'DeleteMapping': 'web',
      'PathVariable': 'web',
      'RequestParam': 'web',
      'RequestBody': 'web',
      'ResponseBody': 'web',
      'CrossOrigin': 'web',
      
      // Data/Persistence
      'Entity': 'persistence',
      'Table': 'persistence',
      'Id': 'persistence',
      'GeneratedValue': 'persistence',
      'Column': 'persistence',
      'JoinColumn': 'persistence',
      'OneToMany': 'persistence',
      'ManyToOne': 'persistence',
      'ManyToMany': 'persistence',
      'OneToOne': 'persistence',
      'Transactional': 'persistence',
      
      // Testing
      'Test': 'testing',
      'Mock': 'testing',
      'MockBean': 'testing',
      'WebMvcTest': 'testing',
      'SpringBootTest': 'testing',
      'DataJpaTest': 'testing',
      
      // Validation
      'Valid': 'validation',
      'Validated': 'validation',
      'NotNull': 'validation',
      'NotEmpty': 'validation',
      'NotBlank': 'validation',
      'Size': 'validation',
      'Min': 'validation',
      'Max': 'validation',
      'Email': 'validation',
      'Pattern': 'validation',
      
      // Security
      'PreAuthorize': 'security',
      'PostAuthorize': 'security',
      'Secured': 'security',
      'RolesAllowed': 'security',
      
      // Code Generation
      'Data': 'codegen',
      'Builder': 'codegen',
      'AllArgsConstructor': 'codegen',
      'NoArgsConstructor': 'codegen',
      'RequiredArgsConstructor': 'codegen',
      'Getter': 'codegen',
      'Setter': 'codegen',
      'ToString': 'codegen',
      'EqualsAndHashCode': 'codegen',
      
      // Language Features
      'Override': 'language',
      'Deprecated': 'language',
      'SuppressWarnings': 'language',
      'FunctionalInterface': 'language',
      'SafeVarargs': 'language'
    };
    
    return categoryMap[annotationName];
  }
}