import { simpleGit, SimpleGit, GitError as SimpleGitError } from 'simple-git';
import tmp from 'tmp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ParsedGitUrl, RepositoryInfo, CloneOptions, GitError, GitAuthConfig, CloneProgress } from './types.js';
import { GitUrlParser } from './git-url-parser.js';
import { GitAuthManager } from './git-auth-manager.js';
import { GitCacheManager } from './git-cache-manager.js';

export class GitRepositoryManager {
  private git: SimpleGit;
  private authManager: GitAuthManager;
  private cacheManager: GitCacheManager;

  constructor(authConfig: GitAuthConfig = {}) {
    this.git = simpleGit();
    this.authManager = new GitAuthManager(authConfig);
    this.cacheManager = new GitCacheManager();
  }

  async cloneRepository(url: string, options: CloneOptions = {}): Promise<string> {
    const parsedUrl = GitUrlParser.parse(url);
    const branch = options.branch || 'main';
    
    // Initialize cache manager if caching is enabled
    if (options.useCache) {
      await this.cacheManager.initialize();
    }
    
    // Progress reporting helper
    const reportProgress = (progress: CloneProgress) => {
      if (options.progressCallback) {
        options.progressCallback(progress);
      }
    };
    
    // Check cache first if enabled
    if (options.useCache && !options.cacheOptions?.forceRefresh) {
      reportProgress({
        stage: 'validating',
        message: 'Checking cache for existing repository...'
      });
      
      const cachedPath = await this.cacheManager.getCachedRepository(parsedUrl, branch);
      if (cachedPath) {
        console.log(`📦 Using cached repository: ${cachedPath}`);
        reportProgress({
          stage: 'completed',
          message: 'Repository loaded from cache',
          percentage: 100
        });
        return cachedPath;
      }
    }
    
    reportProgress({
      stage: 'validating',
      message: 'Loading authentication configuration...'
    });
    
    // Load authentication configuration
    await this.authManager.loadAuthFromEnvironment();
    await this.authManager.loadSSHConfig();
    
    // Validate authentication
    const authValidation = this.authManager.validateAuthentication(parsedUrl);
    if (authValidation.warnings?.length) {
      authValidation.warnings.forEach(warning => 
        console.warn(`⚠️  Authentication warning: ${warning}`)
      );
    }
    
    reportProgress({
      stage: 'cloning',
      message: 'Creating temporary directory...',
      percentage: 10
    });
    
    // Create temporary directory
    const tempDir = await this.createTempDirectory(options.tempDir);
    
    try {
      // Get authentication details
      const authDetails = this.authManager.getAuthForRepository(parsedUrl);
      
      // Use auth override if provided, otherwise use configured auth
      const cloneUrl = options.auth?.token 
        ? this.buildAuthenticatedUrlWithToken(parsedUrl, options.auth.token)
        : authDetails.cloneUrl;
      
      // Prepare clone options
      const cloneArgs = this.buildCloneArgs(options);
      
      console.log(`🔐 Authentication method: ${authValidation.method}`);
      console.log(`📥 Cloning repository: ${parsedUrl.owner}/${parsedUrl.repo}`);
      console.log(`📁 Target directory: ${tempDir}`);
      
      reportProgress({
        stage: 'cloning',
        message: `Cloning ${parsedUrl.owner}/${parsedUrl.repo}...`,
        percentage: 30
      });
      
      // Set environment variables if needed
      const originalEnv = process.env;
      if (authDetails.envVars) {
        Object.assign(process.env, authDetails.envVars);
      }
      
      try {
        // Clone the repository with progress tracking
        const git = simpleGit({
          progress: ({ stage, progress }) => {
            const percentage = 30 + (progress * 0.6); // 30-90% for cloning
            reportProgress({
              stage: 'cloning',
              message: `${stage}: ${Math.round(percentage)}%`,
              percentage
            });
          }
        });
        
        await git.clone(cloneUrl, tempDir, cloneArgs);
        console.log(`✅ Successfully cloned repository to: ${tempDir}`);
        
        reportProgress({
          stage: 'cloning',
          message: 'Repository cloned successfully',
          percentage: 90
        });
      } finally {
        // Restore original environment
        if (authDetails.envVars) {
          process.env = originalEnv;
        }
      }
      
      // Add to cache if caching is enabled
      if (options.useCache) {
        reportProgress({
          stage: 'caching',
          message: 'Adding repository to cache...',
          percentage: 95
        });
        
        try {
          const cachedPath = await this.cacheManager.addToCache(parsedUrl, branch, tempDir);
          console.log(`📦 Repository cached at: ${cachedPath}`);
          
          // Return cached path instead of temp path
          reportProgress({
            stage: 'completed',
            message: 'Repository cached successfully',
            percentage: 100
          });
          
          return cachedPath;
        } catch (cacheError) {
          console.warn('Failed to cache repository, continuing with temporary directory:', cacheError);
        }
      }
      
      reportProgress({
        stage: 'completed',
        message: 'Repository ready for scanning',
        percentage: 100
      });
      
      return tempDir;
    } catch (error) {
      // Clean up on failure
      await this.cleanup(tempDir);
      
      if (error instanceof SimpleGitError) {
        // Provide more helpful error messages
        let errorMessage = `Failed to clone repository: ${error.message}`;
        if (error.message.includes('Authentication failed')) {
          errorMessage += '\n  💡 Check your authentication tokens or SSH keys';
        } else if (error.message.includes('not found')) {
          errorMessage += '\n  💡 Verify the repository URL and access permissions';
        }
        
        throw new GitError(errorMessage, 'CLONE_FAILED', url);
      }
      
      throw new GitError(
        `Unexpected error cloning repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLONE_FAILED',
        url
      );
    }
  }

  async validateRepository(url: string): Promise<RepositoryInfo> {
    const parsedUrl = GitUrlParser.parse(url);
    
    try {
      // Load authentication configuration
      await this.authManager.loadAuthFromEnvironment();
      await this.authManager.loadSSHConfig();
      
      // Get authentication details
      const authDetails = this.authManager.getAuthForRepository(parsedUrl);
      
      // Use git ls-remote to check if repository exists and is accessible
      const result = await this.git.listRemote([authDetails.cloneUrl]);
      
      if (!result) {
        throw new GitError(
          'Repository not found or not accessible',
          'REPOSITORY_NOT_FOUND',
          url
        );
      }

      return {
        name: parsedUrl.repo,
        fullName: `${parsedUrl.owner}/${parsedUrl.repo}`,
        url: parsedUrl.originalUrl,
        branch: parsedUrl.branch || 'main'
      };
    } catch (error) {
      if (error instanceof GitError) {
        throw error;
      }
      
      if (error instanceof SimpleGitError) {
        throw new GitError(
          `Failed to validate repository: ${error.message}`,
          'VALIDATION_FAILED',
          url
        );
      }
      
      throw new GitError(
        `Unexpected error validating repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'VALIDATION_FAILED',
        url
      );
    }
  }

  async cleanup(tempPath: string): Promise<void> {
    try {
      console.log(`Cleaning up temporary directory: ${tempPath}`);
      await fs.rm(tempPath, { recursive: true, force: true });
      console.log(`Successfully cleaned up: ${tempPath}`);
    } catch (error) {
      console.warn(`Failed to clean up temporary directory ${tempPath}:`, error);
      // Don't throw on cleanup failure - it's not critical
    }
  }

  parseGitUrl(url: string): ParsedGitUrl {
    return GitUrlParser.parse(url);
  }

  isGitUrl(url: string): boolean {
    return GitUrlParser.isGitUrl(url);
  }

  private async createTempDirectory(preferredPath?: string): Promise<string> {
    if (preferredPath) {
      await fs.mkdir(preferredPath, { recursive: true });
      return preferredPath;
    }

    return new Promise((resolve, reject) => {
      tmp.dir({ 
        prefix: 'coderag-git-',
        keep: false, // Will be cleaned up manually
        unsafeCleanup: true 
      }, (err, path) => {
        if (err) {
          reject(new GitError('Failed to create temporary directory', 'TEMP_DIR_FAILED'));
        } else {
          resolve(path);
        }
      });
    });
  }


  private buildCloneArgs(options: CloneOptions): string[] {
    const args: string[] = [];

    if (options.branch) {
      args.push('--branch', options.branch);
    }

    if (options.depth) {
      args.push('--depth', options.depth.toString());
    }

    if (options.singleBranch !== false) {
      args.push('--single-branch');
    }

    return args;
  }

  updateAuthConfig(newConfig: GitAuthConfig): void {
    this.authManager.updateAuthConfig(newConfig);
  }

  getAuthConfig(): GitAuthConfig {
    return this.authManager.getAuthConfig();
  }

  private buildAuthenticatedUrlWithToken(parsedUrl: ParsedGitUrl, token: string): string {
    return GitUrlParser.buildCloneUrl(parsedUrl, token);
  }

  async getCacheStats() {
    await this.cacheManager.initialize();
    return this.cacheManager.getCacheStats();
  }

  async clearCache(): Promise<void> {
    await this.cacheManager.clearCache();
  }

  async getCacheManager(): Promise<GitCacheManager> {
    await this.cacheManager.initialize();
    return this.cacheManager;
  }
}