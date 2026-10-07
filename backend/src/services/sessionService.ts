import { createClient, RedisClientType } from 'redis';
import crypto from 'crypto';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds (matches JWT expiration)

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<void> {
  if (redisClient) {
    return;
  }

  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          // In development, don't retry Redis if it's not available
          if (process.env.NODE_ENV === 'development') {
            return new Error('Redis not available in development');
          }
          // In production, retry with exponential backoff
          if (retries > 5) {
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err instanceof Error ? err.message : String(err));
    });

    await redisClient.connect();
    console.log('[Redis] Connected successfully');
  } catch (err: any) {
    console.error('[Redis] Failed to connect:', err?.message || String(err));
    // Fail safely - don't crash the app if Redis is unavailable
    redisClient = null;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.isOpen;
}

/**
 * Get the Redis client instance
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Generate a unique session ID (jti)
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Store session data in Redis
 */
export async function createSession(sessionId: string, userId: string, role: string, ipAddress: string, userAgent: string): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn('[Session] Redis unavailable, session will not be stored for revocation');
    return;
  }

  try {
    const sessionData = {
      userId,
      role,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      revoked: false,
    };

    const key = `session:${sessionId}`;
    await redisClient!.setEx(key, SESSION_TTL, JSON.stringify(sessionData));

    // Also add to user's session list
    const userSessionsKey = `user:${userId}:sessions`;
    await redisClient!.sAdd(userSessionsKey, sessionId);
    await redisClient!.expire(userSessionsKey, SESSION_TTL);

    console.log(`[Session] Created session ${sessionId} for user ${userId}`);
  } catch (err) {
    console.error('[Session] Failed to create session:', err);
  }
}

/**
 * Check if a session is revoked
 */
export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    // If Redis is unavailable, we cannot check revocation
    // This is a safe fallback - allow the session
    return false;
  }

  try {
    const key = `session:${sessionId}`;
    const sessionData = await redisClient!.get(key);

    if (!sessionData) {
      // Session doesn't exist - treat as revoked
      return true;
    }

    const session = JSON.parse(sessionData);
    return session.revoked === true;
  } catch (err) {
    console.error('[Session] Failed to check session revocation:', err);
    // Fail safely - allow the session
    return false;
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn('[Session] Redis unavailable, cannot revoke session');
    return;
  }

  try {
    const key = `session:${sessionId}`;
    const sessionData = await redisClient!.get(key);

    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.revoked = true;
      session.revokedAt = new Date().toISOString();

      await redisClient!.setEx(key, SESSION_TTL, JSON.stringify(session));

      // Remove from user's active sessions set
      if (session.userId) {
        const userSessionsKey = `user:${session.userId}:sessions`;
        await redisClient!.sRem(userSessionsKey, sessionId);
      }

      console.log(`[Session] Revoked session ${sessionId}`);
    }
  } catch (err) {
    console.error('[Session] Failed to revoke session:', err);
  }
}

/**
 * Revoke all sessions for a user except the current one
 */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn('[Session] Redis unavailable, cannot revoke sessions');
    return;
  }

  try {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await redisClient!.sMembers(userSessionsKey);

    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        await revokeSession(sessionId);
      }
    }

    console.log(`[Session] Revoked all sessions for user ${userId} except ${exceptSessionId || 'none'}`);
  } catch (err) {
    console.error('[Session] Failed to revoke all user sessions:', err);
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId: string): Promise<any[]> {
  if (!isRedisAvailable()) {
    return [];
  }

  try {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessionIds = await redisClient!.sMembers(userSessionsKey);

    const sessions = [];
    for (const sessionId of sessionIds) {
      const key = `session:${sessionId}`;
      const sessionData = await redisClient!.get(key);

      if (sessionData) {
        const session = JSON.parse(sessionData);
        sessions.push({
          id: sessionId,
          ...session,
        });
      }
    }

    return sessions;
  } catch (err) {
    console.error('[Session] Failed to get user sessions:', err);
    return [];
  }
}

/**
 * Update session last activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    const key = `session:${sessionId}`;
    const sessionData = await redisClient!.get(key);

    if (sessionData) {
      const session = JSON.parse(sessionData);
      session.lastActivity = new Date().toISOString();

      await redisClient!.setEx(key, SESSION_TTL, JSON.stringify(session));
    }
  } catch (err) {
    console.error('[Session] Failed to update session activity:', err);
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed');
  }
}
