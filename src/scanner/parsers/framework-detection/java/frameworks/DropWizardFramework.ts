import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * DropWizard framework detection module
 * Handles production-ready RESTful web services with minimal configuration
 */
export class DropWizardFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'DropWizard';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // DropWizard Core
    this.frameworkMap.set('JsonProperty', 'DropWizard');
    this.frameworkMap.set('JsonIgnore', 'DropWizard');
    this.frameworkMap.set('JsonCreator', 'DropWizard');

    // JAX-RS (DropWizard uses Jersey)
    this.frameworkMap.set('Path', 'DropWizard');
    this.frameworkMap.set('GET', 'DropWizard');
    this.frameworkMap.set('POST', 'DropWizard');
    this.frameworkMap.set('PUT', 'DropWizard');
    this.frameworkMap.set('DELETE', 'DropWizard');
    this.frameworkMap.set('PATCH', 'DropWizard');
    this.frameworkMap.set('HEAD', 'DropWizard');
    this.frameworkMap.set('OPTIONS', 'DropWizard');
    this.frameworkMap.set('Produces', 'DropWizard');
    this.frameworkMap.set('Consumes', 'DropWizard');
    this.frameworkMap.set('PathParam', 'DropWizard');
    this.frameworkMap.set('QueryParam', 'DropWizard');
    this.frameworkMap.set('HeaderParam', 'DropWizard');
    this.frameworkMap.set('FormParam', 'DropWizard');
    this.frameworkMap.set('Context', 'DropWizard');

    // DropWizard Validation
    this.frameworkMap.set('Valid', 'DropWizard');
    this.frameworkMap.set('NotNull', 'DropWizard');
    this.frameworkMap.set('NotEmpty', 'DropWizard');
    this.frameworkMap.set('Size', 'DropWizard');
    this.frameworkMap.set('Min', 'DropWizard');
    this.frameworkMap.set('Max', 'DropWizard');
    this.frameworkMap.set('Pattern', 'DropWizard');
    this.frameworkMap.set('Email', 'DropWizard');

    // DropWizard Metrics
    this.frameworkMap.set('Timed', 'DropWizard Metrics');
    this.frameworkMap.set('Metered', 'DropWizard Metrics');
    this.frameworkMap.set('Counted', 'DropWizard Metrics');
    this.frameworkMap.set('Gauge', 'DropWizard Metrics');
    this.frameworkMap.set('ExceptionMetered', 'DropWizard Metrics');
    this.frameworkMap.set('CachedGauge', 'DropWizard Metrics');

    // DropWizard Health Checks
    this.frameworkMap.set('HealthCheck', 'DropWizard Health');

    // DropWizard Auth
    this.frameworkMap.set('Auth', 'DropWizard Auth');
    this.frameworkMap.set('RolesAllowed', 'DropWizard Auth');
    this.frameworkMap.set('PermitAll', 'DropWizard Auth');
    this.frameworkMap.set('DenyAll', 'DropWizard Auth');

    // DropWizard Configuration
    this.frameworkMap.set('Configuration', 'DropWizard');

    // Categories
    this.categoryMap.set('JsonProperty', 'serialization');
    this.categoryMap.set('JsonIgnore', 'serialization');
    this.categoryMap.set('JsonCreator', 'serialization');

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
    this.categoryMap.set('Context', 'web');

    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Min', 'validation');
    this.categoryMap.set('Max', 'validation');
    this.categoryMap.set('Pattern', 'validation');
    this.categoryMap.set('Email', 'validation');

    this.categoryMap.set('Timed', 'monitoring');
    this.categoryMap.set('Metered', 'monitoring');
    this.categoryMap.set('Counted', 'monitoring');
    this.categoryMap.set('Gauge', 'monitoring');
    this.categoryMap.set('ExceptionMetered', 'monitoring');
    this.categoryMap.set('CachedGauge', 'monitoring');
    this.categoryMap.set('HealthCheck', 'monitoring');

    this.categoryMap.set('Auth', 'security');
    this.categoryMap.set('RolesAllowed', 'security');
    this.categoryMap.set('PermitAll', 'security');
    this.categoryMap.set('DenyAll', 'security');

    this.categoryMap.set('Configuration', 'configuration');
  }

  private initializeImportPatterns(): void {
    // DropWizard Core - High confidence
    this.addImportPattern('io.dropwizard.*', 95, 'DropWizard');
    this.addImportPattern('io.dropwizard.core.*', 95, 'DropWizard');
    this.addImportPattern('io.dropwizard.configuration.*', 90, 'DropWizard');

    // DropWizard Metrics
    this.addImportPattern('com.codahale.metrics.*', 85, 'DropWizard Metrics');
    this.addImportPattern('io.dropwizard.metrics.*', 90, 'DropWizard Metrics');

    // DropWizard Health
    this.addImportPattern('com.codahale.metrics.health.*', 85, 'DropWizard Health');
    this.addImportPattern('io.dropwizard.health.*', 90, 'DropWizard Health');

    // DropWizard Auth
    this.addImportPattern('io.dropwizard.auth.*', 90, 'DropWizard Auth');

    // JAX-RS (Jersey)
    this.addImportPattern('javax.ws.rs.*', 80, 'DropWizard');
    this.addImportPattern('jakarta.ws.rs.*', 85, 'DropWizard');

    // Jackson (JSON processing)
    this.addImportPattern('com.fasterxml.jackson.*', 75, 'DropWizard');

    // Validation
    this.addImportPattern('javax.validation.*', 75, 'DropWizard');
    this.addImportPattern('jakarta.validation.*', 80, 'DropWizard');

    // DropWizard DB
    this.addImportPattern('io.dropwizard.db.*', 85, 'DropWizard');
    this.addImportPattern('io.dropwizard.jdbi.*', 85, 'DropWizard');

    // DropWizard Testing
    this.addImportPattern('io.dropwizard.testing.*', 90, 'DropWizard');
  }
}