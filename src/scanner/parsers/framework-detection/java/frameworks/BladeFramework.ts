import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Blade framework detection module
 * Handles lightweight, fast web framework for REST APIs and microservices
 */
export class BladeFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Blade';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Blade Route Annotations
    this.frameworkMap.set('Path', 'Blade');
    this.frameworkMap.set('GetRoute', 'Blade');
    this.frameworkMap.set('PostRoute', 'Blade');
    this.frameworkMap.set('PutRoute', 'Blade');
    this.frameworkMap.set('DeleteRoute', 'Blade');
    this.frameworkMap.set('RouteGroup', 'Blade');

    // Blade Injection Annotations
    this.frameworkMap.set('Inject', 'Blade');

    // Blade Parameter Annotations
    this.frameworkMap.set('PathParam', 'Blade');
    this.frameworkMap.set('Param', 'Blade');
    this.frameworkMap.set('BodyParam', 'Blade');
    this.frameworkMap.set('HeaderParam', 'Blade');
    this.frameworkMap.set('CookieParam', 'Blade');

    // Categories
    this.categoryMap.set('Path', 'web');
    this.categoryMap.set('GetRoute', 'web');
    this.categoryMap.set('PostRoute', 'web');
    this.categoryMap.set('PutRoute', 'web');
    this.categoryMap.set('DeleteRoute', 'web');
    this.categoryMap.set('RouteGroup', 'web');
    this.categoryMap.set('PathParam', 'web');
    this.categoryMap.set('Param', 'web');
    this.categoryMap.set('BodyParam', 'web');
    this.categoryMap.set('HeaderParam', 'web');
    this.categoryMap.set('CookieParam', 'web');

    this.categoryMap.set('Inject', 'injection');
  }

  private initializeImportPatterns(): void {
    // Blade Core - High confidence
    this.addImportPattern('com.blade.*', 95, 'Blade');
    this.addImportPattern('com.blade.mvc.*', 95, 'Blade');
    this.addImportPattern('com.blade.mvc.annotation.*', 95, 'Blade');

    // Blade HTTP
    this.addImportPattern('com.blade.mvc.http.*', 90, 'Blade');

    // Blade IoC
    this.addImportPattern('com.blade.ioc.*', 85, 'Blade');

    // Blade Kit (utilities)
    this.addImportPattern('com.blade.kit.*', 80, 'Blade');

    // Blade Validator
    this.addImportPattern('com.blade.validator.*', 80, 'Blade');

    // Blade Template
    this.addImportPattern('com.blade.mvc.view.*', 75, 'Blade');

    // Blade Exception
    this.addImportPattern('com.blade.exception.*', 75, 'Blade');
  }
}