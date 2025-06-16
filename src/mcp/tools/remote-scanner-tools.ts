import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { Neo4jClient } from '../../graph/neo4j-client.js';
import { CodebaseScanner } from '../../scanner/codebase-scanner.js';
import { Language } from '../../scanner/types.js';
import { z } from 'zod';

const scanRemoteRepoSchema = z.object({
  gitUrl: z.string().describe('Git repository URL (HTTPS, SSH, or Git protocol)'),
  projectId: z.string().optional().describe('Project ID for multi-project separation'),
  projectName: z.string().optional().describe('Project name'),
  languages: z.array(z.enum(['typescript', 'javascript', 'java', 'python', 'csharp'])).optional()
    .describe('Languages to scan (auto-detected if not specified)'),
  branch: z.string().optional().default('main').describe('Git branch to scan'),
  includeTests: z.boolean().optional().default(false).describe('Include test files in scan'),
  useCache: z.boolean().optional().default(false).describe('Enable repository caching'),
  clearGraph: z.boolean().optional().default(false).describe('Clear existing project data'),
  analyze: z.boolean().optional().default(false).describe('Run quality analysis after scanning')
});

const validateRemoteRepoSchema = z.object({
  gitUrl: z.string().describe('Git repository URL to validate')
});

const gitCacheStatsSchema = z.object({});

const clearGitCacheSchema = z.object({});

export function createRemoteScannerTools(client: Neo4jClient): Tool[] {
  const scanner = new CodebaseScanner(client);

  return [
    {
      name: 'scan_remote_repo',
      description: 'Scan a remote Git repository and populate the graph database. Supports GitHub, GitLab, Bitbucket, and custom Git servers.',
      inputSchema: {
        type: 'object',
        properties: {
          gitUrl: {
            type: 'string',
            description: 'Git repository URL (HTTPS, SSH, or Git protocol). Examples: https://github.com/owner/repo.git, git@github.com:owner/repo.git'
          },
          projectId: {
            type: 'string',
            description: 'Project ID for multi-project separation. Auto-generated from repository if not provided.'
          },
          projectName: {
            type: 'string',
            description: 'Project name for display purposes'
          },
          languages: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['typescript', 'javascript', 'java', 'python', 'csharp']
            },
            description: 'Languages to scan. Auto-detected from repository if not specified.'
          },
          branch: {
            type: 'string',
            default: 'main',
            description: 'Git branch to scan'
          },
          includeTests: {
            type: 'boolean',
            default: false,
            description: 'Include test files in the scan'
          },
          useCache: {
            type: 'boolean',
            default: false,
            description: 'Enable repository caching for faster subsequent scans'
          },
          clearGraph: {
            type: 'boolean',
            default: false,
            description: 'Clear existing project data before scanning'
          },
          analyze: {
            type: 'boolean',
            default: false,
            description: 'Run quality analysis after scanning'
          }
        },
        required: ['gitUrl']
      }
    },

    {
      name: 'validate_remote_repo',
      description: 'Validate that a remote Git repository is accessible and can be scanned.',
      inputSchema: {
        type: 'object',
        properties: {
          gitUrl: {
            type: 'string',
            description: 'Git repository URL to validate'
          }
        },
        required: ['gitUrl']
      }
    },

    {
      name: 'git_cache_stats',
      description: 'Get statistics about the Git repository cache, including number of cached repositories and total size.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    },

    {
      name: 'clear_git_cache',
      description: 'Clear all cached Git repositories to free up disk space.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  ];
}

export async function handleRemoteScannerTool(
  name: string,
  args: any,
  client: Neo4jClient
): Promise<any> {
  const scanner = new CodebaseScanner(client);

  switch (name) {
    case 'scan_remote_repo': {
      const params = scanRemoteRepoSchema.parse(args);
      
      // Generate project ID from repository if not provided
      let projectId = params.projectId;
      if (!projectId) {
        const parsedUrl = scanner.parseGitUrl(params.gitUrl);
        projectId = `${parsedUrl.owner}-${parsedUrl.repo}`;
      }

      // Clear graph if requested
      if (params.clearGraph) {
        await scanner.clearGraph(projectId);
      }

      // Scan the remote repository
      const result = await scanner.scanRemoteRepository(params.gitUrl, {
        projectId,
        projectName: params.projectName || projectId,
        languages: params.languages || ['typescript', 'javascript', 'java', 'python'],
        includeTests: params.includeTests,
        outputProgress: true,
        gitBranch: params.branch,
        useCache: params.useCache,
        cacheOptions: {
          forceRefresh: false
        }
      });

      // Run quality analysis if requested
      let analysisResult = null;
      if (params.analyze) {
        const { MetricsManager } = await import('../../analysis/metrics-manager.js');
        const metricsManager = new MetricsManager(client);
        
        try {
          // Get architectural issues and project summary
          const architecturalIssues = await metricsManager.findArchitecturalIssues();
          const projectSummary = await metricsManager.calculateProjectSummary();
          
          // Calculate a simple quality score based on issues
          const qualityScore = Math.max(0, Math.min(100, 100 - (architecturalIssues.length * 5)));
          
          analysisResult = {
            architecturalIssues: architecturalIssues.length,
            qualityScore,
            summary: projectSummary
          };
        } catch (error) {
          console.warn('Quality analysis failed:', error);
          analysisResult = {
            error: 'Quality analysis failed',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      return {
        success: true,
        projectId,
        repository: {
          url: params.gitUrl,
          branch: params.branch
        },
        scanResults: {
          filesProcessed: result.stats?.filesProcessed || 0,
          entitiesFound: result.stats?.entitiesFound || 0,
          relationshipsFound: result.stats?.relationshipsFound || 0,
          processingTimeMs: result.stats?.processingTimeMs || 0,
          errors: result.errors?.length || 0
        },
        analysis: analysisResult
      };
    }

    case 'validate_remote_repo': {
      const params = validateRemoteRepoSchema.parse(args);
      
      try {
        const isValid = await scanner.validateRemoteRepository(params.gitUrl);
        
        if (isValid) {
          // Get repository information
          const gitManager = (scanner as any).gitManager;
          const repoInfo = await gitManager.validateRepository(params.gitUrl);
          
          return {
            valid: true,
            repository: repoInfo
          };
        } else {
          return {
            valid: false,
            error: 'Repository validation failed'
          };
        }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown validation error'
        };
      }
    }

    case 'git_cache_stats': {
      gitCacheStatsSchema.parse(args);
      
      const stats = await scanner.getCacheStats();
      
      return {
        cache: {
          entries: stats.entries,
          totalSizeBytes: stats.totalSize,
          totalSizeMB: Math.round(stats.totalSize / 1024 / 1024 * 100) / 100,
          oldestEntry: stats.oldestEntry?.toISOString(),
          newestEntry: stats.newestEntry?.toISOString()
        }
      };
    }

    case 'clear_git_cache': {
      clearGitCacheSchema.parse(args);
      
      const statsBefore = await scanner.getCacheStats();
      await scanner.clearCache();
      
      return {
        success: true,
        clearedEntries: statsBefore.entries,
        freedSpaceBytes: statsBefore.totalSize,
        freedSpaceMB: Math.round(statsBefore.totalSize / 1024 / 1024 * 100) / 100
      };
    }

    default:
      throw new Error(`Unknown remote scanner tool: ${name}`);
  }
}