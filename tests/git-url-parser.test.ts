import { GitUrlParser } from '../src/scanner/git/git-url-parser.js';
import { GitError } from '../src/scanner/git/types.js';

describe('GitUrlParser', () => {
  describe('parse', () => {
    it('should parse HTTPS GitHub URLs correctly', () => {
      const url = 'https://github.com/owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('https');
      expect(result.provider).toBe('github');
      expect(result.host).toBe('github.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
      expect(result.originalUrl).toBe(url);
    });

    it('should parse HTTPS URLs without .git suffix', () => {
      const url = 'https://github.com/owner/repo';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('https');
      expect(result.provider).toBe('github');
      expect(result.host).toBe('github.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse SSH GitHub URLs correctly', () => {
      const url = 'git@github.com:owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('ssh');
      expect(result.provider).toBe('github');
      expect(result.host).toBe('github.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse GitLab URLs correctly', () => {
      const url = 'https://gitlab.com/owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('https');
      expect(result.provider).toBe('gitlab');
      expect(result.host).toBe('gitlab.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse Bitbucket URLs correctly', () => {
      const url = 'https://bitbucket.org/owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('https');
      expect(result.provider).toBe('bitbucket');
      expect(result.host).toBe('bitbucket.org');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse custom Git server URLs correctly', () => {
      const url = 'https://git.company.com/owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('https');
      expect(result.provider).toBe('custom');
      expect(result.host).toBe('git.company.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should parse git protocol URLs correctly', () => {
      const url = 'git://github.com/owner/repo.git';
      const result = GitUrlParser.parse(url);
      
      expect(result.protocol).toBe('git');
      expect(result.provider).toBe('github');
      expect(result.host).toBe('github.com');
      expect(result.owner).toBe('owner');
      expect(result.repo).toBe('repo');
    });

    it('should throw error for invalid URLs', () => {
      expect(() => GitUrlParser.parse('')).toThrow(GitError);
      expect(() => GitUrlParser.parse('not-a-url')).toThrow(GitError);
      expect(() => GitUrlParser.parse('https://github.com')).toThrow(GitError);
    });

    it('should throw error for null/undefined URLs', () => {
      expect(() => GitUrlParser.parse(null as any)).toThrow(GitError);
      expect(() => GitUrlParser.parse(undefined as any)).toThrow(GitError);
    });
  });

  describe('isGitUrl', () => {
    it('should return true for valid git URLs', () => {
      expect(GitUrlParser.isGitUrl('https://github.com/owner/repo.git')).toBe(true);
      expect(GitUrlParser.isGitUrl('git@github.com:owner/repo.git')).toBe(true);
      expect(GitUrlParser.isGitUrl('git://github.com/owner/repo.git')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(GitUrlParser.isGitUrl('')).toBe(false);
      expect(GitUrlParser.isGitUrl('not-a-url')).toBe(false);
      expect(GitUrlParser.isGitUrl('https://github.com')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should return valid=true for valid URLs', () => {
      const result = GitUrlParser.validateUrl('https://github.com/owner/repo.git');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid=false with error for invalid URLs', () => {
      const result = GitUrlParser.validateUrl('invalid-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize SSH URLs to HTTPS', () => {
      const parsedUrl = GitUrlParser.parse('git@github.com:owner/repo.git');
      const normalized = GitUrlParser.normalizeUrl(parsedUrl);
      expect(normalized).toBe('https://github.com/owner/repo.git');
    });

    it('should keep HTTPS URLs as-is', () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const normalized = GitUrlParser.normalizeUrl(parsedUrl);
      expect(normalized).toBe('https://github.com/owner/repo.git');
    });
  });

  describe('buildCloneUrl', () => {
    it('should build HTTPS clone URL', () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const cloneUrl = GitUrlParser.buildCloneUrl(parsedUrl);
      expect(cloneUrl).toBe('https://github.com/owner/repo.git');
    });

    it('should build SSH clone URL', () => {
      const parsedUrl = GitUrlParser.parse('git@github.com:owner/repo.git');
      const cloneUrl = GitUrlParser.buildCloneUrl(parsedUrl);
      expect(cloneUrl).toBe('git@github.com:owner/repo.git');
    });

    it('should build GitHub clone URL with token', () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const cloneUrl = GitUrlParser.buildCloneUrl(parsedUrl, 'token123');
      expect(cloneUrl).toBe('https://token123@github.com/owner/repo.git');
    });

    it('should build GitLab clone URL with token', () => {
      const parsedUrl = GitUrlParser.parse('https://gitlab.com/owner/repo.git');
      const cloneUrl = GitUrlParser.buildCloneUrl(parsedUrl, 'token123');
      expect(cloneUrl).toBe('https://oauth2:token123@gitlab.com/owner/repo.git');
    });
  });
});