import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// In-memory store for failed login attempts (production should use Redis)
const failedLoginAttempts = new Map<string, { count: number; resetTime: number }>();

// Rate limiter for login endpoint (more strict than general API)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 login attempts per 15 minutes for smooth demo testing
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  },
});

// Rate limiter for registration
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  },
});

// Rate limiter for password reset
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: { error: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return process.env.NODE_ENV === 'test';
  },
});

// Check if IP/email is locked out
export function checkLockout(email: string): { locked: boolean; remainingTime?: number } {
  const now = Date.now();
  const record = failedLoginAttempts.get(email);

  if (!record) {
    return { locked: false };
  }

  // Reset if time has passed
  if (now > record.resetTime) {
    failedLoginAttempts.delete(email);
    return { locked: false };
  }

  // Lock if more than 5 failed attempts
  if (record.count >= 5) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
    return { locked: true, remainingTime };
  }

  return { locked: false };
}

// Record failed login attempt
export function recordFailedLogin(email: string): void {
  const now = Date.now();
  const record = failedLoginAttempts.get(email);

  if (!record) {
    failedLoginAttempts.set(email, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minutes from first attempt
    });
  } else {
    record.count += 1;
    // Extend reset time if more attempts
    if (record.count >= 5) {
      record.resetTime = now + 30 * 60 * 1000; // 30 minutes for 5+ failures
    }
    failedLoginAttempts.set(email, record);
  }
}

// Clear failed login attempts on successful login
export function clearFailedLogins(email: string): void {
  failedLoginAttempts.delete(email);
}
