import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Grails framework detection module
 * Handles Groovy-based web framework with convention over configuration
 */
export class GrailsFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Grails';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Grails Artefact Annotations
    this.frameworkMap.set('Entity', 'Grails');
    this.frameworkMap.set('Resource', 'Grails');
    this.frameworkMap.set('Secured', 'Grails Security');
    
    // Grails Service Annotations
    this.frameworkMap.set('Transactional', 'Grails');

    // Grails Testing Annotations
    this.frameworkMap.set('TestFor', 'Grails Test');
    this.frameworkMap.set('Mock', 'Grails Test');

    // Categories
    this.categoryMap.set('Entity', 'persistence');
    this.categoryMap.set('Resource', 'web');
    this.categoryMap.set('Secured', 'security');
    this.categoryMap.set('Transactional', 'persistence');
    this.categoryMap.set('TestFor', 'testing');
    this.categoryMap.set('Mock', 'testing');
  }

  private initializeImportPatterns(): void {
    // Grails Core - High confidence
    this.addImportPattern('grails.*', 95, 'Grails');
    this.addImportPattern('org.grails.*', 95, 'Grails');

    // Grails Services
    this.addImportPattern('grails.gorm.services.*', 90, 'Grails GORM');
    this.addImportPattern('grails.gorm.transactions.*', 85, 'Grails GORM');

    // Grails Web
    this.addImportPattern('grails.web.controllers.*', 90, 'Grails');
    this.addImportPattern('grails.converters.*', 85, 'Grails');

    // Grails Plugin
    this.addImportPattern('grails.plugins.*', 85, 'Grails');

    // Grails Testing
    this.addImportPattern('grails.test.*', 90, 'Grails Test');

    // Grails Util
    this.addImportPattern('grails.util.*', 80, 'Grails');

    // GORM (Grails ORM)
    this.addImportPattern('grails.gorm.*', 90, 'Grails GORM');

    // Grails Configuration
    this.addImportPattern('grails.config.*', 80, 'Grails');
  }
}