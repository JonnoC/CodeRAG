#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from '../config.js';
import { Neo4jClient } from '../graph/neo4j-client.js';
import { CodebaseScanner } from '../scanner/codebase-scanner.js';
import { MetricsManager } from '../analysis/metrics-manager.js';
import { ScanConfig, Language } from '../scanner/types.js';

const program = new Command();

program
  .name('coderag-scan')
  .description('Scan a codebase and populate the CodeRAG graph database')
  .version('1.0.0');

program
  .argument('<project-path>', 'Path to the project directory to scan')
  .option('-p, --project-id <id>', 'Project ID for multi-project separation')
  .option('-n, --project-name <name>', 'Project name (defaults to project ID or directory name)')
  .option('-l, --languages <languages>', 'Comma-separated list of languages to scan (auto-detected if not specified)')
  .option('-e, --exclude <paths>', 'Comma-separated list of paths to exclude', 'node_modules,dist,build')
  .option('--include-tests', 'Include test files in the scan', false)
  .option('--clear-graph', 'Clear existing graph data for this project before scanning', false)
  .option('--clear-all', 'Clear ALL graph data (all projects) before scanning', false)
  .option('--analyze', 'Run quality analysis after scanning', false)
  .option('--output-report', 'Generate and save a scan report', false)
  .option('--validate-only', 'Only validate the project structure without scanning', false)
  .option('-v, --verbose', 'Show detailed progress information', false)
  .action(async (projectPath: string, options) => {
    try {
      // Resolve and validate project path
      const resolvedPath = path.resolve(projectPath);
      
      if (!fs.existsSync(resolvedPath)) {
        console.error(`❌ Project path does not exist: ${resolvedPath}`);
        process.exit(1);
      }

      console.log(`🚀 CodeRAG Scanner v1.0.0`);
      console.log(`📁 Project: ${resolvedPath}`);

      // Initialize Neo4j connection
      const config = getConfig();
      const client = new Neo4jClient(config);
      await client.connect();
      console.log(`🔗 Connected to Neo4j: ${config.uri}`);

      // Initialize scanner
      const scanner = new CodebaseScanner(client);

      // Get recommended scan configuration with auto-detection
      console.log(`🔍 Analyzing project structure and detecting languages...`);
      const projectId = options.projectId || path.basename(resolvedPath);
      const recommendation = await scanner.getRecommendedScanConfig(resolvedPath, projectId);
      
      console.log(`\n📋 Project Analysis:`);
      recommendation.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
      
      // Show detected project metadata
      if (recommendation.projectMetadata.length > 0) {
        console.log(`\n📦 Project Metadata:`);
        recommendation.projectMetadata.forEach(meta => {
          console.log(`  📄 ${meta.name || 'Unnamed'} (${meta.language})`);
          if (meta.version) console.log(`    Version: ${meta.version}`);
          if (meta.description) console.log(`    Description: ${meta.description}`);
          if (meta.framework) console.log(`    Framework: ${meta.framework}`);
          if (meta.buildSystem) console.log(`    Build System: ${meta.buildSystem}`);
        });
      }
      
      if (!recommendation.scanConfig.languages?.length) {
        console.error(`\n❌ No supported languages detected. Please check the project structure.`);
        await client.disconnect();
        process.exit(1);
      }
      
      if (options.validateOnly) {
        console.log(`\n✅ Project structure validation completed.`);
        await client.disconnect();
        return;
      }
      
      // Use recommended configuration, but allow CLI overrides
      const languages = options.languages ? 
        options.languages.split(',').map((l: string) => l.trim()) as Language[] : 
        recommendation.scanConfig.languages;
        
      const excludePaths = options.exclude ? 
        options.exclude.split(',').map((p: string) => p.trim()) :
        recommendation.scanConfig.excludePaths || ['node_modules', 'dist', 'build'];
        
      const projectName = options.projectName || 
        recommendation.scanConfig.projectName || 
        projectId;
      
      console.log(`📋 Project ID: ${projectId}`);
      console.log(`📋 Project Name: ${projectName}`);

      // Prepare scan configuration
      const scanConfig: ScanConfig = {
        projectPath: resolvedPath,
        projectId,
        projectName,
        languages,
        excludePaths,
        includeTests: options.includeTests,
        outputProgress: options.verbose
      };

      console.log(`\n⚙️ Scan Configuration:`);
      console.log(`  Languages: ${languages.join(', ')}`);
      console.log(`  Include tests: ${options.includeTests ? 'yes' : 'no'}`);
      console.log(`  Exclude paths: ${excludePaths.join(', ')}`);

      // Clear graph if requested
      if (options.clearAll) {
        await scanner.clearGraph(); // Clear all data
      } else if (options.clearGraph) {
        await scanner.clearGraph(projectId); // Clear only this project
      }

      // Initialize database schema
      await client.initializeDatabase();

      // Perform the scan
      console.log(`\n🔄 Starting codebase scan...`);
      const result = await scanner.scanProject(scanConfig);

      // Generate and display report
      const report = await scanner.generateScanReport(result);
      console.log(report);

      // Save report if requested
      if (options.outputReport) {
        const reportPath = path.join(resolvedPath, 'coderag-scan-report.txt');
        await fs.promises.writeFile(reportPath, report);
        console.log(`📄 Report saved to: ${reportPath}`);
      }

      // Run quality analysis if requested
      if (options.analyze) {
        console.log(`\n🔬 Running quality analysis...`);
        const metricsManager = new MetricsManager(client);
        const summary = await metricsManager.calculateProjectSummary();
        const issues = await metricsManager.findArchitecturalIssues();

        console.log(`\n📊 QUALITY ANALYSIS RESULTS`);
        console.log(`═══════════════════════════`);
        console.log(`📈 Project Metrics:`);
        console.log(`  Total Classes: ${summary.totalClasses}`);
        console.log(`  Total Methods: ${summary.totalMethods}`);
        console.log(`  Total Packages: ${summary.totalPackages}`);
        console.log(`  Average Coupling: ${summary.averageMetrics.avgCBO.toFixed(2)}`);
        console.log(`  Average RFC: ${summary.averageMetrics.avgRFC.toFixed(2)}`);
        console.log(`  Average DIT: ${summary.averageMetrics.avgDIT.toFixed(2)}`);

        console.log(`\n⚠️ Issues Found: ${issues.length}`);
        if (issues.length > 0) {
          issues.slice(0, 5).forEach((issue, index) => {
            console.log(`  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
          });
          if (issues.length > 5) {
            console.log(`  ... and ${issues.length - 5} more issues`);
          }
        }

      }


      await client.disconnect();
      console.log(`\n✅ Scan completed successfully!`);

    } catch (error) {
      console.error(`\n❌ Scan failed:`, error instanceof Error ? error.message : String(error));
      if (options.verbose) {
        console.error(error instanceof Error ? error.stack : error);
      }
      process.exit(1);
    }
  });

// Add a command to clear the graph
program
  .command('clear')
  .description('Clear all data from the CodeRAG graph database')
  .option('-f, --force', 'Force clear without confirmation', false)
  .action(async (options) => {
    try {
      if (!options.force) {
        console.log(`⚠️  This will permanently delete all data in your CodeRAG graph database.`);
        console.log(`Use --force flag to confirm this action.`);
        process.exit(1);
      }

      const config = getConfig();
      const client = new Neo4jClient(config);
      await client.connect();

      const scanner = new CodebaseScanner(client);
      await scanner.clearGraph();

      await client.disconnect();
      console.log(`✅ Graph database cleared successfully.`);

    } catch (error) {
      console.error(`❌ Failed to clear graph:`, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add a command to validate project structure
program
  .command('validate <project-path>')
  .description('Validate project structure and detect languages')
  .action(async (projectPath: string) => {
    try {
      const resolvedPath = path.resolve(projectPath);
      
      const config = getConfig();
      const client = new Neo4jClient(config);
      await client.connect();

      const scanner = new CodebaseScanner(client);
      const validation = await scanner.validateProjectStructure(resolvedPath);

      console.log(`📁 Project: ${resolvedPath}`);
      console.log(`✅ Valid: ${validation.isValid ? 'Yes' : 'No'}`);
      console.log(`🔤 Languages detected: ${validation.detectedLanguages.join(', ') || 'None'}`);
      console.log(`\n📋 Analysis:`);
      validation.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));

      await client.disconnect();

    } catch (error) {
      console.error(`❌ Validation failed:`, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

export default program;