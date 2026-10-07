# SmartHealth CI/CD Pipeline Documentation

## Overview

This document describes the complete CI/CD pipeline for the SmartHealth application, including automated testing, building, deployment, and performance optimization.

## Table of Contents

1. [GitHub Actions Workflow](#github-actions-workflow)
2. [Local Development Setup](#local-development-setup)
3. [Build Process](#build-process)
4. [Deployment](#deployment)
5. [Performance Optimization](#performance-optimization)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)

## GitHub Actions Workflow

### Workflow File: `.github/workflows/ci-cd.yml`

The CI/CD pipeline consists of three main jobs:

#### 1. Backend CI
- **Triggers**: Push to main/develop, Pull Requests
- **Steps**:
  1. Checkout code
  2. Cache node modules
  3. Cache TypeScript build
  4. Setup Node.js (18.x)
  5. Install dependencies
  6. Run TypeScript type check
  7. Run ESLint
  8. Run TypeScript build
  9. Run Prisma generate
  10. Run Prisma migrate (test database)
  11. Run security audit
  12. Run tests

#### 2. Frontend CI
- **Triggers**: Push to main/develop, Pull Requests
- **Steps**:
  1. Checkout code
  2. Cache node modules
  3. Cache Vite build
  4. Setup Node.js (18.x)
  5. Install dependencies
  6. Run TypeScript type check
  7. Run ESLint
  8. Run TypeScript build
  9. Run security audit
  10. Analyze bundle size
  11. Run tests

#### 3. Security Scan
- **Triggers**: Push to main/develop, Pull Requests
- **Steps**:
  1. Checkout code
  2. Run Trivy vulnerability scanner
  3. Upload results to GitHub Security

#### 4. Deploy (Production Only)
- **Triggers**: Push to main branch only
- **Dependencies**: Backend CI, Frontend CI, Security Scan must pass
- **Steps**:
  1. Checkout code
  2. Setup Node.js
  3. Build backend
  4. Build frontend
  5. Deploy notification

### Caching Strategy

The pipeline uses GitHub Actions cache for:
- **Node modules**: Cached based on `package-lock.json` hash
- **Backend dist**: Cached based on source file hashes
- **Frontend dist**: Cached based on source file hashes

This significantly reduces build times on subsequent runs.

## Local Development Setup

### Prerequisites

- Node.js 18.x
- PostgreSQL 15
- Redis 7 (optional, for session management)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:push
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Compose (Full Stack)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 5000
- Frontend on port 80

## Build Process

### Backend Build

```bash
cd backend
npm run build
```

Output: `dist/` directory with compiled TypeScript

### Frontend Build

```bash
cd frontend
npm run build
```

Output: `dist/` directory with optimized production bundle

#### Build Optimizations

1. **Code Splitting**: Automatic chunk splitting for vendor libraries
2. **Lazy Loading**: All pages are lazy-loaded with React Suspense
3. **Tree Shaking**: Unused code is removed
4. **Minification**: Terser minification
5. **Gzip Compression**: Automatic gzip compression

#### Bundle Structure

The frontend build creates the following chunks:
- `react-vendor`: React and React DOM (~1.2 MB)
- `charts-vendor`: Chart.js and React Chart.js (~177 KB)
- `maps-vendor`: Leaflet maps (~149 KB)
- `utils-vendor`: Axios, Lucide icons, QR code (~51 KB)
- `three-vendor`: Three.js and 3D components
- Individual page chunks: Lazy-loaded on demand

## Deployment

### Docker Deployment

#### Build Docker Images

```bash
docker build -t smarthealth-backend --target backend .
docker build -t smarthealth-frontend --target frontend .
```

#### Run with Docker Compose

```bash
docker-compose up -d
```

### Environment-Specific Configurations

#### Development
- Uses `.env` file
- Redis gracefully degrades if unavailable
- Email service falls back to development mode
- Source maps enabled
- Detailed logging

#### Staging
- Uses `.env.staging`
- Full Redis integration
- Email service configured
- Source maps disabled
- Optimized logging

#### Production
- Uses `.env.production`
- Full Redis integration
- Email service configured
- Source maps disabled
- Security headers enabled
- HSTS enabled
- Gzip compression enabled

### Required Environment Variables

**Backend**:
- `NODE_ENV`: development/staging/production
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret (must be strong in production)
- `REDIS_URL`: Redis connection string
- `FRONTEND_URL`: Frontend domain (for CORS)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`: Email configuration
- `ML_SERVICE_URL`: ML service URL

**Frontend**:
- `VITE_API_URL`: Backend API URL (defaults to http://localhost:5000/api)

## Performance Optimization

### Frontend Optimizations

1. **Lazy Loading**: All pages are lazy-loaded using React.lazy()
2. **Code Splitting**: Vendor libraries split into separate chunks
3. **Route-Based Splitting**: Each page loads only when needed
4. **Compression**: Gzip compression enabled
5. **Caching**: Static assets cached with long expiry
6. **Optimized Dependencies**: Pre-bundled dependencies for faster dev

### Backend Optimizations

1. **Response Compression**: Express compression middleware
2. **Performance Logging**: Response time tracking
3. **Connection Pooling**: Prisma connection pooling
4. **Redis Caching**: Query result caching service
5. **Session Management**: Redis-backed session storage
6. **Rate Limiting**: In-memory and Redis-backed rate limiting

### Performance Monitoring

The backend includes:
- Response time logging (slow requests > 1s are logged as warnings)
- Performance headers (`X-Response-Time`)
- Request duration tracking
- Database query logging (in development)

## Monitoring and Logging

### Backend Logging

- **Development**: Morgan dev logger, Prisma query logs
- **Production**: Morgan error logs only, Prisma error logs
- **Performance**: Response times logged for all requests
- **Security**: Audit logging for authentication events

### Frontend Logging

- **Development**: Full console logging
- **Production**: Console logs removed during build

### Security Headers

Production headers include:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy` (configurable)

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Security Audit

```bash
cd backend
npm audit

cd frontend
npm audit
```

## Linting

### Backend Linting

```bash
cd backend
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run type-check  # TypeScript type checking
```

### Frontend Linting

```bash
cd frontend
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run type-check  # TypeScript type checking
```

## Troubleshooting

### Build Failures

1. **TypeScript Errors**: Run `npm run type-check` to see specific errors
2. **Linting Errors**: Run `npm run lint:fix` to auto-fix
3. **Dependency Issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`

### Runtime Issues

1. **Database Connection**: Check `DATABASE_URL` in `.env`
2. **Redis Connection**: Redis is optional in development, but required for production features
3. **Port Conflicts**: Check if ports 5000, 5173, 5432, 6379 are available

### Performance Issues

1. **Slow Frontend**: Check bundle size with `npm run build -- --report`
2. **Slow Backend**: Check response times in logs, enable performance logging
3. **Database Slow**: Check connection pooling, add caching

## Continuous Improvement

### Future Enhancements

1. **E2E Testing**: Add Playwright or Cypress for end-to-end tests
2. **Load Testing**: Add k6 or Artillery for load testing
3. **APM Integration**: Add Datadog, New Relic, or similar
4. **CDN Integration**: Serve static assets via CDN
5. **Database Optimization**: Add query optimization and indexing
6. **Advanced Caching**: Implement Redis caching for more endpoints

## Contact

For questions or issues with the CI/CD pipeline, please contact the DevOps team or open an issue in the repository.
