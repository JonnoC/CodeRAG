import { 
  BaseMethodCallExtractor, 
  ParsedMethodCall, 
  MethodCallExtractionResult 
} from '../base/MethodCallExtractor.js';

export class PythonMethodCallExtractor extends BaseMethodCallExtractor {
  private static readonly INSTANCE_CALL_PATTERN = /(\w+)\.(\w+)\s*\(/g;
  private static readonly STATIC_CALL_PATTERN = /([A-Z]\w*)\.(\w+)\s*\(/g;
  private static readonly CONSTRUCTOR_PATTERN = /([A-Z]\w*)\s*\(/g;
  private static readonly FUNCTION_CALL_PATTERN = /(?:^|[^\w.])(\w+)\s*\(/g;

  extractMethodCalls(
    methodBody: string,
    methodName: string,
    className?: string,
    packageName?: string,
    imports?: Map<string, string>
  ): MethodCallExtractionResult {
    const calls: ParsedMethodCall[] = [];
    const errors: string[] = [];

    try {
      const lines = methodBody.split('\n');

      lines.forEach((line, lineIndex) => {
        const cleanLine = this.removeCommentsAndStrings(line);
        
        // Extract instance method calls
        calls.push(...this.extractInstanceCalls(cleanLine, lineIndex + 1, packageName, imports));
        
        // Extract static/class method calls
        calls.push(...this.extractStaticCalls(cleanLine, lineIndex + 1, packageName, imports));
        
        // Extract constructor calls
        calls.push(...this.extractConstructorCalls(cleanLine, lineIndex + 1, packageName, imports));
        
        // Extract direct function calls
        calls.push(...this.extractFunctionCalls(cleanLine, lineIndex + 1, className, methodName));
      });

    } catch (error) {
      errors.push(`Error extracting method calls: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { calls, errors };
  }

  private extractInstanceCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(PythonMethodCallExtractor.INSTANCE_CALL_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const object = match[1];
      const method = match[2];
      
      if (this.isValidMethodCall(object, method)) {
        calls.push({
          targetMethod: this.resolveMethodCall(object, method, packageName, imports),
          callType: 'instance',
          lineNumber,
          callerObject: object
        });
      }
    }

    return calls;
  }

  private extractStaticCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(PythonMethodCallExtractor.STATIC_CALL_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const className = match[1];
      const method = match[2];
      
      if (this.isValidMethodCall(className, method)) {
        calls.push({
          targetMethod: this.resolveStaticMethodCall(className, method, packageName, imports),
          callType: 'static',
          lineNumber,
          callerObject: className
        });
      }
    }

    return calls;
  }

  private extractConstructorCalls(
    line: string, 
    lineNumber: number, 
    packageName?: string, 
    imports?: Map<string, string>
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(PythonMethodCallExtractor.CONSTRUCTOR_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const className = match[1];
      
      // Skip if this looks like a method call (preceded by a dot)
      const beforeMatch = line.substring(0, match.index);
      if (beforeMatch.endsWith('.')) {
        continue;
      }
      
      if (this.isValidConstructor(className)) {
        calls.push({
          targetMethod: this.resolveConstructorCall(className, packageName, imports),
          callType: 'constructor',
          lineNumber,
          callerObject: className
        });
      }
    }

    return calls;
  }

  private extractFunctionCalls(
    line: string, 
    lineNumber: number, 
    className?: string,
    currentMethodName?: string
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(PythonMethodCallExtractor.FUNCTION_CALL_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const functionName = match[1];
      
      // Skip the current method itself, built-ins, and common keywords
      if (functionName !== currentMethodName && this.isValidFunctionCall(functionName)) {
        const targetMethod = className ? `${className}.${functionName}` : functionName;
        calls.push({
          targetMethod,
          callType: 'function',
          lineNumber
        });
      }
    }

    return calls;
  }

  protected removeCommentsAndStrings(line: string): string {
    let result = line;
    
    // Remove string literals (simplified approach)
    result = result.replace(/"([^"\\]|\\.)*"/g, '""');
    result = result.replace(/'([^'\\]|\\.)*'/g, "''");
    result = result.replace(/"""[\s\S]*?"""/g, '""""""');
    result = result.replace(/'''[\s\S]*?'''/g, "''''''");
    
    // Remove line comments
    const commentIndex = result.indexOf('#');
    if (commentIndex !== -1) {
      result = result.substring(0, commentIndex);
    }
    
    return result;
  }

  protected isValidMethodCall(objectOrClass: string, method: string): boolean {
    // Skip common false positives
    const skipObjects = ['print', 'len', 'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple'];
    const skipMethods = ['append', 'extend', 'pop', 'remove', 'clear', 'copy', 'update', 'get', 'keys', 'values'];
    
    return !skipObjects.includes(objectOrClass) || !skipMethods.includes(method);
  }

  protected isValidFunctionCall(functionName: string): boolean {
    // Skip built-in functions and keywords
    const skipFunctions = [
      // Built-in functions
      'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sum', 'max', 'min', 
      'abs', 'all', 'any', 'sorted', 'reversed', 'open', 'input', 'type', 'isinstance', 
      'hasattr', 'getattr', 'setattr', 'delattr', 'dir', 'vars', 'globals', 'locals',
      // Keywords and control structures
      'if', 'for', 'while', 'try', 'except', 'finally', 'with', 'def', 'class', 'return', 
      'yield', 'raise', 'assert', 'import', 'from', 'pass', 'break', 'continue'
    ];
    
    return !skipFunctions.includes(functionName);
  }

  private isValidConstructor(className: string): boolean {
    // Skip built-in types and common classes
    const builtinTypes = [
      'str', 'int', 'float', 'bool', 'list', 'dict', 'set', 'tuple', 'object', 
      'Exception', 'ValueError', 'TypeError', 'KeyError', 'AttributeError', 
      'IndexError', 'RuntimeError', 'NotImplementedError'
    ];
    return !builtinTypes.includes(className);
  }

  protected resolveMethodCall(
    object: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Enhanced resolution for Python
    if (object === 'self') {
      return packageName ? `${packageName}.${method}` : method;
    }
    
    if (object === 'cls') {
      return packageName ? `${packageName}.${method}` : method;
    }
    
    // Check if object type is in imports
    const objectType = this.resolveObjectType(object, imports);
    return objectType ? `${objectType}.${method}` : `${object}.${method}`;
  }

  protected resolveStaticMethodCall(
    className: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Check imports first
    if (imports?.has(className)) {
      return `${imports.get(className)}.${method}`;
    }
    
    // Assume same module if not found in imports
    return packageName ? `${packageName}.${className}.${method}` : `${className}.${method}`;
  }

  protected resolveConstructorCall(
    className: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Check imports first
    if (imports?.has(className)) {
      return `${imports.get(className)}.__init__`;
    }
    
    // Assume same module if not found in imports
    return packageName ? `${packageName}.${className}.__init__` : `${className}.__init__`;
  }

  private resolveObjectType(object: string, imports?: Map<string, string>): string | null {
    // This is a simplified approach - in a full implementation,
    // we would track variable declarations and their types
    return null;
  }
}