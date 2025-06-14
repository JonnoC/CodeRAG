import { 
  BaseMethodCallExtractor, 
  ParsedMethodCall, 
  MethodCallExtractionResult 
} from '../base/MethodCallExtractor.js';

export class JavaMethodCallExtractor extends BaseMethodCallExtractor {
  private static readonly INSTANCE_CALL_PATTERN = /(\w+)\.(\w+)\s*\(/g;
  private static readonly STATIC_CALL_PATTERN = /([A-Z]\w*)\.(\w+)\s*\(/g;
  private static readonly CONSTRUCTOR_PATTERN = /new\s+([A-Z]\w*)\s*\(/g;
  private static readonly SUPER_CALL_PATTERN = /super\.(\w+)\s*\(/g;
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
        
        // Extract static method calls
        calls.push(...this.extractStaticCalls(cleanLine, lineIndex + 1, packageName, imports));
        
        // Extract constructor calls
        calls.push(...this.extractConstructorCalls(cleanLine, lineIndex + 1, packageName, imports));
        
        // Extract super method calls
        calls.push(...this.extractSuperCalls(cleanLine, lineIndex + 1, className));
        
        // Extract direct method calls (same class)
        calls.push(...this.extractDirectCalls(cleanLine, lineIndex + 1, className, methodName));
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
    const pattern = new RegExp(JavaMethodCallExtractor.INSTANCE_CALL_PATTERN.source, 'g');
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
    const pattern = new RegExp(JavaMethodCallExtractor.STATIC_CALL_PATTERN.source, 'g');
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
    const pattern = new RegExp(JavaMethodCallExtractor.CONSTRUCTOR_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const className = match[1];
      
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

  private extractSuperCalls(
    line: string, 
    lineNumber: number, 
    className?: string
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(JavaMethodCallExtractor.SUPER_CALL_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const method = match[1];
      
      calls.push({
        targetMethod: `super.${method}`,
        callType: 'super',
        lineNumber,
        callerObject: 'super'
      });
    }

    return calls;
  }

  private extractDirectCalls(
    line: string, 
    lineNumber: number, 
    className?: string,
    currentMethodName?: string
  ): ParsedMethodCall[] {
    const calls: ParsedMethodCall[] = [];
    const pattern = new RegExp(JavaMethodCallExtractor.FUNCTION_CALL_PATTERN.source, 'g');
    let match;

    while ((match = pattern.exec(line)) !== null) {
      const functionName = match[1];
      
      // Skip the current method itself and common keywords
      if (functionName !== currentMethodName && this.isValidDirectCall(functionName)) {
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
    
    // Remove string literals
    result = result.replace(/"([^"\\]|\\.)*"/g, '""');
    result = result.replace(/'([^'\\]|\\.)*'/g, "''");
    
    // Remove line comments
    const commentIndex = result.indexOf('//');
    if (commentIndex !== -1) {
      result = result.substring(0, commentIndex);
    }
    
    return result;
  }

  protected isValidMethodCall(objectOrClass: string, method: string): boolean {
    // Skip common false positives
    const skipObjects = ['System', 'Logger', 'log', 'logger'];
    const skipMethods = ['out', 'err', 'println', 'print', 'debug', 'info', 'warn', 'error'];
    
    return !skipObjects.includes(objectOrClass) || !skipMethods.includes(method);
  }

  private isValidConstructor(className: string): boolean {
    // Skip common built-in types
    const builtinTypes = ['String', 'Integer', 'Boolean', 'Double', 'Float', 'Long', 'Object'];
    return !builtinTypes.includes(className);
  }

  private isValidDirectCall(functionName: string): boolean {
    // Skip common keywords and built-in functions
    const skipFunctions = ['if', 'for', 'while', 'switch', 'try', 'catch', 'finally', 'return', 'throw', 'assert'];
    return !skipFunctions.includes(functionName);
  }

  protected resolveMethodCall(
    object: string, 
    method: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Enhanced resolution for Java
    if (object === 'this') {
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
    
    // Check for standard Java library classes
    const javaLangTypes = ['String', 'Object', 'Math', 'System', 'Thread', 'Class'];
    if (javaLangTypes.includes(className)) {
      return `java.lang.${className}.${method}`;
    }
    
    // Assume same package if not found in imports
    return packageName ? `${packageName}.${className}.${method}` : `${className}.${method}`;
  }

  protected resolveConstructorCall(
    className: string, 
    packageName?: string, 
    imports?: Map<string, string>
  ): string {
    // Check imports first
    if (imports?.has(className)) {
      return `${imports.get(className)}.<init>`;
    }
    
    // Check for standard Java library classes
    const javaLangTypes = ['String', 'Object', 'Exception', 'RuntimeException', 'IllegalArgumentException'];
    if (javaLangTypes.includes(className)) {
      return `java.lang.${className}.<init>`;
    }
    
    // Assume same package if not found in imports
    return packageName ? `${packageName}.${className}.<init>` : `${className}.<init>`;
  }

  private resolveObjectType(object: string, imports?: Map<string, string>): string | null {
    // This is a simplified approach - in a full implementation,
    // we would track variable declarations and their types
    return null;
  }
}