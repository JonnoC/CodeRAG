import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Vaadin framework detection module
 * Handles server-side UI framework for building rich web applications
 */
export class VaadinFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Vaadin';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Vaadin Route Annotations
    this.frameworkMap.set('Route', 'Vaadin');
    this.frameworkMap.set('RouteAlias', 'Vaadin');
    this.frameworkMap.set('RoutePrefix', 'Vaadin');
    this.frameworkMap.set('ParentLayout', 'Vaadin');
    this.frameworkMap.set('PageTitle', 'Vaadin');

    // Vaadin Theme Annotations
    this.frameworkMap.set('Theme', 'Vaadin');
    this.frameworkMap.set('NoTheme', 'Vaadin');
    this.frameworkMap.set('CssImport', 'Vaadin');
    this.frameworkMap.set('StyleSheet', 'Vaadin');
    this.frameworkMap.set('JavaScript', 'Vaadin');
    this.frameworkMap.set('HtmlImport', 'Vaadin');

    // Vaadin Security Annotations
    this.frameworkMap.set('PermitAll', 'Vaadin Security');
    this.frameworkMap.set('DenyAll', 'Vaadin Security');
    this.frameworkMap.set('RolesAllowed', 'Vaadin Security');
    this.frameworkMap.set('AnonymousAllowed', 'Vaadin Security');

    // Vaadin Component Annotations
    this.frameworkMap.set('Id', 'Vaadin');
    this.frameworkMap.set('Uses', 'Vaadin');

    // Vaadin PWA Annotations
    this.frameworkMap.set('PWA', 'Vaadin PWA');
    this.frameworkMap.set('Viewport', 'Vaadin');
    this.frameworkMap.set('Meta', 'Vaadin');
    this.frameworkMap.set('Inline', 'Vaadin');
    this.frameworkMap.set('BodySize', 'Vaadin');

    // Vaadin Spring Integration
    this.frameworkMap.set('SpringComponent', 'Vaadin Spring');
    this.frameworkMap.set('UIScope', 'Vaadin Spring');
    this.frameworkMap.set('VaadinSessionScope', 'Vaadin Spring');

    // Vaadin CDI Integration
    this.frameworkMap.set('VaadinServiceScoped', 'Vaadin CDI');
    this.frameworkMap.set('VaadinSessionScoped', 'Vaadin CDI');
    this.frameworkMap.set('VaadinServiceEnabled', 'Vaadin CDI');
    this.frameworkMap.set('RouteScoped', 'Vaadin CDI');

    // Vaadin Push
    this.frameworkMap.set('Push', 'Vaadin Push');

    // Categories
    this.categoryMap.set('Route', 'routing');
    this.categoryMap.set('RouteAlias', 'routing');
    this.categoryMap.set('RoutePrefix', 'routing');
    this.categoryMap.set('ParentLayout', 'routing');
    this.categoryMap.set('PageTitle', 'routing');

    this.categoryMap.set('Theme', 'styling');
    this.categoryMap.set('NoTheme', 'styling');
    this.categoryMap.set('CssImport', 'styling');
    this.categoryMap.set('StyleSheet', 'styling');
    this.categoryMap.set('JavaScript', 'styling');
    this.categoryMap.set('HtmlImport', 'styling');

    this.categoryMap.set('PermitAll', 'security');
    this.categoryMap.set('DenyAll', 'security');
    this.categoryMap.set('RolesAllowed', 'security');
    this.categoryMap.set('AnonymousAllowed', 'security');

    this.categoryMap.set('Id', 'ui');
    this.categoryMap.set('Uses', 'ui');

    this.categoryMap.set('PWA', 'pwa');
    this.categoryMap.set('Viewport', 'pwa');
    this.categoryMap.set('Meta', 'pwa');
    this.categoryMap.set('Inline', 'pwa');
    this.categoryMap.set('BodySize', 'pwa');

    this.categoryMap.set('SpringComponent', 'injection');
    this.categoryMap.set('UIScope', 'injection');
    this.categoryMap.set('VaadinSessionScope', 'injection');
    this.categoryMap.set('VaadinServiceScoped', 'injection');
    this.categoryMap.set('VaadinSessionScoped', 'injection');
    this.categoryMap.set('VaadinServiceEnabled', 'injection');
    this.categoryMap.set('RouteScoped', 'injection');

    this.categoryMap.set('Push', 'communication');
  }

  private initializeImportPatterns(): void {
    // Vaadin Core - High confidence
    this.addImportPattern('com.vaadin.*', 95, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.*', 95, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.*', 95, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.router.*', 95, 'Vaadin');

    // Vaadin Components
    this.addImportPattern('com.vaadin.flow.component.button.*', 90, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.textfield.*', 90, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.grid.*', 90, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.html.*', 90, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.orderedlayout.*', 90, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.formlayout.*', 85, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.notification.*', 85, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.component.dialog.*', 85, 'Vaadin');

    // Vaadin Data
    this.addImportPattern('com.vaadin.flow.data.*', 85, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.data.binder.*', 85, 'Vaadin');
    this.addImportPattern('com.vaadin.flow.data.provider.*', 85, 'Vaadin');

    // Vaadin Server
    this.addImportPattern('com.vaadin.flow.server.*', 85, 'Vaadin');

    // Vaadin Theme
    this.addImportPattern('com.vaadin.flow.theme.*', 85, 'Vaadin');

    // Vaadin Security
    this.addImportPattern('com.vaadin.flow.server.auth.*', 85, 'Vaadin Security');

    // Vaadin Spring
    this.addImportPattern('com.vaadin.flow.spring.*', 90, 'Vaadin Spring');

    // Vaadin CDI
    this.addImportPattern('com.vaadin.cdi.*', 90, 'Vaadin CDI');

    // Vaadin Push
    this.addImportPattern('com.vaadin.flow.shared.communication.*', 80, 'Vaadin Push');

    // Vaadin Legacy (for Vaadin 8 and earlier)
    this.addImportPattern('com.vaadin.ui.*', 75, 'Vaadin Legacy');
    this.addImportPattern('com.vaadin.server.VaadinRequest', 75, 'Vaadin Legacy');
    this.addImportPattern('com.vaadin.annotations.*', 75, 'Vaadin Legacy');
  }
}