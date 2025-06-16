import { GitCacheManager } from '../src/scanner/git/git-cache-manager.js';
import { GitUrlParser } from '../src/scanner/git/git-url-parser.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('GitCacheManager', () => {
  let cacheManager: GitCacheManager;
  let tempCacheDir: string;

  beforeEach(async () => {
    // Create temporary cache directory
    tempCacheDir = path.join(os.tmpdir(), 'coderag-test-cache-' + Date.now());
    cacheManager = new GitCacheManager({
      cacheDir: tempCacheDir,
      maxAge: 1000, // 1 second for testing
      maxSize: 1024 * 1024 // 1MB
    });
    
    await cacheManager.initialize();
  });

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(tempCacheDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getCachedRepository', () => {
    it('should return null for non-existent cache entry', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      const result = await cacheManager.getCachedRepository(parsedUrl, 'main');
      
      expect(result).toBeNull();
    });

    it('should return null for expired cache entry', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      
      // Create a temporary source directory
      const sourceDir = path.join(tempCacheDir, 'source');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      
      // Add to cache
      await cacheManager.addToCache(parsedUrl, 'main', sourceDir);
      
      // Wait for expiration (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should return null for expired entry
      const result = await cacheManager.getCachedRepository(parsedUrl, 'main');
      expect(result).toBeNull();
    });
  });

  describe('addToCache', () => {
    it('should add repository to cache', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      
      // Create a temporary source directory
      const sourceDir = path.join(tempCacheDir, 'source');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      
      // Add to cache
      const cachedPath = await cacheManager.addToCache(parsedUrl, 'main', sourceDir);
      
      // Verify cache entry exists
      expect(cachedPath).toBeTruthy();
      const stats = await fs.stat(cachedPath);
      expect(stats.isDirectory()).toBe(true);
      
      // Verify file was copied
      const testFile = path.join(cachedPath, 'test.txt');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('test content');
    });

    it('should retrieve cached repository', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      
      // Create source directory with content
      const sourceDir = path.join(tempCacheDir, 'source');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      
      // Add to cache
      await cacheManager.addToCache(parsedUrl, 'main', sourceDir);
      
      // Retrieve from cache
      const cachedPath = await cacheManager.getCachedRepository(parsedUrl, 'main');
      
      expect(cachedPath).toBeTruthy();
      if (cachedPath) {
        const testFile = path.join(cachedPath, 'test.txt');
        const content = await fs.readFile(testFile, 'utf-8');
        expect(content).toBe('test content');
      }
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await cacheManager.getCacheStats();
      
      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('totalSize');
      expect(stats.entries).toBe(0); // Initially empty
    });

    it('should update statistics after adding entries', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      
      // Create source directory
      const sourceDir = path.join(tempCacheDir, 'source');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      
      // Add to cache
      await cacheManager.addToCache(parsedUrl, 'main', sourceDir);
      
      const stats = await cacheManager.getCacheStats();
      expect(stats.entries).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('clearCache', () => {
    it('should clear all cache entries', async () => {
      const parsedUrl = GitUrlParser.parse('https://github.com/owner/repo.git');
      
      // Create and cache repository
      const sourceDir = path.join(tempCacheDir, 'source');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'test.txt'), 'test content');
      await cacheManager.addToCache(parsedUrl, 'main', sourceDir);
      
      // Verify cache has entries
      let stats = await cacheManager.getCacheStats();
      expect(stats.entries).toBe(1);
      
      // Clear cache
      await cacheManager.clearCache();
      
      // Verify cache is empty
      stats = await cacheManager.getCacheStats();
      expect(stats.entries).toBe(0);
      
      // Verify cached repository is no longer accessible
      const cachedPath = await cacheManager.getCachedRepository(parsedUrl, 'main');
      expect(cachedPath).toBeNull();
    });
  });
});