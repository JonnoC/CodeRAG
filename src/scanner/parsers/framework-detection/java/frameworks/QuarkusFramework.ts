import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Quarkus framework detection module
 * Handles supersonic, subatomic Java for cloud-native and Kubernetes
 */
export class QuarkusFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Quarkus';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Quarkus Core Annotations
    this.frameworkMap.set('QuarkusMain', 'Quarkus');
    this.frameworkMap.set('QuarkusApplication', 'Quarkus');
    this.frameworkMap.set('ApplicationScoped', 'Quarkus');
    this.frameworkMap.set('Singleton', 'Quarkus');
    this.frameworkMap.set('RequestScoped', 'Quarkus');
    this.frameworkMap.set('Dependent', 'Quarkus');

    // Quarkus REST (JAX-RS)
    this.frameworkMap.set('Path', 'Quarkus');
    this.frameworkMap.set('GET', 'Quarkus');
    this.frameworkMap.set('POST', 'Quarkus');
    this.frameworkMap.set('PUT', 'Quarkus');
    this.frameworkMap.set('DELETE', 'Quarkus');
    this.frameworkMap.set('PATCH', 'Quarkus');
    this.frameworkMap.set('Produces', 'Quarkus');
    this.frameworkMap.set('Consumes', 'Quarkus');
    this.frameworkMap.set('PathParam', 'Quarkus');
    this.frameworkMap.set('QueryParam', 'Quarkus');
    this.frameworkMap.set('HeaderParam', 'Quarkus');
    this.frameworkMap.set('FormParam', 'Quarkus');

    // Quarkus Configuration
    this.frameworkMap.set('ConfigProperty', 'Quarkus');
    this.frameworkMap.set('ConfigMapping', 'Quarkus');
    this.frameworkMap.set('ConfigRoot', 'Quarkus');

    // Quarkus Injection
    this.frameworkMap.set('Inject', 'Quarkus');
    this.frameworkMap.set('Named', 'Quarkus');
    this.frameworkMap.set('Produces', 'Quarkus');
    this.frameworkMap.set('Alternative', 'Quarkus');
    this.frameworkMap.set('Priority', 'Quarkus');

    // Quarkus Reactive
    this.frameworkMap.set('Blocking', 'Quarkus');
    this.frameworkMap.set('NonBlocking', 'Quarkus');
    this.frameworkMap.set('RunOnVirtualThread', 'Quarkus');

    // Quarkus Security
    this.frameworkMap.set('RolesAllowed', 'Quarkus Security');
    this.frameworkMap.set('PermitAll', 'Quarkus Security');
    this.frameworkMap.set('DenyAll', 'Quarkus Security');
    this.frameworkMap.set('Authenticated', 'Quarkus Security');

    // Quarkus Persistence
    this.frameworkMap.set('PersistenceContext', 'Quarkus');
    this.frameworkMap.set('Transactional', 'Quarkus');

    // Quarkus Scheduler
    this.frameworkMap.set('Scheduled', 'Quarkus');

    // Quarkus Events
    this.frameworkMap.set('Observes', 'Quarkus');
    this.frameworkMap.set('ObservesAsync', 'Quarkus');

    // Quarkus Testing
    this.frameworkMap.set('QuarkusTest', 'Quarkus Test');
    this.frameworkMap.set('NativeImageTest', 'Quarkus Test');
    this.frameworkMap.set('TestProfile', 'Quarkus Test');
    this.frameworkMap.set('QuarkusTestResource', 'Quarkus Test');
    this.frameworkMap.set('QuarkusIntegrationTest', 'Quarkus Test');

    // Quarkus Health
    this.frameworkMap.set('Health', 'Quarkus Health');
    this.frameworkMap.set('Liveness', 'Quarkus Health');
    this.frameworkMap.set('Readiness', 'Quarkus Health');

    // Quarkus Metrics
    this.frameworkMap.set('Counted', 'Quarkus Metrics');
    this.frameworkMap.set('Timed', 'Quarkus Metrics');
    this.frameworkMap.set('Gauge', 'Quarkus Metrics');
    this.frameworkMap.set('Metered', 'Quarkus Metrics');

    // Quarkus OpenAPI
    this.frameworkMap.set('Operation', 'Quarkus OpenAPI');
    this.frameworkMap.set('APIResponse', 'Quarkus OpenAPI');
    this.frameworkMap.set('Parameter', 'Quarkus OpenAPI');
    this.frameworkMap.set('Schema', 'Quarkus OpenAPI');

    // Categories
    this.categoryMap.set('QuarkusMain', 'language');
    this.categoryMap.set('QuarkusApplication', 'language');
    
    this.categoryMap.set('ApplicationScoped', 'injection');
    this.categoryMap.set('Singleton', 'injection');
    this.categoryMap.set('RequestScoped', 'injection');
    this.categoryMap.set('Dependent', 'injection');
    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Named', 'injection');
    this.categoryMap.set('Produces', 'injection');
    this.categoryMap.set('Alternative', 'injection');
    this.categoryMap.set('Priority', 'injection');

    this.categoryMap.set('Path', 'web');
    this.categoryMap.set('GET', 'web');
    this.categoryMap.set('POST', 'web');
    this.categoryMap.set('PUT', 'web');
    this.categoryMap.set('DELETE', 'web');
    this.categoryMap.set('PATCH', 'web');
    this.categoryMap.set('Produces', 'web');
    this.categoryMap.set('Consumes', 'web');
    this.categoryMap.set('PathParam', 'web');
    this.categoryMap.set('QueryParam', 'web');
    this.categoryMap.set('HeaderParam', 'web');
    this.categoryMap.set('FormParam', 'web');

    this.categoryMap.set('ConfigProperty', 'configuration');
    this.categoryMap.set('ConfigMapping', 'configuration');
    this.categoryMap.set('ConfigRoot', 'configuration');

    this.categoryMap.set('Blocking', 'performance');
    this.categoryMap.set('NonBlocking', 'performance');
    this.categoryMap.set('RunOnVirtualThread', 'performance');
    this.categoryMap.set('Scheduled', 'performance');

    this.categoryMap.set('RolesAllowed', 'security');
    this.categoryMap.set('PermitAll', 'security');
    this.categoryMap.set('DenyAll', 'security');
    this.categoryMap.set('Authenticated', 'security');

    this.categoryMap.set('PersistenceContext', 'persistence');
    this.categoryMap.set('Transactional', 'persistence');

    this.categoryMap.set('Observes', 'events');
    this.categoryMap.set('ObservesAsync', 'events');

    this.categoryMap.set('QuarkusTest', 'testing');
    this.categoryMap.set('NativeImageTest', 'testing');
    this.categoryMap.set('TestProfile', 'testing');
    this.categoryMap.set('QuarkusTestResource', 'testing');
    this.categoryMap.set('QuarkusIntegrationTest', 'testing');

    this.categoryMap.set('Health', 'monitoring');
    this.categoryMap.set('Liveness', 'monitoring');
    this.categoryMap.set('Readiness', 'monitoring');
    this.categoryMap.set('Counted', 'monitoring');
    this.categoryMap.set('Timed', 'monitoring');
    this.categoryMap.set('Gauge', 'monitoring');
    this.categoryMap.set('Metered', 'monitoring');

    this.categoryMap.set('Operation', 'documentation');
    this.categoryMap.set('APIResponse', 'documentation');
    this.categoryMap.set('Parameter', 'documentation');
    this.categoryMap.set('Schema', 'documentation');
  }

  private initializeImportPatterns(): void {
    // Quarkus Core - High confidence
    this.addImportPattern('io.quarkus.*', 95, 'Quarkus');
    this.addImportPattern('io.quarkus.runtime.*', 95, 'Quarkus');
    this.addImportPattern('io.quarkus.arc.*', 90, 'Quarkus');

    // Quarkus REST/JAX-RS
    this.addImportPattern('jakarta.ws.rs.*', 85, 'Quarkus');
    this.addImportPattern('javax.ws.rs.*', 80, 'Quarkus');

    // Quarkus Configuration
    this.addImportPattern('io.smallrye.config.*', 85, 'Quarkus');
    this.addImportPattern('org.eclipse.microprofile.config.*', 80, 'Quarkus');

    // Quarkus Testing
    this.addImportPattern('io.quarkus.test.*', 95, 'Quarkus Test');

    // Quarkus Security
    this.addImportPattern('io.quarkus.security.*', 90, 'Quarkus Security');
    this.addImportPattern('jakarta.annotation.security.*', 80, 'Quarkus Security');

    // Quarkus Health & Metrics
    this.addImportPattern('org.eclipse.microprofile.health.*', 85, 'Quarkus Health');
    this.addImportPattern('org.eclipse.microprofile.metrics.*', 85, 'Quarkus Metrics');

    // Quarkus OpenAPI
    this.addImportPattern('org.eclipse.microprofile.openapi.*', 85, 'Quarkus OpenAPI');

    // CDI (Context and Dependency Injection)
    this.addImportPattern('jakarta.enterprise.context.*', 75, 'Quarkus');
    this.addImportPattern('jakarta.inject.*', 75, 'Quarkus');
    this.addImportPattern('javax.enterprise.context.*', 70, 'Quarkus');
    this.addImportPattern('javax.inject.*', 70, 'Quarkus');

    // Quarkus Reactive
    this.addImportPattern('io.smallrye.mutiny.*', 80, 'Quarkus');
    this.addImportPattern('io.smallrye.common.annotation.*', 75, 'Quarkus');
  }
}