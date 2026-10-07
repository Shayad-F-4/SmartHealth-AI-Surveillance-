import { getRedisClient } from './sessionService';

/**
 * Simple caching service using Redis
 */
export class CacheService {
  private static instance: CacheService;
  private defaultTTL = 300; // 5 minutes default

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;
      return await redis.get(key);
    } catch (err) {
      console.error('[Cache] Failed to get:', err);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      const seconds = ttl || this.defaultTTL;
      await redis.setEx(key, seconds, value);
    } catch (err) {
      console.error('[Cache] Failed to set:', err);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      await redis.del(key);
    } catch (err) {
      console.error('[Cache] Failed to delete:', err);
    }
  }

  /**
   * Clear all cache keys matching a pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      const redis = getRedisClient();
      if (!redis) return;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (err) {
      console.error('[Cache] Failed to clear pattern:', err);
    }
  }

  /**
   * Cache database query results
   */
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      // Execute query
      const result = await queryFn();

      // Cache the result
      await this.set(key, JSON.stringify(result), ttl);

      return result;
    } catch (err) {
      console.error('[Cache] Failed to cache query:', err);
      // Fallback to direct query
      return await queryFn();
    }
  }
}

export const cacheService = CacheService.getInstance();
