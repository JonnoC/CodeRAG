import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * GWT (Google Web Toolkit) framework detection module
 * Handles Java-to-JavaScript compilation framework
 */
export class GWTFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'GWT';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // GWT RPC Annotations
    this.frameworkMap.set('RemoteServiceRelativePath', 'GWT RPC');
    
    // GWT UiBinder Annotations
    this.frameworkMap.set('UiField', 'GWT UiBinder');
    this.frameworkMap.set('UiHandler', 'GWT UiBinder');
    this.frameworkMap.set('UiTemplate', 'GWT UiBinder');
    this.frameworkMap.set('UiConstructor', 'GWT UiBinder');
    this.frameworkMap.set('UiChild', 'GWT UiBinder');
    this.frameworkMap.set('UiFactory', 'GWT UiBinder');

    // GWT RequestFactory Annotations
    this.frameworkMap.set('Service', 'GWT RequestFactory');
    this.frameworkMap.set('ServiceName', 'GWT RequestFactory');
    this.frameworkMap.set('ProxyFor', 'GWT RequestFactory');
    this.frameworkMap.set('ProxyForName', 'GWT RequestFactory');

    // GWT Editor Framework
    this.frameworkMap.set('Path', 'GWT Editor');
    this.frameworkMap.set('Ignore', 'GWT Editor');

    // Categories
    this.categoryMap.set('RemoteServiceRelativePath', 'rpc');
    
    this.categoryMap.set('UiField', 'ui');
    this.categoryMap.set('UiHandler', 'ui');
    this.categoryMap.set('UiTemplate', 'ui');
    this.categoryMap.set('UiConstructor', 'ui');
    this.categoryMap.set('UiChild', 'ui');
    this.categoryMap.set('UiFactory', 'ui');

    this.categoryMap.set('Service', 'requestfactory');
    this.categoryMap.set('ServiceName', 'requestfactory');
    this.categoryMap.set('ProxyFor', 'requestfactory');
    this.categoryMap.set('ProxyForName', 'requestfactory');

    this.categoryMap.set('Path', 'editor');
    this.categoryMap.set('Ignore', 'editor');
  }

  private initializeImportPatterns(): void {
    // GWT Core - High confidence
    this.addImportPattern('com.google.gwt.*', 95, 'GWT');
    this.addImportPattern('com.google.gwt.core.client.*', 95, 'GWT');
    this.addImportPattern('com.google.gwt.user.client.*', 95, 'GWT');

    // GWT UI
    this.addImportPattern('com.google.gwt.user.client.ui.*', 95, 'GWT');
    this.addImportPattern('com.google.gwt.uibinder.client.*', 90, 'GWT UiBinder');

    // GWT RPC
    this.addImportPattern('com.google.gwt.user.client.rpc.*', 90, 'GWT RPC');
    this.addImportPattern('com.google.gwt.user.server.rpc.*', 90, 'GWT RPC');

    // GWT RequestFactory
    this.addImportPattern('com.google.web.bindery.requestfactory.*', 85, 'GWT RequestFactory');

    // GWT Editor
    this.addImportPattern('com.google.gwt.editor.client.*', 85, 'GWT Editor');

    // GWT DOM
    this.addImportPattern('com.google.gwt.dom.client.*', 80, 'GWT');

    // GWT Event
    this.addImportPattern('com.google.gwt.event.*', 80, 'GWT');

    // GWT Resources
    this.addImportPattern('com.google.gwt.resources.client.*', 80, 'GWT');

    // GWT Place
    this.addImportPattern('com.google.gwt.place.shared.*', 75, 'GWT');
    this.addImportPattern('com.google.gwt.activity.shared.*', 75, 'GWT');

    // GWT Testing
    this.addImportPattern('com.google.gwt.junit.client.*', 85, 'GWT Test');
  }
}