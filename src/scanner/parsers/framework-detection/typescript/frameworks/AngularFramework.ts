import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Angular framework detection module
 * Handles Angular components, services, directives, and other decorators
 */
export class AngularFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Angular';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Angular Core Decorators
    this.frameworkMap.set('Component', 'Angular');
    this.frameworkMap.set('Injectable', 'Angular');
    this.frameworkMap.set('NgModule', 'Angular');
    this.frameworkMap.set('Directive', 'Angular');
    this.frameworkMap.set('Pipe', 'Angular');

    // Angular Property Decorators
    this.frameworkMap.set('Input', 'Angular');
    this.frameworkMap.set('Output', 'Angular');
    this.frameworkMap.set('ViewChild', 'Angular');
    this.frameworkMap.set('ViewChildren', 'Angular');
    this.frameworkMap.set('ContentChild', 'Angular');
    this.frameworkMap.set('ContentChildren', 'Angular');
    this.frameworkMap.set('HostBinding', 'Angular');
    this.frameworkMap.set('HostListener', 'Angular');

    // Angular Dependency Injection
    this.frameworkMap.set('Inject', 'Angular');
    this.frameworkMap.set('Optional', 'Angular');
    this.frameworkMap.set('Self', 'Angular');
    this.frameworkMap.set('SkipSelf', 'Angular');
    this.frameworkMap.set('Host', 'Angular');

    // Categories
    this.categoryMap.set('Component', 'ui');
    this.categoryMap.set('Injectable', 'injection');
    this.categoryMap.set('NgModule', 'injection');
    this.categoryMap.set('Directive', 'ui');
    this.categoryMap.set('Pipe', 'ui');

    this.categoryMap.set('Input', 'ui');
    this.categoryMap.set('Output', 'events');
    this.categoryMap.set('ViewChild', 'ui');
    this.categoryMap.set('ViewChildren', 'ui');
    this.categoryMap.set('ContentChild', 'ui');
    this.categoryMap.set('ContentChildren', 'ui');
    this.categoryMap.set('HostBinding', 'ui');
    this.categoryMap.set('HostListener', 'events');

    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Optional', 'injection');
    this.categoryMap.set('Self', 'injection');
    this.categoryMap.set('SkipSelf', 'injection');
    this.categoryMap.set('Host', 'injection');
  }

  private initializeImportPatterns(): void {
    // Angular Core - Very high confidence
    this.addImportPattern('@angular/core', 95);
    this.addImportPattern('@angular/common', 90);
    this.addImportPattern('@angular/platform-browser', 90);
    this.addImportPattern('@angular/platform-browser-dynamic', 90);
    
    // Angular Router
    this.addImportPattern('@angular/router', 90);
    
    // Angular Forms
    this.addImportPattern('@angular/forms', 85);
    
    // Angular HTTP
    this.addImportPattern('@angular/common/http', 85);
    
    // Angular Material
    this.addImportPattern('@angular/material/*', 80);
    this.addImportPattern('@angular/cdk/*', 75);
    
    // Angular Animations
    this.addImportPattern('@angular/animations', 85);
    
    // Angular PWA
    this.addImportPattern('@angular/service-worker', 80);
    
    // Angular Testing
    this.addImportPattern('@angular/core/testing', 90);
    this.addImportPattern('@angular/common/testing', 85);
    this.addImportPattern('@angular/router/testing', 85);
    this.addImportPattern('@angular/platform-browser/testing', 85);
    
    // Angular CLI
    this.addImportPattern('@angular-devkit/*', 70);
    
    // RxJS (commonly used with Angular)
    this.addImportPattern('rxjs', 60);
    this.addImportPattern('rxjs/operators', 60);
  }
}