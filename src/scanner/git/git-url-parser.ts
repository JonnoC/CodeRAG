import { ParsedGitUrl, GitError } from './types.js';

export class GitUrlParser {
  private static readonly GIT_URL_PATTERNS = [
    // HTTPS patterns
    /^https?:\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    // SSH patterns
    /^git@([^:]+):([^\/]+)\/([^\/]+?)(?:\.git)?$/,
    // Git protocol patterns
    /^git:\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/
  ];

  private static readonly KNOWN_PROVIDERS = {
    'github.com': 'github',
    'gitlab.com': 'gitlab',
    'bitbucket.org': 'bitbucket'
  } as const;

  static parse(url: string): ParsedGitUrl {
    if (!url || typeof url !== 'string') {
      throw new GitError('Invalid URL: URL must be a non-empty string', 'INVALID_URL', url);
    }

    const trimmedUrl = url.trim();
    
    // Try HTTPS pattern
    const httpsMatch = trimmedUrl.match(/^https?:\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
    if (httpsMatch) {
      const [, host, owner, repo] = httpsMatch;
      return {
        protocol: 'https',
        provider: this.getProvider(host),
        host,
        owner,
        repo: this.cleanRepoName(repo),
        originalUrl: trimmedUrl
      };
    }

    // Try SSH pattern
    const sshMatch = trimmedUrl.match(/^git@([^:]+):([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (sshMatch) {
      const [, host, owner, repo] = sshMatch;
      return {
        protocol: 'ssh',
        provider: this.getProvider(host),
        host,
        owner,
        repo: this.cleanRepoName(repo),
        originalUrl: trimmedUrl
      };
    }

    // Try git protocol pattern
    const gitMatch = trimmedUrl.match(/^git:\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/);
    if (gitMatch) {
      const [, host, owner, repo] = gitMatch;
      return {
        protocol: 'git',
        provider: this.getProvider(host),
        host,
        owner,
        repo: this.cleanRepoName(repo),
        originalUrl: trimmedUrl
      };
    }

    throw new GitError(
      `Unsupported git URL format: ${trimmedUrl}. Supported formats: https://github.com/owner/repo, git@github.com:owner/repo, git://github.com/owner/repo`,
      'UNSUPPORTED_URL_FORMAT',
      trimmedUrl
    );
  }

  static isGitUrl(url: string): boolean {
    try {
      this.parse(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateUrl(url: string): { valid: boolean; error?: string } {
    try {
      this.parse(url);
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof GitError ? error.message : 'Unknown error parsing URL' 
      };
    }
  }

  static normalizeUrl(parsedUrl: ParsedGitUrl): string {
    // Convert to HTTPS format for consistency
    return `https://${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
  }

  static buildCloneUrl(parsedUrl: ParsedGitUrl, useToken?: string): string {
    if (parsedUrl.protocol === 'ssh') {
      return `git@${parsedUrl.host}:${parsedUrl.owner}/${parsedUrl.repo}.git`;
    }

    if (useToken && parsedUrl.provider === 'github') {
      return `https://${useToken}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
    }

    if (useToken && parsedUrl.provider === 'gitlab') {
      return `https://oauth2:${useToken}@${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
    }

    return `https://${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}.git`;
  }

  private static getProvider(host: string): ParsedGitUrl['provider'] {
    const normalizedHost = host.toLowerCase();
    return (this.KNOWN_PROVIDERS[normalizedHost as keyof typeof this.KNOWN_PROVIDERS]) || 'custom';
  }

  private static cleanRepoName(repo: string): string {
    return repo.replace(/\.git$/, '');
  }
}