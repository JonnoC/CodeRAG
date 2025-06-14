import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Hibernate ORM framework detection module
 * Handles Hibernate-specific annotations and features beyond standard JPA
 */
export class HibernateFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Hibernate';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Hibernate Core Annotations
    this.frameworkMap.set('DynamicInsert', 'Hibernate');
    this.frameworkMap.set('DynamicUpdate', 'Hibernate');
    this.frameworkMap.set('SelectBeforeUpdate', 'Hibernate');
    this.frameworkMap.set('Immutable', 'Hibernate');
    this.frameworkMap.set('Entity', 'Hibernate');
    this.frameworkMap.set('Cache', 'Hibernate');
    this.frameworkMap.set('CacheConcurrencyStrategy', 'Hibernate');
    this.frameworkMap.set('NaturalId', 'Hibernate');
    this.frameworkMap.set('NaturalIdCache', 'Hibernate');

    // Hibernate Mapping Annotations
    this.frameworkMap.set('JoinFormula', 'Hibernate');
    this.frameworkMap.set('Formula', 'Hibernate');
    this.frameworkMap.set('ColumnDefault', 'Hibernate');
    this.frameworkMap.set('Generated', 'Hibernate');
    this.frameworkMap.set('GenerationTime', 'Hibernate');
    this.frameworkMap.set('GenericGenerator', 'Hibernate');
    this.frameworkMap.set('Parameter', 'Hibernate');
    this.frameworkMap.set('Type', 'Hibernate');
    this.frameworkMap.set('TypeDef', 'Hibernate');
    this.frameworkMap.set('TypeDefs', 'Hibernate');

    // Hibernate Collection Annotations
    this.frameworkMap.set('IndexColumn', 'Hibernate');
    this.frameworkMap.set('Sort', 'Hibernate');
    this.frameworkMap.set('SortNatural', 'Hibernate');
    this.frameworkMap.set('SortComparator', 'Hibernate');
    this.frameworkMap.set('OrderBy', 'Hibernate');
    this.frameworkMap.set('Where', 'Hibernate');
    this.frameworkMap.set('WhereJoinTable', 'Hibernate');
    this.frameworkMap.set('Filter', 'Hibernate');
    this.frameworkMap.set('FilterDef', 'Hibernate');
    this.frameworkMap.set('FilterDefs', 'Hibernate');
    this.frameworkMap.set('FilterJoinTable', 'Hibernate');

    // Hibernate Lazy Loading
    this.frameworkMap.set('LazyToOne', 'Hibernate');
    this.frameworkMap.set('LazyCollection', 'Hibernate');
    this.frameworkMap.set('LazyGroup', 'Hibernate');
    this.frameworkMap.set('Fetch', 'Hibernate');
    this.frameworkMap.set('FetchMode', 'Hibernate');
    this.frameworkMap.set('BatchSize', 'Hibernate');

    // Hibernate Cascade
    this.frameworkMap.set('Cascade', 'Hibernate');
    this.frameworkMap.set('OnDelete', 'Hibernate');

    // Hibernate Validation
    this.frameworkMap.set('Check', 'Hibernate');

    // Hibernate Proxy
    this.frameworkMap.set('Proxy', 'Hibernate');
    this.frameworkMap.set('LazyToOneOption', 'Hibernate');

    // Hibernate Search
    this.frameworkMap.set('Indexed', 'Hibernate Search');
    this.frameworkMap.set('Field', 'Hibernate Search');
    this.frameworkMap.set('FullTextField', 'Hibernate Search');
    this.frameworkMap.set('KeywordField', 'Hibernate Search');
    this.frameworkMap.set('IndexedEmbedded', 'Hibernate Search');
    this.frameworkMap.set('DocumentId', 'Hibernate Search');

    // Hibernate Validator
    this.frameworkMap.set('NotNull', 'Hibernate Validator');
    this.frameworkMap.set('NotEmpty', 'Hibernate Validator');
    this.frameworkMap.set('NotBlank', 'Hibernate Validator');
    this.frameworkMap.set('Length', 'Hibernate Validator');
    this.frameworkMap.set('Range', 'Hibernate Validator');
    this.frameworkMap.set('Email', 'Hibernate Validator');
    this.frameworkMap.set('CreditCardNumber', 'Hibernate Validator');
    this.frameworkMap.set('URL', 'Hibernate Validator');

    // Categories
    this.categoryMap.set('DynamicInsert', 'persistence');
    this.categoryMap.set('DynamicUpdate', 'persistence');
    this.categoryMap.set('SelectBeforeUpdate', 'persistence');
    this.categoryMap.set('Immutable', 'persistence');
    this.categoryMap.set('Entity', 'persistence');
    this.categoryMap.set('NaturalId', 'persistence');
    this.categoryMap.set('NaturalIdCache', 'persistence');

    this.categoryMap.set('Cache', 'performance');
    this.categoryMap.set('CacheConcurrencyStrategy', 'performance');
    this.categoryMap.set('LazyToOne', 'performance');
    this.categoryMap.set('LazyCollection', 'performance');
    this.categoryMap.set('LazyGroup', 'performance');
    this.categoryMap.set('Fetch', 'performance');
    this.categoryMap.set('FetchMode', 'performance');
    this.categoryMap.set('BatchSize', 'performance');

    this.categoryMap.set('JoinFormula', 'persistence');
    this.categoryMap.set('Formula', 'persistence');
    this.categoryMap.set('ColumnDefault', 'persistence');
    this.categoryMap.set('Generated', 'persistence');
    this.categoryMap.set('GenerationTime', 'persistence');
    this.categoryMap.set('GenericGenerator', 'persistence');
    this.categoryMap.set('Parameter', 'persistence');
    this.categoryMap.set('Type', 'persistence');
    this.categoryMap.set('TypeDef', 'persistence');
    this.categoryMap.set('TypeDefs', 'persistence');

    this.categoryMap.set('IndexColumn', 'persistence');
    this.categoryMap.set('Sort', 'persistence');
    this.categoryMap.set('SortNatural', 'persistence');
    this.categoryMap.set('SortComparator', 'persistence');
    this.categoryMap.set('OrderBy', 'persistence');
    this.categoryMap.set('Where', 'persistence');
    this.categoryMap.set('WhereJoinTable', 'persistence');
    this.categoryMap.set('Filter', 'persistence');
    this.categoryMap.set('FilterDef', 'persistence');
    this.categoryMap.set('FilterDefs', 'persistence');
    this.categoryMap.set('FilterJoinTable', 'persistence');

    this.categoryMap.set('Cascade', 'persistence');
    this.categoryMap.set('OnDelete', 'persistence');
    this.categoryMap.set('Check', 'persistence');
    this.categoryMap.set('Proxy', 'persistence');
    this.categoryMap.set('LazyToOneOption', 'persistence');

    // Hibernate Search categories
    this.categoryMap.set('Indexed', 'search');
    this.categoryMap.set('Field', 'search');
    this.categoryMap.set('FullTextField', 'search');
    this.categoryMap.set('KeywordField', 'search');
    this.categoryMap.set('IndexedEmbedded', 'search');
    this.categoryMap.set('DocumentId', 'search');

    // Hibernate Validator categories
    this.categoryMap.set('NotNull', 'validation');
    this.categoryMap.set('NotEmpty', 'validation');
    this.categoryMap.set('NotBlank', 'validation');
    this.categoryMap.set('Length', 'validation');
    this.categoryMap.set('Range', 'validation');
    this.categoryMap.set('Email', 'validation');
    this.categoryMap.set('CreditCardNumber', 'validation');
    this.categoryMap.set('URL', 'validation');
  }

  private initializeImportPatterns(): void {
    // Hibernate Core - High confidence
    this.addImportPattern('org.hibernate.*', 95, 'Hibernate');
    this.addImportPattern('org.hibernate.annotations.*', 95, 'Hibernate');
    this.addImportPattern('org.hibernate.type.*', 90, 'Hibernate');
    this.addImportPattern('org.hibernate.engine.*', 85, 'Hibernate');
    this.addImportPattern('org.hibernate.mapping.*', 80, 'Hibernate');
    this.addImportPattern('org.hibernate.cfg.*', 85, 'Hibernate');

    // Hibernate Search
    this.addImportPattern('org.hibernate.search.*', 95, 'Hibernate Search');
    this.addImportPattern('org.hibernate.search.annotations.*', 95, 'Hibernate Search');
    this.addImportPattern('org.hibernate.search.mapper.pojo.mapping.definition.annotation.*', 95, 'Hibernate Search');

    // Hibernate Validator
    this.addImportPattern('org.hibernate.validator.*', 95, 'Hibernate Validator');
    this.addImportPattern('org.hibernate.validator.constraints.*', 95, 'Hibernate Validator');

    // Hibernate Envers (Auditing)
    this.addImportPattern('org.hibernate.envers.*', 90, 'Hibernate Envers');

    // Hibernate Spatial
    this.addImportPattern('org.hibernate.spatial.*', 85, 'Hibernate Spatial');
  }
}