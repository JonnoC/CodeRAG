import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { ParsedGitUrl } from './types.js';

export interface CacheEntry {
  url: string;
  branch: string;
  lastUpdated: Date;
  lastCommit?: string;
  localPath: string;
}

export interface CacheOptions {
  maxAge?: number; // in milliseconds
  maxSize?: number; // in bytes
  cacheDir?: string;
}

export class GitCacheManager {
  private cacheDir: string;
  private options: Required<CacheOptions>;
  private cacheIndex: Map<string, CacheEntry>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxAge: options.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      maxSize: options.maxSize || 5 * 1024 * 1024 * 1024, // 5GB
      cacheDir: options.cacheDir || path.join(os.homedir(), '.coderag', 'git-cache')
    };
    
    this.cacheDir = this.options.cacheDir;
    this.cacheIndex = new Map();
  }

  async initialize(): Promise<void> {
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });
    
    // Load existing cache index
    await this.loadCacheIndex();
    
    // Clean up expired entries
    await this.cleanupExpiredEntries();
  }

  async getCachedRepository(parsedUrl: ParsedGitUrl, branch: string = 'main'): Promise<string | null> {
    const cacheKey = this.generateCacheKey(parsedUrl, branch);
    const entry = this.cacheIndex.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry is still valid
    const isExpired = Date.now() - entry.lastUpdated.getTime() > this.options.maxAge;
    if (isExpired) {
      await this.removeCacheEntry(cacheKey);
      return null;
    }
    
    // Check if cached directory still exists
    try {
      await fs.access(entry.localPath);
      return entry.localPath;
    } catch {
      // Directory doesn't exist, remove from cache
      await this.removeCacheEntry(cacheKey);
      return null;
    }
  }

  async addToCache(parsedUrl: ParsedGitUrl, branch: string, sourcePath: string): Promise<string> {
    const cacheKey = this.generateCacheKey(parsedUrl, branch);
    const targetPath = path.join(this.cacheDir, cacheKey);
    
    // Copy repository to cache
    await this.copyDirectory(sourcePath, targetPath);
    
    // Get last commit hash for cache validation
    const lastCommit = await this.getLastCommitHash(targetPath);
    
    // Create cache entry
    const entry: CacheEntry = {
      url: parsedUrl.originalUrl,
      branch,
      lastUpdated: new Date(),
      lastCommit,
      localPath: targetPath
    };
    
    this.cacheIndex.set(cacheKey, entry);
    await this.saveCacheIndex();
    
    return targetPath;
  }

  async updateCacheEntry(parsedUrl: ParsedGitUrl, branch: string, sourcePath: string): Promise<string> {
    // Remove existing entry and add new one
    const cacheKey = this.generateCacheKey(parsedUrl, branch);
    await this.removeCacheEntry(cacheKey);
    return this.addToCache(parsedUrl, branch, sourcePath);
  }

  async removeCacheEntry(cacheKey: string): Promise<void> {
    const entry = this.cacheIndex.get(cacheKey);
    if (entry) {
      try {
        await fs.rm(entry.localPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to remove cached directory: ${entry.localPath}`, error);
      }
      
      this.cacheIndex.delete(cacheKey);
      await this.saveCacheIndex();
    }
  }

  async clearCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.cacheIndex.clear();
      await this.saveCacheIndex();
    } catch (error) {
      console.warn('Failed to clear git cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    entries: number;
    totalSize: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    let totalSize = 0;
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;
    
    for (const entry of this.cacheIndex.values()) {
      try {
        const stats = await fs.stat(entry.localPath);
        totalSize += stats.size;
        
        if (!oldestEntry || entry.lastUpdated < oldestEntry) {
          oldestEntry = entry.lastUpdated;
        }
        
        if (!newestEntry || entry.lastUpdated > newestEntry) {
          newestEntry = entry.lastUpdated;
        }
      } catch {
        // Directory might not exist, will be cleaned up later
      }
    }
    
    return {
      entries: this.cacheIndex.size,
      totalSize,
      oldestEntry,
      newestEntry
    };
  }

  private generateCacheKey(parsedUrl: ParsedGitUrl, branch: string): string {
    const key = `${parsedUrl.host}/${parsedUrl.owner}/${parsedUrl.repo}/${branch}`;
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  private async loadCacheIndex(): Promise<void> {
    const indexPath = path.join(this.cacheDir, 'index.json');
    
    try {
      const data = await fs.readFile(indexPath, 'utf-8');
      const entries = JSON.parse(data);
      
      this.cacheIndex.clear();
      for (const [key, value] of Object.entries(entries)) {
        this.cacheIndex.set(key, {
          ...value as any,
          lastUpdated: new Date((value as any).lastUpdated)
        });
      }
    } catch {
      // Index file doesn't exist or is invalid, start fresh
      this.cacheIndex.clear();
    }
  }

  private async saveCacheIndex(): Promise<void> {
    const indexPath = path.join(this.cacheDir, 'index.json');
    const entries = Object.fromEntries(this.cacheIndex);
    
    try {
      await fs.writeFile(indexPath, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.warn('Failed to save cache index:', error);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cacheIndex.entries()) {
      if (now - entry.lastUpdated.getTime() > this.options.maxAge) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      await this.removeCacheEntry(key);
    }
  }

  private async copyDirectory(source: string, target: string): Promise<void> {
    await fs.mkdir(target, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private async getLastCommitHash(repoPath: string): Promise<string | undefined> {
    try {
      const gitDir = path.join(repoPath, '.git');
      const headPath = path.join(gitDir, 'HEAD');
      
      const headContent = await fs.readFile(headPath, 'utf-8');
      const match = headContent.trim().match(/^ref: (.+)$/);
      
      if (match) {
        const refPath = path.join(gitDir, match[1]);
        const commit = await fs.readFile(refPath, 'utf-8');
        return commit.trim();
      }
      
      // HEAD contains commit hash directly
      return headContent.trim();
    } catch {
      return undefined;
    }
  }
}