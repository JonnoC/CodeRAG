import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Spring Boot framework detection module
 * Handles Spring Boot, Spring Security, and Spring Test annotations
 */
export class SpringBootFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Spring Boot';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Spring Boot Core
    this.frameworkMap.set('SpringBootApplication', 'Spring Boot');
    this.frameworkMap.set('RestController', 'Spring Boot');
    this.frameworkMap.set('Controller', 'Spring Boot');
    this.frameworkMap.set('Service', 'Spring Boot');
    this.frameworkMap.set('Component', 'Spring Boot');
    this.frameworkMap.set('Repository', 'Spring Boot');
    this.frameworkMap.set('Autowired', 'Spring Boot');
    this.frameworkMap.set('Value', 'Spring Boot');
    this.frameworkMap.set('Configuration', 'Spring Boot');
    this.frameworkMap.set('Bean', 'Spring Boot');
    this.frameworkMap.set('RequestMapping', 'Spring Boot');
    this.frameworkMap.set('GetMapping', 'Spring Boot');
    this.frameworkMap.set('PostMapping', 'Spring Boot');
    this.frameworkMap.set('PutMapping', 'Spring Boot');
    this.frameworkMap.set('DeleteMapping', 'Spring Boot');
    this.frameworkMap.set('PathVariable', 'Spring Boot');
    this.frameworkMap.set('RequestParam', 'Spring Boot');
    this.frameworkMap.set('RequestBody', 'Spring Boot');
    this.frameworkMap.set('ResponseBody', 'Spring Boot');
    this.frameworkMap.set('CrossOrigin', 'Spring Boot');
    this.frameworkMap.set('Valid', 'Spring Boot');
    this.frameworkMap.set('Validated', 'Spring Boot');
    this.frameworkMap.set('Transactional', 'Spring Boot');

    // Spring Security
    this.frameworkMap.set('PreAuthorize', 'Spring Security');
    this.frameworkMap.set('PostAuthorize', 'Spring Security');
    this.frameworkMap.set('Secured', 'Spring Security');
    this.frameworkMap.set('RolesAllowed', 'Spring Security');

    // Spring Test
    this.frameworkMap.set('MockBean', 'Spring Test');
    this.frameworkMap.set('WebMvcTest', 'Spring Test');
    this.frameworkMap.set('SpringBootTest', 'Spring Test');
    this.frameworkMap.set('DataJpaTest', 'Spring Test');
    this.frameworkMap.set('TestConfiguration', 'Spring Test');
    this.frameworkMap.set('MockMvcTest', 'Spring Test');
    this.frameworkMap.set('JsonTest', 'Spring Test');
    this.frameworkMap.set('JdbcTest', 'Spring Test');

    // Spring Boot Configuration
    this.frameworkMap.set('ConfigurationProperties', 'Spring Boot');
    this.frameworkMap.set('EnableConfigurationProperties', 'Spring Boot');
    this.frameworkMap.set('ConditionalOnProperty', 'Spring Boot');
    this.frameworkMap.set('ConditionalOnClass', 'Spring Boot');
    this.frameworkMap.set('ConditionalOnBean', 'Spring Boot');
    this.frameworkMap.set('ConditionalOnMissingBean', 'Spring Boot');

    // Spring Boot Caching
    this.frameworkMap.set('EnableCaching', 'Spring Boot');
    this.frameworkMap.set('Cacheable', 'Spring Boot');
    this.frameworkMap.set('CacheEvict', 'Spring Boot');
    this.frameworkMap.set('CachePut', 'Spring Boot');

    // Spring Boot Scheduling
    this.frameworkMap.set('EnableScheduling', 'Spring Boot');
    this.frameworkMap.set('Scheduled', 'Spring Boot');
    this.frameworkMap.set('Async', 'Spring Boot');
    this.frameworkMap.set('EnableAsync', 'Spring Boot');

    // Spring Boot JPA
    this.frameworkMap.set('EnableJpaRepositories', 'Spring Boot');
    this.frameworkMap.set('Query', 'Spring Boot');
    this.frameworkMap.set('Modifying', 'Spring Boot');

    // Spring Boot Actuator
    this.frameworkMap.set('Endpoint', 'Spring Boot Actuator');
    this.frameworkMap.set('ReadOperation', 'Spring Boot Actuator');
    this.frameworkMap.set('WriteOperation', 'Spring Boot Actuator');
    this.frameworkMap.set('DeleteOperation', 'Spring Boot Actuator');

    // Spring Cloud
    this.frameworkMap.set('EnableEurekaClient', 'Spring Cloud');
    this.frameworkMap.set('FeignClient', 'Spring Cloud');
    this.frameworkMap.set('LoadBalanced', 'Spring Cloud');
    this.frameworkMap.set('CircuitBreaker', 'Spring Cloud');

    // Categories
    this.categoryMap.set('SpringBootApplication', 'language');
    this.categoryMap.set('Autowired', 'injection');
    this.categoryMap.set('Value', 'injection');
    this.categoryMap.set('Component', 'injection');
    this.categoryMap.set('Service', 'injection');
    this.categoryMap.set('Repository', 'injection');
    this.categoryMap.set('Bean', 'injection');
    this.categoryMap.set('Configuration', 'injection');
    
    this.categoryMap.set('RestController', 'web');
    this.categoryMap.set('Controller', 'web');
    this.categoryMap.set('RequestMapping', 'web');
    this.categoryMap.set('GetMapping', 'web');
    this.categoryMap.set('PostMapping', 'web');
    this.categoryMap.set('PutMapping', 'web');
    this.categoryMap.set('DeleteMapping', 'web');
    this.categoryMap.set('PathVariable', 'web');
    this.categoryMap.set('RequestParam', 'web');
    this.categoryMap.set('RequestBody', 'web');
    this.categoryMap.set('ResponseBody', 'web');
    this.categoryMap.set('CrossOrigin', 'web');
    
    this.categoryMap.set('Transactional', 'persistence');
    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('Validated', 'validation');
    
    this.categoryMap.set('PreAuthorize', 'security');
    this.categoryMap.set('PostAuthorize', 'security');
    this.categoryMap.set('Secured', 'security');
    this.categoryMap.set('RolesAllowed', 'security');
    
    this.categoryMap.set('MockBean', 'testing');
    this.categoryMap.set('WebMvcTest', 'testing');
    this.categoryMap.set('SpringBootTest', 'testing');
    this.categoryMap.set('DataJpaTest', 'testing');
    this.categoryMap.set('TestConfiguration', 'testing');
    this.categoryMap.set('MockMvcTest', 'testing');
    this.categoryMap.set('JsonTest', 'testing');
    this.categoryMap.set('JdbcTest', 'testing');

    // Configuration categories
    this.categoryMap.set('ConfigurationProperties', 'injection');
    this.categoryMap.set('EnableConfigurationProperties', 'injection');
    this.categoryMap.set('ConditionalOnProperty', 'injection');
    this.categoryMap.set('ConditionalOnClass', 'injection');
    this.categoryMap.set('ConditionalOnBean', 'injection');
    this.categoryMap.set('ConditionalOnMissingBean', 'injection');

    // Performance categories
    this.categoryMap.set('EnableCaching', 'performance');
    this.categoryMap.set('Cacheable', 'performance');
    this.categoryMap.set('CacheEvict', 'performance');
    this.categoryMap.set('CachePut', 'performance');
    this.categoryMap.set('Scheduled', 'performance');
    this.categoryMap.set('Async', 'performance');
    this.categoryMap.set('EnableScheduling', 'performance');
    this.categoryMap.set('EnableAsync', 'performance');

    // Persistence categories
    this.categoryMap.set('EnableJpaRepositories', 'persistence');
    this.categoryMap.set('Query', 'persistence');
    this.categoryMap.set('Modifying', 'persistence');

    // Web/Infrastructure categories
    this.categoryMap.set('Endpoint', 'web');
    this.categoryMap.set('ReadOperation', 'web');
    this.categoryMap.set('WriteOperation', 'web');
    this.categoryMap.set('DeleteOperation', 'web');
    this.categoryMap.set('EnableEurekaClient', 'web');
    this.categoryMap.set('FeignClient', 'web');
    this.categoryMap.set('LoadBalanced', 'web');
    this.categoryMap.set('CircuitBreaker', 'web');
  }

  private initializeImportPatterns(): void {
    // Spring Boot Core - High confidence
    this.addImportPattern('org.springframework.boot.*', 95, 'Spring Boot');
    this.addImportPattern('org.springframework.boot.autoconfigure.*', 95, 'Spring Boot');
    this.addImportPattern('org.springframework.boot.context.*', 90, 'Spring Boot');
    
    // Spring Framework - Medium-high confidence (could be plain Spring)
    this.addImportPattern('org.springframework.web.bind.annotation.*', 85, 'Spring Boot');
    this.addImportPattern('org.springframework.stereotype.*', 80, 'Spring Boot');
    this.addImportPattern('org.springframework.beans.factory.annotation.*', 75, 'Spring Boot');
    this.addImportPattern('org.springframework.context.annotation.*', 75, 'Spring Boot');
    this.addImportPattern('org.springframework.web.*', 70, 'Spring Boot');
    this.addImportPattern('org.springframework.data.*', 70, 'Spring Boot');
    
    // Spring Security
    this.addImportPattern('org.springframework.security.*', 85, 'Spring Security');
    this.addImportPattern('org.springframework.security.access.prepost.*', 90, 'Spring Security');
    this.addImportPattern('org.springframework.security.config.annotation.*', 85, 'Spring Security');
    
    // Spring Test
    this.addImportPattern('org.springframework.boot.test.*', 95, 'Spring Test');
    this.addImportPattern('org.springframework.test.*', 80, 'Spring Test');
    
    // Spring Cloud
    this.addImportPattern('org.springframework.cloud.*', 95, 'Spring Cloud');
    this.addImportPattern('org.springframework.cloud.openfeign.*', 95, 'Spring Cloud');
    this.addImportPattern('org.springframework.cloud.netflix.*', 90, 'Spring Cloud');
    this.addImportPattern('org.springframework.cloud.circuitbreaker.*', 90, 'Spring Cloud');
    
    // Spring Boot Actuator
    this.addImportPattern('org.springframework.boot.actuate.*', 95, 'Spring Boot Actuator');
  }
}