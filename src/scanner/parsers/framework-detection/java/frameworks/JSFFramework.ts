import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * JSF (JavaServer Faces) framework detection module
 * Handles component-based UI framework
 */
export class JSFFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'JSF';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // JSF Core Annotations
    this.frameworkMap.set('ManagedBean', 'JSF');
    this.frameworkMap.set('Named', 'JSF');
    this.frameworkMap.set('RequestScoped', 'JSF');
    this.frameworkMap.set('ViewScoped', 'JSF');
    this.frameworkMap.set('SessionScoped', 'JSF');
    this.frameworkMap.set('ApplicationScoped', 'JSF');
    this.frameworkMap.set('ConversationScoped', 'JSF');
    this.frameworkMap.set('CustomScoped', 'JSF');
    this.frameworkMap.set('NoneScoped', 'JSF');

    // JSF Navigation
    this.frameworkMap.set('NavigationCase', 'JSF');

    // JSF Components
    this.frameworkMap.set('FacesComponent', 'JSF');
    this.frameworkMap.set('FacesRenderer', 'JSF');
    this.frameworkMap.set('FacesConverter', 'JSF');
    this.frameworkMap.set('FacesValidator', 'JSF');
    this.frameworkMap.set('ListenerFor', 'JSF');
    this.frameworkMap.set('ListenersFor', 'JSF');
    this.frameworkMap.set('ResourceDependency', 'JSF');
    this.frameworkMap.set('ResourceDependencies', 'JSF');

    // JSF Validation
    this.frameworkMap.set('FacesValidatorFor', 'JSF');

    // JSF Events
    this.frameworkMap.set('NamedEvent', 'JSF');

    // JSF Behavior
    this.frameworkMap.set('FacesBehavior', 'JSF');
    this.frameworkMap.set('FacesBehaviorRenderer', 'JSF');

    // CDI Integration
    this.frameworkMap.set('Inject', 'JSF');
    this.frameworkMap.set('Produces', 'JSF');
    this.frameworkMap.set('Qualifier', 'JSF');

    // Bean Validation Integration
    this.frameworkMap.set('Valid', 'JSF');
    this.frameworkMap.set('NotNull', 'JSF');
    this.frameworkMap.set('NotEmpty', 'JSF');
    this.frameworkMap.set('Size', 'JSF');
    this.frameworkMap.set('Pattern', 'JSF');

    // Categories
    this.categoryMap.set('ManagedBean', 'injection');
    this.categoryMap.set('Named', 'injection');
    this.categoryMap.set('RequestScoped', 'injection');
    this.categoryMap.set('ViewScoped', 'injection');
    this.categoryMap.set('SessionScoped', 'injection');
    this.categoryMap.set('ApplicationScoped', 'injection');
    this.categoryMap.set('ConversationScoped', 'injection');
    this.categoryMap.set('CustomScoped', 'injection');
    this.categoryMap.set('NoneScoped', 'injection');
    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Produces', 'injection');
    this.categoryMap.set('Qualifier', 'injection');

    this.categoryMap.set('NavigationCase', 'navigation');

    this.categoryMap.set('FacesComponent', 'ui');
    this.categoryMap.set('FacesRenderer', 'ui');
    this.categoryMap.set('ResourceDependency', 'ui');
    this.categoryMap.set('ResourceDependencies', 'ui');

    this.categoryMap.set('FacesConverter', 'conversion');

    this.categoryMap.set('FacesValidator', 'validation');
    this.categoryMap.set('FacesValidatorFor', 'validation');
    this.categoryMap.set('Valid', 'validation');
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('Size', 'validation');
    this.categoryMap.set('Pattern', 'validation');

    this.categoryMap.set('ListenerFor', 'events');
    this.categoryMap.set('ListenersFor', 'events');
    this.categoryMap.set('NamedEvent', 'events');

    this.categoryMap.set('FacesBehavior', 'behavior');
    this.categoryMap.set('FacesBehaviorRenderer', 'behavior');
  }

  private initializeImportPatterns(): void {
    // JSF Core - High confidence
    this.addImportPattern('javax.faces.*', 95, 'JSF');
    this.addImportPattern('jakarta.faces.*', 95, 'JSF');
    this.addImportPattern('javax.faces.annotation.*', 95, 'JSF');
    this.addImportPattern('jakarta.faces.annotation.*', 95, 'JSF');

    // JSF Bean Management
    this.addImportPattern('javax.faces.bean.*', 90, 'JSF');
    this.addImportPattern('jakarta.faces.bean.*', 90, 'JSF');

    // JSF Components
    this.addImportPattern('javax.faces.component.*', 85, 'JSF');
    this.addImportPattern('jakarta.faces.component.*', 85, 'JSF');

    // JSF Context
    this.addImportPattern('javax.faces.context.*', 85, 'JSF');
    this.addImportPattern('jakarta.faces.context.*', 85, 'JSF');

    // JSF Validation
    this.addImportPattern('javax.faces.validator.*', 85, 'JSF');
    this.addImportPattern('jakarta.faces.validator.*', 85, 'JSF');

    // JSF Conversion
    this.addImportPattern('javax.faces.convert.*', 80, 'JSF');
    this.addImportPattern('jakarta.faces.convert.*', 80, 'JSF');

    // JSF Events
    this.addImportPattern('javax.faces.event.*', 80, 'JSF');
    this.addImportPattern('jakarta.faces.event.*', 80, 'JSF');

    // JSF Application
    this.addImportPattern('javax.faces.application.*', 75, 'JSF');
    this.addImportPattern('jakarta.faces.application.*', 75, 'JSF');

    // JSF Render Kit
    this.addImportPattern('javax.faces.render.*', 75, 'JSF');
    this.addImportPattern('jakarta.faces.render.*', 75, 'JSF');

    // CDI Integration
    this.addImportPattern('javax.enterprise.context.*', 70, 'JSF');
    this.addImportPattern('jakarta.enterprise.context.*', 75, 'JSF');
    this.addImportPattern('javax.inject.*', 70, 'JSF');
    this.addImportPattern('jakarta.inject.*', 75, 'JSF');

    // Bean Validation
    this.addImportPattern('javax.validation.*', 70, 'JSF');
    this.addImportPattern('jakarta.validation.*', 75, 'JSF');
  }
}