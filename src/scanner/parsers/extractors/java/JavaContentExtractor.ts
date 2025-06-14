import * as path from 'path';
import { 
  BaseContentExtractor, 
  ContentExtractionResult, 
  ParsedClass, 
  ParsedInterface, 
  ParsedMethod, 
  ParsedField, 
  ParsedEnum, 
  ParsedImport,
  ParsedParameter 
} from '../base/ContentExtractor.js';

export class JavaContentExtractor extends BaseContentExtractor {
  private static readonly PACKAGE_PATTERN = /^\s*package\s+([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*;/m;
  private static readonly IMPORT_PATTERN = /^\s*import\s+(?:static\s+)?([a-zA-Z_$][a-zA-Z0-9_$.]*(?:\.\*)?);/gm;
  private static readonly CLASS_PATTERN = /(?:(?:public|private|protected|static|final|abstract)\s+)*class\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends\s+([^{]+?))?\s*(?:implements\s+([^{]+?))?\s*\{/g;
  private static readonly INTERFACE_PATTERN = /(?:(?:public|private|protected|static)\s+)*interface\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:extends\s+([^{]+?))?\s*\{/g;
  private static readonly ENUM_PATTERN = /(?:(?:public|private|protected|static)\s+)*enum\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\{([^}]+)\}/g;
  private static readonly METHOD_PATTERN = /(?:(?:public|private|protected|static|final|abstract|synchronized|native|strictfp)\s+)*(?:(<[^>]+>\s+))?([A-Za-z_$][A-Za-z0-9_$.<>,\[\]\s]*)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([^)]*)\)\s*(?:throws\s+([^{]+?))?\s*[{;]/g;
  private static readonly FIELD_PATTERN = /(?:(?:public|private|protected|static|final|volatile|transient)\s+)+([A-Za-z_$][A-Za-z0-9_$.<>,\[\]\s]*)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:=\s*[^;]+)?\s*;/g;

  extractContent(content: string, filePath: string): ContentExtractionResult {
    const result: ContentExtractionResult = {
      imports: this.extractImports(content),
      classes: this.extractClasses(content),
      interfaces: this.extractInterfaces(content),
      enums: this.extractEnums(content),
      functions: this.extractMethods(content),
      fields: this.extractFields(content),
      exceptions: []
    };

    // Extract package name
    const packageMatch = content.match(JavaContentExtractor.PACKAGE_PATTERN);
    if (packageMatch) {
      result.packageName = packageMatch[1];
    } else {
      result.packageName = this.getPackageFromPath(filePath);
    }

    // Separate exceptions from regular classes
    result.exceptions = result.classes.filter(cls => 
      cls.extends?.some(parent => parent.includes('Exception') || parent.includes('Error')) ||
      cls.name.endsWith('Exception') || cls.name.endsWith('Error')
    );

    return result;
  }

  private extractImports(content: string): ParsedImport[] {
    const imports: ParsedImport[] = [];
    let match;
    JavaContentExtractor.IMPORT_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.IMPORT_PATTERN.exec(content)) !== null) {
      const fullImport = match[1];
      const isWildcard = fullImport.endsWith('.*');
      
      imports.push({
        module: isWildcard ? fullImport.slice(0, -2) : fullImport,
        items: isWildcard ? ['*'] : [fullImport.split('.').pop() || fullImport],
        isDefault: false
      });
    }

    return imports;
  }

  private extractClasses(content: string): ParsedClass[] {
    const classes: ParsedClass[] = [];
    let match;
    JavaContentExtractor.CLASS_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.CLASS_PATTERN.exec(content)) !== null) {
      const [fullMatch, className, extendsClause, implementsClause] = match;
      const lineNumber = this.findLineNumber(content, className);
      
      const parsedClass: ParsedClass = {
        name: className,
        modifiers: this.extractModifiersFromMatch(fullMatch),
        startLine: lineNumber,
        endLine: lineNumber
      };

      if (extendsClause) {
        parsedClass.extends = [extendsClause.trim()];
      }

      if (implementsClause) {
        parsedClass.implements = implementsClause.split(',').map(i => i.trim());
      }

      classes.push(parsedClass);
    }

    return classes;
  }

  private extractInterfaces(content: string): ParsedInterface[] {
    const interfaces: ParsedInterface[] = [];
    let match;
    JavaContentExtractor.INTERFACE_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.INTERFACE_PATTERN.exec(content)) !== null) {
      const [fullMatch, interfaceName, extendsClause] = match;
      const lineNumber = this.findLineNumber(content, interfaceName);
      
      const parsedInterface: ParsedInterface = {
        name: interfaceName,
        modifiers: this.extractModifiersFromMatch(fullMatch),
        startLine: lineNumber,
        endLine: lineNumber
      };

      if (extendsClause) {
        parsedInterface.extends = extendsClause.split(',').map(i => i.trim());
      }

      interfaces.push(parsedInterface);
    }

    return interfaces;
  }

  private extractEnums(content: string): ParsedEnum[] {
    const enums: ParsedEnum[] = [];
    let match;
    JavaContentExtractor.ENUM_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.ENUM_PATTERN.exec(content)) !== null) {
      const [fullMatch, enumName, enumBody] = match;
      const lineNumber = this.findLineNumber(content, enumName);
      
      // Extract enum values
      const values = enumBody.split(',').map(v => v.trim().split(/\s/)[0]).filter(v => v);
      
      enums.push({
        name: enumName,
        values,
        modifiers: this.extractModifiersFromMatch(fullMatch),
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    return enums;
  }

  private extractMethods(content: string): ParsedMethod[] {
    const methods: ParsedMethod[] = [];
    let match;
    JavaContentExtractor.METHOD_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.METHOD_PATTERN.exec(content)) !== null) {
      const [fullMatch, genericTypes, returnType, methodName, paramString, throwsClause] = match;
      const lineNumber = this.findLineNumber(content, methodName);
      
      methods.push({
        name: methodName,
        parameters: this.parseParameters(paramString || ''),
        returnType: returnType?.trim(),
        modifiers: this.extractModifiersFromMatch(fullMatch),
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    return methods;
  }

  private extractFields(content: string): ParsedField[] {
    const fields: ParsedField[] = [];
    let match;
    JavaContentExtractor.FIELD_PATTERN.lastIndex = 0;

    while ((match = JavaContentExtractor.FIELD_PATTERN.exec(content)) !== null) {
      const [fullMatch, fieldType, fieldName] = match;
      const lineNumber = this.findLineNumber(content, fieldName);
      
      fields.push({
        name: fieldName,
        type: fieldType?.trim(),
        modifiers: this.extractModifiersFromMatch(fullMatch),
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    return fields;
  }

  private extractModifiersFromMatch(match: string): string[] {
    const modifierKeywords = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized', 'native', 'strictfp', 'volatile', 'transient'];
    const words = match.split(/\s+/);
    return words.filter(word => modifierKeywords.includes(word));
  }

  protected parseParameter(param: string): ParsedParameter | null {
    const trimmed = param.trim();
    if (!trimmed) return null;

    // Handle Java parameter format: "Type name" or "final Type name"
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) return null;

    const name = parts[parts.length - 1];
    const type = parts.slice(0, -1).filter(p => !['final'].includes(p)).join(' ');

    return {
      name,
      type: type || undefined,
      isOptional: false
    };
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