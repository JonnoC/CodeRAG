import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Apache Camel framework detection module
 * Handles integration framework for routing and mediation rules
 */
export class CamelFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Apache Camel';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Camel Route Annotations
    this.frameworkMap.set('Consume', 'Camel');
    this.frameworkMap.set('Produce', 'Camel');
    this.frameworkMap.set('RecipientList', 'Camel');
    this.frameworkMap.set('RoutingSlip', 'Camel');
    this.frameworkMap.set('DynamicRouter', 'Camel');

    // Camel Bean Integration
    this.frameworkMap.set('Handler', 'Camel');
    this.frameworkMap.set('Header', 'Camel');
    this.frameworkMap.set('Headers', 'Camel');
    this.frameworkMap.set('Body', 'Camel');
    this.frameworkMap.set('ExchangeException', 'Camel');
    this.frameworkMap.set('Property', 'Camel');
    this.frameworkMap.set('Properties', 'Camel');

    // Camel Expression Language
    this.frameworkMap.set('Language', 'Camel');
    this.frameworkMap.set('Simple', 'Camel');
    this.frameworkMap.set('XPath', 'Camel');
    this.frameworkMap.set('JsonPath', 'Camel');

    // Camel Endpoint Injection
    this.frameworkMap.set('EndpointInject', 'Camel');
    this.frameworkMap.set('BeanInject', 'Camel');
    this.frameworkMap.set('PropertyInject', 'Camel');

    // Camel Configuration
    this.frameworkMap.set('UriEndpoint', 'Camel');
    this.frameworkMap.set('UriParam', 'Camel');
    this.frameworkMap.set('UriParams', 'Camel');
    this.frameworkMap.set('UriPath', 'Camel');

    // Categories
    this.categoryMap.set('Consume', 'integration');
    this.categoryMap.set('Produce', 'integration');
    this.categoryMap.set('RecipientList', 'integration');
    this.categoryMap.set('RoutingSlip', 'integration');
    this.categoryMap.set('DynamicRouter', 'integration');

    this.categoryMap.set('Handler', 'bean');
    this.categoryMap.set('Header', 'bean');
    this.categoryMap.set('Headers', 'bean');
    this.categoryMap.set('Body', 'bean');
    this.categoryMap.set('ExchangeException', 'bean');
    this.categoryMap.set('Property', 'bean');
    this.categoryMap.set('Properties', 'bean');

    this.categoryMap.set('Language', 'expression');
    this.categoryMap.set('Simple', 'expression');
    this.categoryMap.set('XPath', 'expression');
    this.categoryMap.set('JsonPath', 'expression');

    this.categoryMap.set('EndpointInject', 'injection');
    this.categoryMap.set('BeanInject', 'injection');
    this.categoryMap.set('PropertyInject', 'injection');

    this.categoryMap.set('UriEndpoint', 'configuration');
    this.categoryMap.set('UriParam', 'configuration');
    this.categoryMap.set('UriParams', 'configuration');
    this.categoryMap.set('UriPath', 'configuration');
  }

  private initializeImportPatterns(): void {
    // Camel Core - High confidence
    this.addImportPattern('org.apache.camel.*', 95, 'Camel');
    this.addImportPattern('org.apache.camel.builder.*', 90, 'Camel');
    this.addImportPattern('org.apache.camel.model.*', 85, 'Camel');
    this.addImportPattern('org.apache.camel.processor.*', 85, 'Camel');

    // Camel Component
    this.addImportPattern('org.apache.camel.component.*', 85, 'Camel');

    // Camel Spring
    this.addImportPattern('org.apache.camel.spring.*', 85, 'Camel Spring');

    // Camel CDI
    this.addImportPattern('org.apache.camel.cdi.*', 85, 'Camel CDI');

    // Camel Testing
    this.addImportPattern('org.apache.camel.test.*', 90, 'Camel Test');

    // Camel Language
    this.addImportPattern('org.apache.camel.language.*', 80, 'Camel');

    // Camel Converter
    this.addImportPattern('org.apache.camel.converter.*', 80, 'Camel');

    // Camel Util
    this.addImportPattern('org.apache.camel.util.*', 75, 'Camel');

    // Camel SPI
    this.addImportPattern('org.apache.camel.spi.*', 75, 'Camel');
  }
}