import { GitAuthManager } from '../src/scanner/git/git-auth-manager.js';
import { GitUrlParser } from '../src/scanner/git/git-url-parser.js';

describe('GitAuthManager', () => {
  let authManager: GitAuthManager;

  beforeEach(() => {
    authManager = new GitAuthManager();
  });

  describe('loadAuthFromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should load GitHub token from environment', async () => {
      process.env.GITHUB_TOKEN = 'ghp_test_token';
      
      await authManager.loadAuthFromEnvironment();
      const config = authManager.getAuthConfig();
      
      expect(config.github?.token).toBe('ghp_test_token');
    });

    it('should load GitLab token and host from environment', async () => {
      process.env.GITLAB_TOKEN = 'glpat-test_token';
      process.env.GITLAB_HOST = 'gitlab.company.com';
      
      await authManager.loadAuthFromEnvironment();
      const config = authManager.getAuthConfig();
      
      expect(config.gitlab?.token).toBe('glpat-test_token');
      expect(config.gitlab?.host).toBe('gitlab.company.com');
    });

    it('should load Bitbucket credentials from environment', async () => {
      process.env.BITBUCKET_USERNAME = 'testuser';
      process.env.BITBUCKET_APP_PASSWORD = 'testpass';
      
      await authManager.loadAuthFromEnvironment();
      const config = authManager.getAuthConfig();
      
      expect(config.bitbucket?.username).toBe('testuser');
      expect(config.bitbucket?.appPassword).toBe('testpass');
    });
  });

  describe('getAuthForRepository', () => {
    it('should return SSH clone URL for SSH protocol', () => {
      const parsedUrl = GitUrlParser.parse('git@github.com:owner/repo.git');
      const authDetails = authManager.getAuthForRepository(parsedUrl);
      
      expect(authDetails.cloneUrl).toBe('git@github.com:owner/repo.git');
    });

    it('should return authenticated GitHub URL with token', () => {
      authManager.updateAuthConfig({
        github: { token: 'ghp_test_token' }
      });
      
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const authDetails = authManager.getAuthForRepository(parsedUrl);
      
      expect(authDetails.cloneUrl).toBe('https://ghp_test_token@github.com/owner/repo.git');
    });

    it('should return authenticated GitLab URL with token', () => {
      authManager.updateAuthConfig({
        gitlab: { token: 'glpat-test_token' }
      });
      
      const parsedUrl = GitUrlParser.parse('https://gitlab.com/owner/repo.git');
      const authDetails = authManager.getAuthForRepository(parsedUrl);
      
      expect(authDetails.cloneUrl).toBe('https://oauth2:glpat-test_token@gitlab.com/owner/repo.git');
    });

    it('should return public URL when no authentication available', () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const authDetails = authManager.getAuthForRepository(parsedUrl);
      
      expect(authDetails.cloneUrl).toBe('https://github.com/owner/repo.git');
    });
  });

  describe('validateAuthentication', () => {
    it('should validate SSH authentication', () => {
      authManager.updateAuthConfig({
        ssh: { privateKey: '/path/to/key' }
      });
      
      const parsedUrl = GitUrlParser.parse('git@github.com:owner/repo.git');
      const validation = authManager.validateAuthentication(parsedUrl);
      
      expect(validation.method).toBe('ssh');
      expect(validation.isValid).toBe(true);
    });

    it('should validate token authentication', () => {
      authManager.updateAuthConfig({
        github: { token: 'ghp_valid_token_123456789012345678901234567890' }
      });
      
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const validation = authManager.validateAuthentication(parsedUrl);
      
      expect(validation.method).toBe('token');
      expect(validation.isValid).toBe(true);
    });

    it('should warn about invalid token format', () => {
      authManager.updateAuthConfig({
        github: { token: 'short' } // Very short token
      });
      
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const validation = authManager.validateAuthentication(parsedUrl);
      
      expect(validation.method).toBe('token');
      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('Token appears to be invalid format');
    });

    it('should default to public access', () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const validation = authManager.validateAuthentication(parsedUrl);
      
      expect(validation.method).toBe('public');
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Using public access - private repositories will fail');
    });
  });

  describe('updateAuthConfig', () => {
    it('should merge auth configurations', () => {
      authManager.updateAuthConfig({
        github: { token: 'token1' }
      });
      
      authManager.updateAuthConfig({
        gitlab: { token: 'token2' }
      });
      
      const config = authManager.getAuthConfig();
      expect(config.github?.token).toBe('token1');
      expect(config.gitlab?.token).toBe('token2');
    });

    it('should override existing configurations', () => {
      authManager.updateAuthConfig({
        github: { token: 'old_token' }
      });
      
      authManager.updateAuthConfig({
        github: { token: 'new_token' }
      });
      
      const config = authManager.getAuthConfig();
      expect(config.github?.token).toBe('new_token');
    });
  });

  describe('clearAuthConfig', () => {
    it('should clear all authentication data', () => {
      authManager.updateAuthConfig({
        github: { token: 'token1' },
        gitlab: { token: 'token2' }
      });
      
      authManager.clearAuthConfig();
      
      const config = authManager.getAuthConfig();
      expect(config).toEqual({});
    });
  });
});