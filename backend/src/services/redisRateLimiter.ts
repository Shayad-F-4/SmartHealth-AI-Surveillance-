import { RedisClientType } from 'redis';

const WINDOW_SIZE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // 5 requests per window

const rateLimitWindows = new Map<string, { count: number; resetTime: number }>();

/**
 * Redis-backed rate limiter
 * Falls back to in-memory if Redis is unavailable
 */
export class RedisRateLimiter {
  private redisClient: RedisClientType | null = null;

  constructor(redisClient: RedisClientType | null) {
    this.redisClient = redisClient;
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (this.redisClient) {
      return await this.checkRedisRateLimit(identifier, windowMs, maxRequests);
    } else {
      return this.checkInMemoryRateLimit(identifier, windowMs, maxRequests);
    }
  }

  /**
   * Redis-based rate limiting
   */
  private async checkRedisRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      const key = `ratelimit:${identifier}`;

      // Use Redis pipeline for atomic operations
      const pipeline = this.redisClient!.multi();

      // Remove old entries outside the window
      pipeline.zRemRangeByScore(key, 0, windowStart);

      // Count current entries
      pipeline.zCard(key);

      // Add current request
      pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });

      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const count = typeof results[1] === 'number' ? results[1] : 0;
      const allowed = count < maxRequests;
      const remaining = Math.max(0, maxRequests - count - 1);
      const resetTime = now + windowMs;

      return { allowed, remaining, resetTime };
    } catch (err) {
      console.error('[RateLimiter] Redis error, falling back to in-memory:', err);
      return this.checkInMemoryRateLimit(identifier, windowMs, maxRequests);
    }
  }

  /**
   * In-memory rate limiting (fallback)
   */
  private checkInMemoryRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const record = rateLimitWindows.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      rateLimitWindows.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return Promise.resolve({
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      });
    }

    if (record.count >= maxRequests) {
      return Promise.resolve({
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
      });
    }

    record.count += 1;
    return Promise.resolve({
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    });
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(`ratelimit:${identifier}`);
      } catch (err) {
        console.error('[RateLimiter] Failed to reset rate limit:', err);
      }
    } else {
      rateLimitWindows.delete(identifier);
    }
  }
}
