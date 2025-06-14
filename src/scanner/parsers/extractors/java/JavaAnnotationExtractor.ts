import { BaseAnnotationExtractor, AnnotationExtractionResult, ParsedAnnotationParameter } from '../base/AnnotationExtractor.js';
import { AnnotationInfo } from '../../../../types.js';

/**
 * Java-specific annotation extraction
 */
export class JavaAnnotationExtractor extends BaseAnnotationExtractor {

  extractAnnotations(
    content: string,
    entityPosition: number
  ): AnnotationExtractionResult {
    const errors: string[] = [];
    const annotations: AnnotationInfo[] = [];

    try {
      const beforeEntity = content.substring(0, entityPosition);
      const lines = beforeEntity.split('\n');
      
      // Scan backwards from entity to find annotations
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        
        if (this.isAnnotationLine(line)) {
          const match = line.match(/@([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]*)\))?/);
          if (match) {
            const annotationName = match[1];
            const parametersString = match[2];
            
            annotations.unshift({
              name: `@${annotationName}`,
              type: 'annotation',
              parameters: this.parseAnnotationParameters(parametersString),
              source_line: i + 1,
              framework: this.detectFramework(annotationName),
              category: this.categorizeAnnotation(annotationName)
            });
          }
        } else if (line && !this.isCommentLine(line)) {
          // Stop on non-comment, non-annotation content
          break;
        }
      }
    } catch (error) {
      errors.push(`Error extracting Java annotations: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { annotations, errors };
  }

  parseAnnotationParameters(parametersString?: string): ParsedAnnotationParameter[] {
    if (!parametersString || !parametersString.trim()) {
      return [];
    }
    
    const params: ParsedAnnotationParameter[] = [];
    const paramString = parametersString.trim();
    
    // Handle simple cases like @Annotation("value") or @Annotation(value = "something")
    if (paramString.includes('=')) {
      // Named parameters
      const assignments = this.splitParameters(paramString);
      for (const assignment of assignments) {
        const parts = assignment.split('=').map(p => p.trim());
        if (parts.length === 2) {
          params.push({
            name: parts[0],
            value: this.removeQuotes(parts[1]),
            type: this.inferParameterType(parts[1])
          });
        }
      }
    } else {
      // Single value parameter
      params.push({
        value: this.removeQuotes(paramString),
        type: this.inferParameterType(paramString)
      });
    }
    
    return params;
  }

  detectFramework(annotationName: string): string | undefined {
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

  categorizeAnnotation(annotationName: string): string | undefined {
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

  protected isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
  }

  protected isAnnotationLine(line: string): boolean {
    return line.trim().startsWith('@');
  }
}