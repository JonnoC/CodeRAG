import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Apache Wicket framework detection module
 * Handles component-oriented web framework
 */
export class WicketFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Apache Wicket';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Wicket Spring Integration
    this.frameworkMap.set('SpringBean', 'Wicket Spring');
    
    // Wicket CDI Integration  
    this.frameworkMap.set('Inject', 'Wicket CDI');

    // Categories
    this.categoryMap.set('SpringBean', 'injection');
    this.categoryMap.set('Inject', 'injection');
  }

  private initializeImportPatterns(): void {
    // Wicket Core - High confidence
    this.addImportPattern('org.apache.wicket.*', 95, 'Wicket');
    this.addImportPattern('org.apache.wicket.markup.*', 90, 'Wicket');
    this.addImportPattern('org.apache.wicket.model.*', 90, 'Wicket');
    this.addImportPattern('org.apache.wicket.request.*', 85, 'Wicket');
    this.addImportPattern('org.apache.wicket.protocol.http.*', 85, 'Wicket');

    // Wicket Extensions
    this.addImportPattern('org.apache.wicket.extensions.*', 85, 'Wicket Extensions');

    // Wicket Spring
    this.addImportPattern('org.apache.wicket.spring.*', 85, 'Wicket Spring');

    // Wicket CDI
    this.addImportPattern('org.apache.wicket.cdi.*', 85, 'Wicket CDI');

    // Wicket DateTime
    this.addImportPattern('org.apache.wicket.datetime.*', 80, 'Wicket DateTime');

    // Wicket Auth Roles
    this.addImportPattern('org.apache.wicket.authroles.*', 80, 'Wicket Auth');

    // Wicket Util
    this.addImportPattern('org.apache.wicket.util.*', 75, 'Wicket');

    // Wicket Validation
    this.addImportPattern('org.apache.wicket.validation.*', 80, 'Wicket');
  }
}