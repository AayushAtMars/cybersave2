import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',');

app.use(helmet());
app.use(
  cors({
    // In development: allow all origins (mobile apps don't send an Origin header).
    // In production: restrict to known origins via env var.
    origin: process.env.NODE_ENV === 'production'
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error(`CORS blocked: ${origin}`));
        }
      : true, // allow all in dev
    credentials: true,
  })
);


// Global rate limit — individual service routes add tighter limits
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests', errorCode: 'RATE_LIMIT_EXCEEDED' },
});
app.use(globalLimiter);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'gateway', status: 'ok' } })
);

// ── Route map ─────────────────────────────────────────────────────────────────
const services: Record<string, string> = {
  '/api/v1/auth': process.env.CORE_SERVICE_URL!,
  '/api/v1/users': process.env.CORE_SERVICE_URL!,
  '/api/v1/services': process.env.OPS_SERVICE_URL!,
  '/api/v1/applications': process.env.OPS_SERVICE_URL!,
  '/api/v1/documents': process.env.OPS_SERVICE_URL!,
  '/api/v1/payments': process.env.OPS_SERVICE_URL!,
  '/api/v1/notifications': process.env.CORE_SERVICE_URL!,
  '/api/v1/support': process.env.CORE_SERVICE_URL!,
};

// ── Auth middleware (verifies JWT, attaches x-user-id and x-user-role headers) ─
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized', errorCode: 'UNAUTHORIZED' });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      role: string;
    };
    // Forward user info to downstream services as trusted headers
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token', errorCode: 'TOKEN_INVALID' });
  }
};

// ── Wire up proxies ───────────────────────────────────────────────────────────
// Mount directly on root '/' so Express never modifies req.url/req.originalUrl.
// We filter and route dynamically using http-proxy-middleware filters.
for (const [prefix, target] of Object.entries(services)) {
  const isPublic = prefix === '/api/v1/auth' || prefix === '/api/v1/services';

  app.use(
    // Run auth middleware first if the route is NOT public
    (req, res, next) => {
      if (req.path.startsWith(prefix) && !isPublic) {
        authenticate(req, res, next);
      } else {
        next();
      }
    },
    createProxyMiddleware({
      // Match incoming request if it starts with the service prefix
      pathFilter: (path) => path.startsWith(prefix),
      target,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          (res as express.Response).status(502).json({
            success: false,
            error: 'Service unavailable',
            errorCode: 'SERVICE_UNAVAILABLE',
          });
        },
      },
    })
  );
}




// ── Local dev server ──────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(parseInt(process.env.PORT ?? '3000', 10), () => {
    console.log(`Gateway running on port ${process.env.PORT ?? 3000}`);
  });
}

export default app;
