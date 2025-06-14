import { FrameworkModule } from '../../FrameworkModule.js';

/**
 * Apache Spark framework detection module
 * Handles big data processing and analytics framework
 */
export class SparkFramework extends FrameworkModule {
  constructor() {
    super();
    this.initializeMappings();
  }

  getFrameworkName(): string {
    return 'Apache Spark';
  }

  protected initializeMappings(): void {
    this.initializeAnnotationMappings();
    this.initializeImportPatterns();
  }

  private initializeAnnotationMappings(): void {
    // Spark SQL Annotations (limited annotations in Spark)
    this.frameworkMap.set('Transient', 'Spark');

    // Categories
    this.categoryMap.set('Transient', 'serialization');
  }

  private initializeImportPatterns(): void {
    // Spark Core - High confidence
    this.addImportPattern('org.apache.spark.*', 95, 'Spark');
    this.addImportPattern('org.apache.spark.api.java.*', 95, 'Spark');
    this.addImportPattern('org.apache.spark.api.java.function.*', 90, 'Spark');

    // Spark SQL
    this.addImportPattern('org.apache.spark.sql.*', 95, 'Spark SQL');
    this.addImportPattern('org.apache.spark.sql.types.*', 90, 'Spark SQL');
    this.addImportPattern('org.apache.spark.sql.functions.*', 90, 'Spark SQL');

    // Spark Streaming
    this.addImportPattern('org.apache.spark.streaming.*', 95, 'Spark Streaming');
    this.addImportPattern('org.apache.spark.streaming.api.java.*', 90, 'Spark Streaming');

    // Spark MLlib
    this.addImportPattern('org.apache.spark.mllib.*', 90, 'Spark MLlib');
    this.addImportPattern('org.apache.spark.ml.*', 90, 'Spark ML');

    // Spark GraphX
    this.addImportPattern('org.apache.spark.graphx.*', 85, 'Spark GraphX');

    // Spark Util
    this.addImportPattern('org.apache.spark.util.*', 80, 'Spark');

    // Spark Storage
    this.addImportPattern('org.apache.spark.storage.*', 80, 'Spark');

    // Spark Broadcast
    this.addImportPattern('org.apache.spark.broadcast.*', 80, 'Spark');

    // Spark Serializer
    this.addImportPattern('org.apache.spark.serializer.*', 75, 'Spark');
  }
}