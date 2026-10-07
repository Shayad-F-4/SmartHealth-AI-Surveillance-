import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log response times for performance monitoring
 */
export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, url } = req;
    const { statusCode } = res;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[Performance] Slow request: ${method} ${url} - ${statusCode} - ${duration}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${method} ${url} - ${statusCode} - ${duration}ms`);
    }
  });

  next();
}

/**
 * Middleware to add performance headers
 */
export function performanceHeaders(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Store original res.json to intercept
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    return originalJson(data);
  };

  next();
}
