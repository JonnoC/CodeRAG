import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * NestJS framework detection module
 * Handles NestJS controllers, services, modules, and other decorators
 */
export class NestJSFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'NestJS';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // NestJS Core Decorators
    this.frameworkMap.set('Module', 'NestJS');
    this.frameworkMap.set('Controller', 'NestJS');
    this.frameworkMap.set('Injectable', 'NestJS');
    this.frameworkMap.set('Inject', 'NestJS');
    this.frameworkMap.set('Optional', 'NestJS');

    // HTTP Method Decorators
    this.frameworkMap.set('Get', 'NestJS');
    this.frameworkMap.set('Post', 'NestJS');
    this.frameworkMap.set('Put', 'NestJS');
    this.frameworkMap.set('Delete', 'NestJS');
    this.frameworkMap.set('Patch', 'NestJS');
    this.frameworkMap.set('Options', 'NestJS');
    this.frameworkMap.set('Head', 'NestJS');
    this.frameworkMap.set('All', 'NestJS');

    // Parameter Decorators
    this.frameworkMap.set('Param', 'NestJS');
    this.frameworkMap.set('Body', 'NestJS');
    this.frameworkMap.set('Query', 'NestJS');
    this.frameworkMap.set('Headers', 'NestJS');
    this.frameworkMap.set('Session', 'NestJS');
    this.frameworkMap.set('Req', 'NestJS');
    this.frameworkMap.set('Res', 'NestJS');
    this.frameworkMap.set('Next', 'NestJS');
    this.frameworkMap.set('Ip', 'NestJS');
    this.frameworkMap.set('HostParam', 'NestJS');

    // Guards and Interceptors
    this.frameworkMap.set('UseGuards', 'NestJS');
    this.frameworkMap.set('UseInterceptors', 'NestJS');
    this.frameworkMap.set('UsePipes', 'NestJS');
    this.frameworkMap.set('UseFilters', 'NestJS');
    this.frameworkMap.set('SetMetadata', 'NestJS');

    // Lifecycle Hooks
    this.frameworkMap.set('OnModuleInit', 'NestJS');
    this.frameworkMap.set('OnApplicationBootstrap', 'NestJS');
    this.frameworkMap.set('OnModuleDestroy', 'NestJS');
    this.frameworkMap.set('BeforeApplicationShutdown', 'NestJS');
    this.frameworkMap.set('OnApplicationShutdown', 'NestJS');

    // WebSocket Decorators
    this.frameworkMap.set('WebSocketGateway', 'NestJS');
    this.frameworkMap.set('SubscribeMessage', 'NestJS');
    this.frameworkMap.set('MessageBody', 'NestJS');
    this.frameworkMap.set('ConnectedSocket', 'NestJS');
    this.frameworkMap.set('WebSocketServer', 'NestJS');

    // Microservices
    this.frameworkMap.set('MessagePattern', 'NestJS');
    this.frameworkMap.set('EventPattern', 'NestJS');
    this.frameworkMap.set('Client', 'NestJS');

    // GraphQL
    this.frameworkMap.set('Resolver', 'NestJS GraphQL');
    this.frameworkMap.set('Query', 'NestJS GraphQL');
    this.frameworkMap.set('Mutation', 'NestJS GraphQL');
    this.frameworkMap.set('Subscription', 'NestJS GraphQL');
    this.frameworkMap.set('Args', 'NestJS GraphQL');
    this.frameworkMap.set('Context', 'NestJS GraphQL');
    this.frameworkMap.set('Info', 'NestJS GraphQL');
    this.frameworkMap.set('Parent', 'NestJS GraphQL');
    this.frameworkMap.set('ResolveField', 'NestJS GraphQL');

    // Validation and Transformation
    this.frameworkMap.set('IsString', 'NestJS Validation');
    this.frameworkMap.set('IsNumber', 'NestJS Validation');
    this.frameworkMap.set('IsEmail', 'NestJS Validation');
    this.frameworkMap.set('IsOptional', 'NestJS Validation');
    this.frameworkMap.set('ValidateNested', 'NestJS Validation');
    this.frameworkMap.set('Transform', 'NestJS Validation');
    this.frameworkMap.set('Type', 'NestJS Validation');

    // Testing
    this.frameworkMap.set('Test', 'NestJS Testing');

    // Categories
    this.categoryMap.set('Module', 'injection');
    this.categoryMap.set('Controller', 'web');
    this.categoryMap.set('Injectable', 'injection');
    this.categoryMap.set('Inject', 'injection');
    this.categoryMap.set('Optional', 'injection');

    // HTTP methods
    this.categoryMap.set('Get', 'web');
    this.categoryMap.set('Post', 'web');
    this.categoryMap.set('Put', 'web');
    this.categoryMap.set('Delete', 'web');
    this.categoryMap.set('Patch', 'web');
    this.categoryMap.set('Options', 'web');
    this.categoryMap.set('Head', 'web');
    this.categoryMap.set('All', 'web');

    // Parameters
    this.categoryMap.set('Param', 'web');
    this.categoryMap.set('Body', 'web');
    this.categoryMap.set('Query', 'web');
    this.categoryMap.set('Headers', 'web');
    this.categoryMap.set('Session', 'web');
    this.categoryMap.set('Req', 'web');
    this.categoryMap.set('Res', 'web');
    this.categoryMap.set('Next', 'web');
    this.categoryMap.set('Ip', 'web');
    this.categoryMap.set('HostParam', 'web');

    // Security and middleware
    this.categoryMap.set('UseGuards', 'security');
    this.categoryMap.set('UseInterceptors', 'web');
    this.categoryMap.set('UsePipes', 'validation');
    this.categoryMap.set('UseFilters', 'web');
    this.categoryMap.set('SetMetadata', 'web');

    // Lifecycle
    this.categoryMap.set('OnModuleInit', 'lifecycle');
    this.categoryMap.set('OnApplicationBootstrap', 'lifecycle');
    this.categoryMap.set('OnModuleDestroy', 'lifecycle');
    this.categoryMap.set('BeforeApplicationShutdown', 'lifecycle');
    this.categoryMap.set('OnApplicationShutdown', 'lifecycle');

    // WebSocket
    this.categoryMap.set('WebSocketGateway', 'events');
    this.categoryMap.set('SubscribeMessage', 'events');
    this.categoryMap.set('MessageBody', 'events');
    this.categoryMap.set('ConnectedSocket', 'events');
    this.categoryMap.set('WebSocketServer', 'events');

    // Microservices
    this.categoryMap.set('MessagePattern', 'events');
    this.categoryMap.set('EventPattern', 'events');
    this.categoryMap.set('Client', 'events');

    // GraphQL
    this.categoryMap.set('Resolver', 'web');
    this.categoryMap.set('Query', 'web');
    this.categoryMap.set('Mutation', 'web');
    this.categoryMap.set('Subscription', 'events');
    this.categoryMap.set('Args', 'web');
    this.categoryMap.set('Context', 'web');
    this.categoryMap.set('Info', 'web');
    this.categoryMap.set('Parent', 'web');
    this.categoryMap.set('ResolveField', 'web');

    // Validation
    this.categoryMap.set('IsString', 'validation');
    this.categoryMap.set('IsNumber', 'validation');
    this.categoryMap.set('IsEmail', 'validation');
    this.categoryMap.set('IsOptional', 'validation');
    this.categoryMap.set('ValidateNested', 'validation');
    this.categoryMap.set('Transform', 'validation');
    this.categoryMap.set('Type', 'validation');

    // Testing
    this.categoryMap.set('Test', 'testing');
  }

  private initializeImportPatterns(): void {
    // NestJS Core - Very high confidence
    this.addImportPattern('@nestjs/common', 95);
    this.addImportPattern('@nestjs/core', 95);
    this.addImportPattern('@nestjs/platform-express', 90);
    this.addImportPattern('@nestjs/platform-fastify', 90);
    
    // NestJS Testing
    this.addImportPattern('@nestjs/testing', 95);
    
    // NestJS GraphQL
    this.addImportPattern('@nestjs/graphql', 90, 'NestJS GraphQL');
    this.addImportPattern('@nestjs/apollo', 85, 'NestJS GraphQL');
    this.addImportPattern('@nestjs/mercurius', 85, 'NestJS GraphQL');
    
    // NestJS Microservices
    this.addImportPattern('@nestjs/microservices', 95);
    
    // NestJS WebSocket
    this.addImportPattern('@nestjs/websockets', 95);
    this.addImportPattern('@nestjs/platform-socket.io', 90);
    this.addImportPattern('@nestjs/platform-ws', 90);
    
    // NestJS Database/ORM
    this.addImportPattern('@nestjs/typeorm', 85);
    this.addImportPattern('@nestjs/mongoose', 85);
    this.addImportPattern('@nestjs/sequelize', 85);
    this.addImportPattern('@nestjs/prisma', 85);
    
    // NestJS Validation
    this.addImportPattern('class-validator', 70, 'NestJS Validation');
    this.addImportPattern('class-transformer', 70, 'NestJS Validation');
    
    // NestJS Security & Auth
    this.addImportPattern('@nestjs/passport', 85);
    this.addImportPattern('@nestjs/jwt', 85);
    this.addImportPattern('@nestjs/throttler', 80);
    
    // NestJS Configuration
    this.addImportPattern('@nestjs/config', 85);
    this.addImportPattern('@nestjs/cache-manager', 80);
    this.addImportPattern('@nestjs/schedule', 80);
    this.addImportPattern('@nestjs/event-emitter', 80);
  }
}