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

export class PythonContentExtractor extends BaseContentExtractor {
  private static readonly CLASS_PATTERN = /^(\s*)class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(([^)]*)\))?\s*:/gm;
  private static readonly FUNCTION_PATTERN = /^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/gm;
  private static readonly METHOD_PATTERN = /^\s+def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?\s*:/gm;
  private static readonly ATTRIBUTE_PATTERN = /^\s+([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*([^#\n]+)/gm;
  private static readonly IMPORT_PATTERN = /^(?:from\s+([^\s]+)\s+)?import\s+([^\n#]+)/gm;

  extractContent(content: string, filePath: string): ContentExtractionResult {
    const result: ContentExtractionResult = {
      moduleName: this.getModuleFromPath(filePath),
      imports: this.extractImports(content),
      classes: this.extractClasses(content),
      interfaces: [], // Python doesn't have interfaces, but can use ABC
      enums: this.extractEnums(content),
      functions: this.extractFunctions(content),
      fields: this.extractModuleLevelAttributes(content),
      exceptions: []
    };

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
    PythonContentExtractor.IMPORT_PATTERN.lastIndex = 0;

    while ((match = PythonContentExtractor.IMPORT_PATTERN.exec(content)) !== null) {
      const [, fromModule, importItems] = match;
      
      if (fromModule) {
        // from module import items
        const items = importItems.split(',').map(item => {
          const trimmed = item.trim();
          const asMatch = trimmed.match(/^(.+?)\s+as\s+(.+)$/);
          return asMatch ? asMatch[1].trim() : trimmed;
        });
        
        imports.push({
          module: fromModule,
          items,
          isDefault: false
        });
      } else {
        // import module
        const modules = importItems.split(',').map(item => {
          const trimmed = item.trim();
          const asMatch = trimmed.match(/^(.+?)\s+as\s+(.+)$/);
          return {
            module: asMatch ? asMatch[1].trim() : trimmed,
            alias: asMatch ? asMatch[2].trim() : undefined
          };
        });
        
        for (const mod of modules) {
          imports.push({
            module: mod.module,
            alias: mod.alias,
            isDefault: false
          });
        }
      }
    }

    return imports;
  }

  private extractClasses(content: string): ParsedClass[] {
    const classes: ParsedClass[] = [];
    let match;
    PythonContentExtractor.CLASS_PATTERN.lastIndex = 0;

    while ((match = PythonContentExtractor.CLASS_PATTERN.exec(content)) !== null) {
      const [fullMatch, indentation, className, inheritance] = match;
      const lineNumber = this.findLineNumber(content, fullMatch);
      
      const parsedClass: ParsedClass = {
        name: className,
        modifiers: this.extractPythonModifiers(className),
        startLine: lineNumber,
        endLine: lineNumber
      };

      if (inheritance) {
        parsedClass.extends = inheritance.split(',').map(parent => parent.trim());
      }

      classes.push(parsedClass);
    }

    return classes;
  }

  private extractFunctions(content: string): ParsedMethod[] {
    const functions: ParsedMethod[] = [];
    let match;
    PythonContentExtractor.FUNCTION_PATTERN.lastIndex = 0;

    while ((match = PythonContentExtractor.FUNCTION_PATTERN.exec(content)) !== null) {
      const [fullMatch, functionName, paramString, returnType] = match;
      const lineNumber = this.findLineNumber(content, fullMatch);
      
      functions.push({
        name: functionName,
        parameters: this.parseParameters(paramString || ''),
        returnType: returnType?.trim(),
        modifiers: this.extractPythonModifiers(functionName),
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    // Also extract methods within classes
    PythonContentExtractor.METHOD_PATTERN.lastIndex = 0;
    while ((match = PythonContentExtractor.METHOD_PATTERN.exec(content)) !== null) {
      const [fullMatch, methodName, paramString, returnType] = match;
      const lineNumber = this.findLineNumber(content, fullMatch);
      
      functions.push({
        name: methodName,
        parameters: this.parseParameters(paramString || ''),
        returnType: returnType?.trim(),
        modifiers: this.extractPythonModifiers(methodName),
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    return functions;
  }

  private extractModuleLevelAttributes(content: string): ParsedField[] {
    const fields: ParsedField[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip indented lines (class/function level)
      if (line.match(/^\s+/)) continue;
      
      // Match module-level assignments
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*[:=]\s*(.+)/);
      if (match) {
        const [, name, value] = match;
        
        fields.push({
          name,
          defaultValue: value.trim(),
          type: this.inferPythonType(value.trim()),
          modifiers: this.extractPythonModifiers(name),
          startLine: i + 1,
          endLine: i + 1
        });
      }
    }

    return fields;
  }

  private extractEnums(content: string): ParsedEnum[] {
    const enums: ParsedEnum[] = [];
    
    // Look for Enum classes
    const enumClassPattern = /class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*Enum\s*\)\s*:([\s\S]*?)(?=\n\S|\n*$)/g;
    let match;

    while ((match = enumClassPattern.exec(content)) !== null) {
      const [, enumName, enumBody] = match;
      const lineNumber = this.findLineNumber(content, enumName);
      
      // Extract enum values
      const values = this.extractEnumValues(enumBody);
      
      enums.push({
        name: enumName,
        values,
        modifiers: [],
        startLine: lineNumber,
        endLine: lineNumber
      });
    }

    return enums;
  }

  private extractEnumValues(enumBody: string): string[] {
    const values: string[] = [];
    const lines = enumBody.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
      if (match) {
        values.push(match[1]);
      }
    }
    
    return values;
  }

  private extractPythonModifiers(name: string): string[] {
    const modifiers: string[] = [];
    
    if (name.startsWith('__') && name.endsWith('__')) {
      modifiers.push('dunder'); // Double underscore methods
    } else if (name.startsWith('_')) {
      modifiers.push('private');
    }
    
    return modifiers;
  }

  private inferPythonType(value: string): string | undefined {
    value = value.trim();
    
    if (value.match(/^['"].*['"]$/)) return 'str';
    if (value.match(/^\d+$/)) return 'int';
    if (value.match(/^\d*\.\d+$/)) return 'float';
    if (value === 'True' || value === 'False') return 'bool';
    if (value === 'None') return 'None';
    if (value.startsWith('[') && value.endsWith(']')) return 'list';
    if (value.startsWith('{') && value.endsWith('}')) return 'dict';
    if (value.startsWith('(') && value.endsWith(')')) return 'tuple';
    
    return undefined;
  }

  protected parseParameter(param: string): ParsedParameter | null {
    const trimmed = param.trim();
    if (!trimmed) return null;

    // Handle different Python parameter formats
    let name = trimmed;
    let type: string | undefined;
    let defaultValue: string | undefined;
    let isOptional = false;

    // Handle default values: name=value
    const defaultMatch = trimmed.match(/^([^=]+)=(.+)$/);
    if (defaultMatch) {
      name = defaultMatch[1].trim();
      defaultValue = defaultMatch[2].trim();
      isOptional = true;
    }

    // Handle type annotations: name: type
    const typeMatch = name.match(/^([^:]+):\s*(.+)$/);
    if (typeMatch) {
      name = typeMatch[1].trim();
      type = typeMatch[2].trim();
    }

    // Skip special parameters
    if (name === 'self' || name === 'cls' || name.startsWith('*')) {
      return {
        name,
        type,
        defaultValue,
        isOptional
      };
    }

    return {
      name,
      type,
      defaultValue,
      isOptional
    };
  }

  private getModuleFromPath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const parsed = path.parse(normalized);
    
    if (parsed.name === '__init__') {
      // For __init__.py files, use the directory name
      return path.basename(parsed.dir);
    }
    
    return parsed.name;
  }
}