import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.js';
import { Logger } from './server/services/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Memory-based lightweight Rate Limiter to prevent brute force and API exhaustion
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 300; // 300 requests/min

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const userLimit = rateLimits.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
  } else {
    userLimit.count += 1;
    if (userLimit.count > MAX_REQUESTS_PER_WINDOW) {
      Logger.warn(`Rate limit triggered for IP: ${ip}`, 'RateLimiter', { ip, count: userLimit.count });
      res.status(429).json({
        error: 'Too many requests.',
        message: 'Rate limit exceeded. Please retry in a moment.'
      });
    } else {
      next();
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add basic security headers to enhance workstation posture
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Basic request body parsing with strict input size limiting (10MB payload cap)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request tracing and structured transaction logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl !== '/api/health') {
        Logger.info(`${req.method} ${req.originalUrl} - Status ${res.statusCode} - ${duration}ms`, 'HTTP', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          durationMs: duration
        });
      }
    });
    next();
  });

  // Apply rate limiter to API routes
  app.use('/api', rateLimiter);

  // Bind full API router matching our architecture
  app.use('/api', apiRouter);

  // Health endpoint for verification checks
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Integration of Vite development middleware or static asset delivery
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Running in development mode with Vite hot-reload middleware.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 Running in production mode, serving compiled static assets.');
  }

  // Centralized Error Handling Middleware (Never exposes raw Stack Traces in Production)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errMessage = err.message || 'Internal Server Error';
    Logger.error(`Unhandled exception on ${req.method} ${req.originalUrl}: ${errMessage}`, 'ExpressErrorHandler', {
      error: errMessage,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    res.status(err.status || 500).json({
      error: 'An unexpected workstation exception occurred.',
      message: process.env.NODE_ENV === 'production' ? 'Detailed logs are preserved in production audit logs.' : errMessage
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DueNow Full-Stack server is operational on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start the server:', err);
  process.exit(1);
});
