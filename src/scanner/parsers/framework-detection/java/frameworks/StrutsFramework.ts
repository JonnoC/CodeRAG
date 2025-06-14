import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Apache Struts framework detection module
 * Handles MVC framework for web applications
 */
export class StrutsFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Apache Struts';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Struts2 Core Annotations
    this.frameworkMap.set('Action', 'Struts');
    this.frameworkMap.set('Actions', 'Struts');
    this.frameworkMap.set('Result', 'Struts');
    this.frameworkMap.set('Results', 'Struts');
    this.frameworkMap.set('Namespace', 'Struts');
    this.frameworkMap.set('ParentPackage', 'Struts');
    this.frameworkMap.set('InterceptorRef', 'Struts');
    this.frameworkMap.set('InterceptorRefs', 'Struts');

    // Struts2 Convention Plugin
    this.frameworkMap.set('ExceptionMapping', 'Struts');
    this.frameworkMap.set('ExceptionMappings', 'Struts');

    // Struts2 Validation
    this.frameworkMap.set('Validations', 'Struts');
    this.frameworkMap.set('RequiredFieldValidator', 'Struts');
    this.frameworkMap.set('RequiredStringValidator', 'Struts');
    this.frameworkMap.set('StringLengthFieldValidator', 'Struts');
    this.frameworkMap.set('EmailValidator', 'Struts');
    this.frameworkMap.set('RegexFieldValidator', 'Struts');
    this.frameworkMap.set('IntRangeFieldValidator', 'Struts');
    this.frameworkMap.set('DoubleRangeFieldValidator', 'Struts');
    this.frameworkMap.set('DateRangeFieldValidator', 'Struts');
    this.frameworkMap.set('ConditionalVisitorFieldValidator', 'Struts');
    this.frameworkMap.set('VisitorFieldValidator', 'Struts');
    this.frameworkMap.set('ConversionErrorFieldValidator', 'Struts');
    this.frameworkMap.set('ExpressionValidator', 'Struts');

    // Struts2 JSON Plugin
    this.frameworkMap.set('JSON', 'Struts JSON');
    this.frameworkMap.set('SMDMethod', 'Struts JSON');

    // Categories
    this.categoryMap.set('Action', 'web');
    this.categoryMap.set('Actions', 'web');
    this.categoryMap.set('Result', 'web');
    this.categoryMap.set('Results', 'web');
    this.categoryMap.set('Namespace', 'web');
    this.categoryMap.set('ParentPackage', 'web');
    this.categoryMap.set('InterceptorRef', 'web');
    this.categoryMap.set('InterceptorRefs', 'web');

    this.categoryMap.set('ExceptionMapping', 'error-handling');
    this.categoryMap.set('ExceptionMappings', 'error-handling');

    this.categoryMap.set('Validations', 'validation');
    this.categoryMap.set('RequiredFieldValidator', 'validation');
    this.categoryMap.set('RequiredStringValidator', 'validation');
    this.categoryMap.set('StringLengthFieldValidator', 'validation');
    this.categoryMap.set('EmailValidator', 'validation');
    this.categoryMap.set('RegexFieldValidator', 'validation');
    this.categoryMap.set('IntRangeFieldValidator', 'validation');
    this.categoryMap.set('DoubleRangeFieldValidator', 'validation');
    this.categoryMap.set('DateRangeFieldValidator', 'validation');
    this.categoryMap.set('ConditionalVisitorFieldValidator', 'validation');
    this.categoryMap.set('VisitorFieldValidator', 'validation');
    this.categoryMap.set('ConversionErrorFieldValidator', 'validation');
    this.categoryMap.set('ExpressionValidator', 'validation');

    this.categoryMap.set('JSON', 'serialization');
    this.categoryMap.set('SMDMethod', 'serialization');
  }

  private initializeImportPatterns(): void {
    // Struts2 Core - High confidence
    this.addImportPattern('org.apache.struts2.*', 95, 'Struts');
    this.addImportPattern('com.opensymphony.xwork2.*', 90, 'Struts');

    // Struts2 Convention Plugin
    this.addImportPattern('org.apache.struts2.convention.annotation.*', 95, 'Struts');

    // Struts2 Validation
    this.addImportPattern('com.opensymphony.xwork2.validator.annotations.*', 90, 'Struts');

    // Struts2 JSON Plugin
    this.addImportPattern('org.apache.struts2.json.*', 85, 'Struts JSON');

    // Struts2 Spring Plugin
    this.addImportPattern('org.apache.struts2.spring.*', 80, 'Struts Spring');

    // Struts2 Tiles Plugin
    this.addImportPattern('org.apache.struts2.tiles.*', 80, 'Struts Tiles');

    // Struts2 JUnit Plugin
    this.addImportPattern('org.apache.struts2.junit.*', 85, 'Struts Test');

    // Struts2 Config Browser Plugin
    this.addImportPattern('org.apache.struts2.config_browser.*', 75, 'Struts');

    // Struts2 REST Plugin
    this.addImportPattern('org.apache.struts2.rest.*', 80, 'Struts REST');

    // ActionSupport and related
    this.addImportPattern('com.opensymphony.xwork2.ActionSupport', 85, 'Struts');
    this.addImportPattern('com.opensymphony.xwork2.Action', 85, 'Struts');
  }
}