export interface ParsedGitUrl {
  protocol: 'https' | 'ssh' | 'git';
  provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
  host: string;
  owner: string;
  repo: string;
  branch?: string;
  originalUrl: string;
}

export interface RepositoryInfo {
  name: string;
  fullName: string;
  url: string;
  branch: string;
  isPrivate?: boolean;
  size?: number;
}

export interface CloneOptions {
  branch?: string;
  depth?: number;
  singleBranch?: boolean;
  tempDir?: string;
  useCache?: boolean;
  cacheOptions?: {
    maxAge?: number;
    forceRefresh?: boolean;
  };
  progressCallback?: (progress: CloneProgress) => void;
  auth?: {
    token?: string;
    username?: string;
    password?: string;
  };
}

export interface CloneProgress {
  stage: 'validating' | 'cloning' | 'caching' | 'completed';
  message: string;
  percentage?: number;
}

export interface GitAuthConfig {
  github?: {
    token?: string;
  };
  gitlab?: {
    token?: string;
    host?: string;
  };
  bitbucket?: {
    username?: string;
    appPassword?: string;
  };
  ssh?: {
    privateKey?: string;
  };
}

export class GitError extends Error {
  constructor(message: string, public readonly code?: string, public readonly url?: string) {
    super(message);
    this.name = 'GitError';
  }
}