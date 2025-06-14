import { BaseFrameworkDetector } from './FrameworkDetector.js';

export class JavaFrameworkDetector extends BaseFrameworkDetector {
  protected frameworkMap: Record<string, string> = {
    // Spring Boot
    'SpringBootApplication': 'Spring Boot',
    'RestController': 'Spring Boot',
    'Controller': 'Spring Boot',
    'Service': 'Spring Boot',
    'Component': 'Spring Boot',
    'Repository': 'Spring Boot',
    'Autowired': 'Spring Boot',
    'Value': 'Spring Boot',
    'Configuration': 'Spring Boot',
    'Bean': 'Spring Boot',
    'RequestMapping': 'Spring Boot',
    'GetMapping': 'Spring Boot',
    'PostMapping': 'Spring Boot',
    'PutMapping': 'Spring Boot',
    'DeleteMapping': 'Spring Boot',
    'PathVariable': 'Spring Boot',
    'RequestParam': 'Spring Boot',
    'RequestBody': 'Spring Boot',
    'ResponseBody': 'Spring Boot',
    'CrossOrigin': 'Spring Boot',
    'Valid': 'Spring Boot',
    'Validated': 'Spring Boot',
    'Transactional': 'Spring Boot',
    'PreAuthorize': 'Spring Security',
    'PostAuthorize': 'Spring Security',
    'Secured': 'Spring Security',
    'RolesAllowed': 'Spring Security',
    'MockBean': 'Spring Test',
    'WebMvcTest': 'Spring Test',
    'SpringBootTest': 'Spring Test',
    'DataJpaTest': 'Spring Test',
    
    // JPA
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
    
    // JUnit
    'Test': 'JUnit',
    'BeforeEach': 'JUnit',
    'AfterEach': 'JUnit',
    'BeforeAll': 'JUnit',
    'AfterAll': 'JUnit',
    
    // Mockito
    'Mock': 'Mockito',
    
    // Bean Validation
    'NotNull': 'Bean Validation',
    'NotEmpty': 'Bean Validation',
    'NotBlank': 'Bean Validation',
    'Size': 'Bean Validation',
    'Min': 'Bean Validation',
    'Max': 'Bean Validation',
    'Email': 'Bean Validation',
    'Pattern': 'Bean Validation',
    
    // Java Core
    'Override': 'Java',
    'Deprecated': 'Java',
    'SuppressWarnings': 'Java',
    'FunctionalInterface': 'Java',
    'SafeVarargs': 'Java',
    
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

  protected categoryMap: Record<string, string> = {
    // Lifecycle
    'BeforeEach': 'lifecycle',
    'AfterEach': 'lifecycle',
    'BeforeAll': 'lifecycle',
    'AfterAll': 'lifecycle',
    
    // Injection
    'Autowired': 'injection',
    'Value': 'injection',
    'Component': 'injection',
    'Service': 'injection',
    'Repository': 'injection',
    'Bean': 'injection',
    'Configuration': 'injection',
    
    // Web
    'RestController': 'web',
    'Controller': 'web',
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
    
    // Persistence
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
    
    // Language
    'Override': 'language',
    'Deprecated': 'language',
    'SuppressWarnings': 'language',
    'FunctionalInterface': 'language',
    'SafeVarargs': 'language',
    'SpringBootApplication': 'language'
  };
}