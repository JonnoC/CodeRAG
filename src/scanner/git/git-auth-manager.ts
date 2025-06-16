import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { GitAuthConfig, ParsedGitUrl, GitError } from './types.js';

export class GitAuthManager {
  private authConfig: GitAuthConfig;

  constructor(initialConfig: GitAuthConfig = {}) {
    this.authConfig = { ...initialConfig };
  }

  async loadAuthFromEnvironment(): Promise<void> {
    // Load from environment variables
    const envAuth: GitAuthConfig = {
      github: {
        token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN
      },
      gitlab: {
        token: process.env.GITLAB_TOKEN || process.env.GL_TOKEN,
        host: process.env.GITLAB_HOST
      },
      bitbucket: {
        username: process.env.BITBUCKET_USERNAME,
        appPassword: process.env.BITBUCKET_APP_PASSWORD
      }
    };

    this.updateAuthConfig(envAuth);
  }

  async loadSSHConfig(): Promise<void> {
    try {
      const sshDir = path.join(os.homedir(), '.ssh');
      const privateKeyPath = path.join(sshDir, 'id_rsa');
      
      if (await this.fileExists(privateKeyPath)) {
        this.authConfig.ssh = {
          privateKey: privateKeyPath
        };
      }
    } catch (error) {
      // SSH config is optional, don't throw
      console.debug('SSH config not available:', error);
    }
  }

  getAuthForRepository(parsedUrl: ParsedGitUrl): {
    cloneUrl: string;
    envVars?: Record<string, string>;
  } {
    if (parsedUrl.protocol === 'ssh') {
      return {
        cloneUrl: `git@${parsedUrl.host}:${parsedUrl.owner}/${parsedUrl.repo}.git`
      };
    }

    // Handle token-based authentication
    const providerConfig = this.getProviderConfig(parsedUrl.provider);
    
    if (providerConfig && 'token' in providerConfig && providerConfig.token) {
      return {
        cloneUrl: this.buildAuthenticatedUrl(parsedUrl, providerConfig.token),
        envVars: this.getEnvironmentVariables(parsedUrl.provider, providerConfig)
      };
    }

    // Return public URL
    return {
      cloneUrl: `https://${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`
    };
  }

  validateAuthentication(parsedUrl: ParsedGitUrl): {
    isValid: boolean;
    method: 'ssh' | 'token' | 'public' | 'none';
    warnings?: string[];
  } {
    const warnings: string[] = [];

    if (parsedUrl.protocol === 'ssh') {
      const hasSSHKey = !!this.authConfig.ssh?.privateKey;
      return {
        isValid: hasSSHKey,
        method: 'ssh',
        warnings: hasSSHKey ? [] : ['SSH private key not found']
      };
    }

    const providerConfig = this.getProviderConfig(parsedUrl.provider);
    
    if (providerConfig && 'token' in providerConfig && providerConfig.token) {
      const isTokenValid = this.validateToken(providerConfig.token);
      return {
        isValid: isTokenValid,
        method: 'token',
        warnings: isTokenValid ? [] : ['Token appears to be invalid format']
      };
    }

    return {
      isValid: true,
      method: 'public',
      warnings: ['Using public access - private repositories will fail']
    };
  }

  updateAuthConfig(newConfig: GitAuthConfig): void {
    this.authConfig = this.mergeAuthConfigs(this.authConfig, newConfig);
  }

  getAuthConfig(): GitAuthConfig {
    return JSON.parse(JSON.stringify(this.authConfig)); // Deep clone
  }

  clearAuthConfig(): void {
    this.authConfig = {};
  }

  // Security: Clear sensitive data from memory
  dispose(): void {
    this.clearAuthConfig();
  }

  private getProviderConfig(provider: ParsedGitUrl['provider']) {
    switch (provider) {
      case 'github':
        return this.authConfig.github;
      case 'gitlab':
        return this.authConfig.gitlab;
      case 'bitbucket':
        return this.authConfig.bitbucket;
      default:
        return null;
    }
  }

  private buildAuthenticatedUrl(parsedUrl: ParsedGitUrl, token: string): string {
    switch (parsedUrl.provider) {
      case 'github':
        return `https://${token}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
      case 'gitlab':
        return `https://oauth2:${token}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
      case 'bitbucket':
        const config = this.authConfig.bitbucket;
        if (config?.username && config.appPassword) {
          return `https://${config.username}:${config.appPassword}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
        }
        return `https://${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
      default:
        return `https://${token}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
    }
  }

  private getEnvironmentVariables(provider: ParsedGitUrl['provider'], config: any): Record<string, string> {
    const envVars: Record<string, string> = {};

    // Add provider-specific environment variables that might be needed
    if (provider === 'gitlab' && config.host) {
      envVars['GITLAB_HOST'] = config.host;
    }

    return envVars;
  }

  private validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic token format validation
    if (token.startsWith('ghp_') && token.length >= 36) return true; // GitHub
    if (token.startsWith('glpat-') && token.length >= 20) return true; // GitLab
    if (token.length >= 10) return true; // Generic token

    return false;
  }

  private mergeAuthConfigs(base: GitAuthConfig, override: GitAuthConfig): GitAuthConfig {
    return {
      github: { ...base.github, ...override.github },
      gitlab: { ...base.gitlab, ...override.gitlab },
      bitbucket: { ...base.bitbucket, ...override.bitbucket },
      ssh: { ...base.ssh, ...override.ssh }
    };
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}