# SmartHealth Production Configuration Guide

This document provides production configuration instructions for the SmartHealth authentication and security system.

## Required Infrastructure

### 1. Database (PostgreSQL)
SmartHealth requires PostgreSQL 16+ for data persistence.

**Environment Variables:**
```bash
DATABASE_URL="postgresql://username:password@host:5432/smarthealth?schema=public"
```

**Production Setup:**
- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, Azure Database)
- Enable SSL/TLS for database connections
- Configure automated backups
- Set up read replicas for scaling

### 2. Redis (Session Management & Rate Limiting)
Redis is required for:
- Session revocation (JWT with jti)
- Distributed rate limiting
- Token blacklist

**Environment Variables:**
```bash
REDIS_URL="redis://username:password@host:6379"
```

**Production Setup:**
- Use managed Redis (AWS ElastiCache, Google Memorystore, Azure Cache)
- Enable AUTH password
- Use TLS for Redis connections
- Configure persistence (RDB + AOF)
- Set up automatic failover

**If Redis is unavailable:**
- The application will fail safely
- Session revocation will not work
- Rate limiting will fall back to in-memory (not distributed)

### 3. Email Service (Password Reset & Security Notifications)
Required for password reset emails and security notifications.

**Environment Variables:**
```bash
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your_email@example.com"
EMAIL_PASSWORD="your_app_password"
EMAIL_FROM="noreply@smarthealth.com"
```

**Supported Providers:**
- **AWS SES**: SMTP endpoint from AWS console
- **SendGrid**: SMTP credentials from SendGrid dashboard
- **SMTP**: Your organization's SMTP server

**Development Mode:**
- If email configuration is missing, reset tokens are returned in API response (development only)
- Never use this in production

### 4. Application Server
**Environment Variables:**
```bash
PORT=5000
NODE_ENV=production
FRONTEND_URL="https://your-frontend-domain.com"
```

**Production Setup:**
- Use HTTPS (TLS/SSL)
- Configure reverse proxy (nginx, Apache)
- Set up load balancer for multiple instances
- Enable gzip compression
- Configure proper logging

### 5. JWT Secret
**Environment Variable:**
```bash
JWT_SECRET="your-very-secure-random-secret-key-min-32-characters"
```

**Requirements:**
- Minimum 32 characters
- Use cryptographically secure random string
- Different for each environment (dev/staging/prod)
- Never commit to version control
- Rotate periodically

**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. ML Service (Optional)
**Environment Variable:**
```bash
ML_SERVICE_URL="http://your-ml-service:8000"
```

**Production Setup:**
- The ML service is optional (fallback available)
- Configure health checks
- Set up autoscaling

## Security Configuration

### CORS
CORS is configured to accept requests only from the configured frontend URL.

**Production:**
```bash
FRONTEND_URL="https://your-frontend-domain.com"
```

**Multiple Origins (if needed):**
Modify `backend/src/index.ts` to accept an array of origins.

### Security Headers
Helmet middleware is configured with:
- HSTS (HTTP Strict Transport Security) - enabled in production
- Cross-Origin Resource Policy
- Referrer Policy

**Production TLS:**
- Enable HSTS with max-age of 1 year
- Include subdomains
- Enable preload

### Cookie Configuration (Future Enhancement)
For HttpOnly cookie implementation:
- `HttpOnly`: Prevents JavaScript access
- `Secure`: Only sent over HTTPS
- `SameSite`: CSRF protection (Strict or Lax)
- Domain: Restrict to your domain
- Path: Restrict to application path

## Environment Variable Validation

The application should validate required environment variables on startup.

**Critical variables for production:**
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_URL`
- `FRONTEND_URL`

**Optional but recommended:**
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`
- `ML_SERVICE_URL`

## Deployment Checklist

### Before Production Deployment:
- [ ] Change `NODE_ENV` to `production`
- [ ] Set strong `JWT_SECRET`
- [ ] Configure `DATABASE_URL` with production database
- [ ] Configure `REDIS_URL` with production Redis
- [ ] Configure email service credentials
- [ ] Set `FRONTEND_URL` to production frontend domain
- [ ] Enable TLS/SSL on all connections
- [ ] Configure reverse proxy
- [ ] Set up monitoring and logging
- [ ] Configure automated backups
- [ ] Test password reset email delivery
- [ ] Test session revocation
- [ ] Test rate limiting
- [ ] Run security tests

### Post-Deployment:
- [ ] Verify login/logout works
- [ ] Verify session revocation works
- [ ] Verify password reset emails arrive
- [ ] Verify MFA works for Admin accounts
- [ ] Verify rate limiting works
- [ ] Monitor Redis connection
- [ ] Monitor email delivery rate
- [ ] Review audit logs
- [ ] Test failover scenarios

## Fail-Safe Behavior

The application is designed to fail safely:

**If Redis is unavailable:**
- Session revocation will not work
- Rate limiting falls back to in-memory (not distributed)
- Application continues to function with degraded security

**If Email is unavailable:**
- Password reset tokens returned in response (development only)
- Production should never have this configuration
- Security notifications will not be sent

**If ML Service is unavailable:**
- Document verification uses manual review
- AI features use deterministic fallback
- Application continues to function

## Monitoring

Monitor the following in production:
- Redis connection health
- Email delivery rate
- Session revocation success rate
- Rate limiting effectiveness
- Failed login attempts
- MFA verification success rate
- Password reset requests

## Scaling Considerations

**Multiple Backend Instances:**
- Redis must be shared across all instances
- Rate limiting requires Redis for distributed behavior
- Session revocation requires Redis
- Load balancer must support sticky sessions if using cookies

**Database:**
- Use connection pooling
- Configure read replicas for scaling
- Monitor query performance

## Security Best Practices

1. **Never commit secrets** to version control
2. **Rotate secrets** periodically (JWT_SECRET, database passwords, API keys)
3. **Use environment-specific secrets** (dev != staging != production)
4. **Enable audit logging** and review regularly
5. **Monitor for suspicious activity** (excessive failed logins, unusual session patterns)
6. **Keep dependencies updated** (run `npm audit` regularly)
7. **Use TLS everywhere** (database, Redis, email, application)
8. **Implement proper backup strategy** for database and Redis
9. **Test failover scenarios** (Redis down, email down, database down)
10. **Document all security incidents** and response procedures

## Troubleshooting

**Session revocation not working:**
- Check Redis connection
- Verify `REDIS_URL` is correct
- Check Redis logs for connection errors
- Verify JWT contains `jti` claim

**Password reset emails not arriving:**
- Check email service credentials
- Verify `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
- Check email service logs
- Verify email is not in spam folder
- Check if email service requires SPF/DKIM records

**Rate limiting not working across instances:**
- Verify Redis is shared across all instances
- Check `REDIS_URL` is identical on all instances
- Verify Redis is not partitioned

**High memory usage:**
- Check Redis TTL settings
- Verify session cleanup is working
- Check for memory leaks in application

## Support

For issues related to:
- **Database**: Check PostgreSQL logs
- **Redis**: Check Redis logs
- **Email**: Check email service provider logs
- **Application**: Check application logs
- **Security**: Review audit logs

## Version History

- **v1.0** (2026-10-06): Initial production configuration guide
