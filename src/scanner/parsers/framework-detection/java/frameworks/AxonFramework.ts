import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Axon Framework detection module
 * Handles CQRS, Event Sourcing, and DDD annotations from AxonIQ
 */
export class AxonFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Axon Framework';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Axon Core Annotations
    this.frameworkMap.set('Aggregate', 'Axon Framework');
    this.frameworkMap.set('AggregateRoot', 'Axon Framework');
    this.frameworkMap.set('AggregateIdentifier', 'Axon Framework');
    this.frameworkMap.set('CommandHandler', 'Axon Framework');
    this.frameworkMap.set('EventHandler', 'Axon Framework');
    this.frameworkMap.set('QueryHandler', 'Axon Framework');
    this.frameworkMap.set('EventSourcingHandler', 'Axon Framework');
    this.frameworkMap.set('CreationPolicy', 'Axon Framework');
    this.frameworkMap.set('AggregateMember', 'Axon Framework');

    // Axon Command Model
    this.frameworkMap.set('TargetAggregateIdentifier', 'Axon Framework');
    this.frameworkMap.set('TargetAggregateVersion', 'Axon Framework');
    this.frameworkMap.set('CommandHandlerInterceptor', 'Axon Framework');
    this.frameworkMap.set('RoutingKey', 'Axon Framework');

    // Axon Event Model
    this.frameworkMap.set('EventBus', 'Axon Framework');
    this.frameworkMap.set('DomainEvent', 'Axon Framework');
    this.frameworkMap.set('EventHandlerInterceptor', 'Axon Framework');
    this.frameworkMap.set('ReplayStatus', 'Axon Framework');
    this.frameworkMap.set('SequenceNumber', 'Axon Framework');
    this.frameworkMap.set('Timestamp', 'Axon Framework');

    // Axon Query Model
    this.frameworkMap.set('QueryHandlerInterceptor', 'Axon Framework');
    this.frameworkMap.set('MetaDataValue', 'Axon Framework');

    // Axon Saga
    this.frameworkMap.set('Saga', 'Axon Framework');
    this.frameworkMap.set('SagaOrchestrationStart', 'Axon Framework');
    this.frameworkMap.set('SagaOrchestrationEnd', 'Axon Framework');
    this.frameworkMap.set('StartSaga', 'Axon Framework');
    this.frameworkMap.set('EndSaga', 'Axon Framework');
    this.frameworkMap.set('SagaStart', 'Axon Framework');

    // Axon Spring Integration
    this.frameworkMap.set('ProcessingGroup', 'Axon Framework');
    this.frameworkMap.set('Component', 'Axon Framework');

    // Axon Test Support
    this.frameworkMap.set('AxonTest', 'Axon Framework');

    // Categories
    this.categoryMap.set('Aggregate', 'ddd');
    this.categoryMap.set('AggregateRoot', 'ddd');
    this.categoryMap.set('AggregateIdentifier', 'ddd');
    this.categoryMap.set('AggregateMember', 'ddd');
    
    this.categoryMap.set('CommandHandler', 'cqrs');
    this.categoryMap.set('QueryHandler', 'cqrs');
    this.categoryMap.set('TargetAggregateIdentifier', 'cqrs');
    this.categoryMap.set('TargetAggregateVersion', 'cqrs');
    this.categoryMap.set('CommandHandlerInterceptor', 'cqrs');
    this.categoryMap.set('QueryHandlerInterceptor', 'cqrs');
    this.categoryMap.set('RoutingKey', 'cqrs');
    
    this.categoryMap.set('EventHandler', 'event-sourcing');
    this.categoryMap.set('EventSourcingHandler', 'event-sourcing');
    this.categoryMap.set('DomainEvent', 'event-sourcing');
    this.categoryMap.set('EventBus', 'event-sourcing');
    this.categoryMap.set('EventHandlerInterceptor', 'event-sourcing');
    this.categoryMap.set('ReplayStatus', 'event-sourcing');
    this.categoryMap.set('SequenceNumber', 'event-sourcing');
    this.categoryMap.set('Timestamp', 'event-sourcing');
    
    this.categoryMap.set('Saga', 'saga');
    this.categoryMap.set('SagaOrchestrationStart', 'saga');
    this.categoryMap.set('SagaOrchestrationEnd', 'saga');
    this.categoryMap.set('StartSaga', 'saga');
    this.categoryMap.set('EndSaga', 'saga');
    this.categoryMap.set('SagaStart', 'saga');
    
    this.categoryMap.set('ProcessingGroup', 'configuration');
    this.categoryMap.set('Component', 'configuration');
    this.categoryMap.set('CreationPolicy', 'configuration');
    this.categoryMap.set('MetaDataValue', 'configuration');
    
    this.categoryMap.set('AxonTest', 'testing');
  }

  private initializeImportPatterns(): void {
    // Axon Framework Core - High confidence
    this.addImportPattern('org.axonframework.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.commandhandling.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.eventhandling.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.queryhandling.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.modelling.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.eventsourcing.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.modelling.saga.*', 95, 'Axon Framework');
    
    // Axon Spring Boot Starter
    this.addImportPattern('org.axonframework.springboot.*', 95, 'Axon Framework');
    this.addImportPattern('org.axonframework.spring.*', 90, 'Axon Framework');
    
    // Axon Test Support
    this.addImportPattern('org.axonframework.test.*', 90, 'Axon Framework');
    
    // Axon Extensions
    this.addImportPattern('org.axonframework.extensions.*', 85, 'Axon Framework');
    this.addImportPattern('org.axonframework.messaging.*', 85, 'Axon Framework');
    this.addImportPattern('org.axonframework.serialization.*', 80, 'Axon Framework');
    this.addImportPattern('org.axonframework.common.*', 75, 'Axon Framework');
  }
}