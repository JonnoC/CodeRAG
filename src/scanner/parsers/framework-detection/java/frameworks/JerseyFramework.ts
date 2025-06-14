import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Jersey JAX-RS framework detection module
 * Handles reference implementation of JAX-RS for RESTful web services
 */
export class JerseyFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Jersey';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // JAX-RS Core Annotations
    this.frameworkMap.set('Path', 'Jersey');
    this.frameworkMap.set('GET', 'Jersey');
    this.frameworkMap.set('POST', 'Jersey');
    this.frameworkMap.set('PUT', 'Jersey');
    this.frameworkMap.set('DELETE', 'Jersey');
    this.frameworkMap.set('PATCH', 'Jersey');
    this.frameworkMap.set('HEAD', 'Jersey');
    this.frameworkMap.set('OPTIONS', 'Jersey');
    this.frameworkMap.set('Produces', 'Jersey');
    this.frameworkMap.set('Consumes', 'Jersey');
    this.frameworkMap.set('PathParam', 'Jersey');
    this.frameworkMap.set('QueryParam', 'Jersey');
    this.frameworkMap.set('HeaderParam', 'Jersey');
    this.frameworkMap.set('FormParam', 'Jersey');
    this.frameworkMap.set('MatrixParam', 'Jersey');
    this.frameworkMap.set('CookieParam', 'Jersey');
    this.frameworkMap.set('BeanParam', 'Jersey');
    this.frameworkMap.set('Context', 'Jersey');
    this.frameworkMap.set('DefaultValue', 'Jersey');
    this.frameworkMap.set('Encoded', 'Jersey');

    // Jersey-specific Annotations
    this.frameworkMap.set('JerseyTest', 'Jersey Test');
    this.frameworkMap.set('InMemoryTestContainer', 'Jersey Test');

    // Jersey Client Annotations
    this.frameworkMap.set('ClientConfig', 'Jersey Client');

    // Jersey Validation
    this.frameworkMap.set('Valid', 'Jersey');
    this.frameworkMap.set('NotNull', 'Jersey');
    this.frameworkMap.set('NotEmpty', 'Jersey');
    this.frameworkMap.set('Size', 'Jersey');
    this.frameworkMap.set('Min', 'Jersey');
    this.frameworkMap.set('Max', 'Jersey');
    this.frameworkMap.set('Pattern', 'Jersey');
    this.frameworkMap.set('Email', 'Jersey');

    // Jersey Security
    this.frameworkMap.set('RolesAllowed', 'Jersey Security');
    this.frameworkMap.set('PermitAll', 'Jersey Security');
    this.frameworkMap.set('DenyAll', 'Jersey Security');

    // Jersey Filters and Interceptors
    this.frameworkMap.set('Provider', 'Jersey');
    this.frameworkMap.set('PreMatching', 'Jersey');
    this.frameworkMap.set('Priority', 'Jersey');

    // Categories
    this.categoryMap.set('Path', 'web');
    this.categoryMap.set('GET', 'web');
    this.categoryMap.set('POST', 'web');
    this.categoryMap.set('PUT', 'web');
    this.categoryMap.set('DELETE', 'web');
    this.categoryMap.set('PATCH', 'web');
    this.categoryMap.set('HEAD', 'web');
    this.categoryMap.set('OPTIONS', 'web');
    this.categoryMap.set('Produces', 'web');
    this.categoryMap.set('Consumes', 'web');
    this.categoryMap.set('PathParam', 'web');
    this.categoryMap.set('QueryParam', 'web');
    this.categoryMap.set('HeaderParam', 'web');
    this.categoryMap.set('FormParam', 'web');
    this.categoryMap.set('MatrixParam', 'web');
    this.categoryMap.set('CookieParam', 'web');
    this.categoryMap.set('BeanParam', 'web');
    this.categoryMap.set('Context', 'web');
    this.categoryMap.set('DefaultValue', 'web');
    this.categoryMap.set('Encoded', 'web');

    this.categoryMap.set('JerseyTest', 'testing');
    this.categoryMap.set('InMemoryTestContainer', 'testing');

    this.categoryMap.set('ClientConfig', 'client');

    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Pattern', 'validation');
    this.categoryMap.set('Email', 'validation');

    this.categoryMap.set('RolesAllowed', 'security');
    this.categoryMap.set('PermitAll', 'security');
    this.categoryMap.set('DenyAll', 'security');

    this.categoryMap.set('Provider', 'filter');
    this.categoryMap.set('PreMatching', 'filter');
    this.categoryMap.set('Priority', 'filter');
  }

  private initializeImportPatterns(): void {
    // JAX-RS Core - High confidence
    this.addImportPattern('javax.ws.rs.*', 95, 'Jersey');
    this.addImportPattern('jakarta.ws.rs.*', 95, 'Jersey');

    // Jersey Core - High confidence
    this.addImportPattern('org.glassfish.jersey.*', 95, 'Jersey');
    this.addImportPattern('org.glassfish.jersey.server.*', 95, 'Jersey');
    this.addImportPattern('org.glassfish.jersey.client.*', 90, 'Jersey Client');

    // Jersey Testing
    this.addImportPattern('org.glassfish.jersey.test.*', 95, 'Jersey Test');

    // Jersey Media Support
    this.addImportPattern('org.glassfish.jersey.media.*', 85, 'Jersey');

    // Jersey Injection (HK2)
    this.addImportPattern('org.glassfish.hk2.*', 80, 'Jersey');

    // Bean Validation
    this.addImportPattern('javax.validation.*', 75, 'Jersey');
    this.addImportPattern('jakarta.validation.*', 80, 'Jersey');

    // Security
    this.addImportPattern('javax.annotation.security.*', 75, 'Jersey Security');
    this.addImportPattern('jakarta.annotation.security.*', 80, 'Jersey Security');

    // Jersey Extensions
    this.addImportPattern('org.glassfish.jersey.jackson.*', 80, 'Jersey');
    this.addImportPattern('org.glassfish.jersey.moxy.*', 75, 'Jersey');
  }
}