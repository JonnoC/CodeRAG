import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * JHipster framework detection module
 * Handles rapid application generation for Spring Boot + Angular/React/Vue
 */
export class JHipsterFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'JHipster';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // JHipster uses standard Spring Boot annotations, but may have some specific ones
    // Most JHipster identification comes from import patterns and generated code structures
    
    // Categories for any JHipster-specific annotations would go here
  }

  private initializeImportPatterns(): void {
    // JHipster Core - Moderate confidence (as it generates standard Spring Boot code)
    this.addImportPattern('io.github.jhipster.*', 90, 'JHipster');
    this.addImportPattern('tech.jhipster.*', 95, 'JHipster');

    // JHipster Config
    this.addImportPattern('tech.jhipster.config.*', 90, 'JHipster');

    // JHipster Security
    this.addImportPattern('tech.jhipster.security.*', 85, 'JHipster');

    // JHipster Web
    this.addImportPattern('tech.jhipster.web.*', 85, 'JHipster');

    // JHipster Service
    this.addImportPattern('tech.jhipster.service.*', 80, 'JHipster');

    // JHipster Domain (generated entities often have specific patterns)
    this.addImportPattern('tech.jhipster.domain.*', 80, 'JHipster');

    // Legacy JHipster packages
    this.addImportPattern('io.github.jhipster.config.*', 85, 'JHipster');
    this.addImportPattern('io.github.jhipster.security.*', 80, 'JHipster');
    this.addImportPattern('io.github.jhipster.web.*', 80, 'JHipster');
  }
}