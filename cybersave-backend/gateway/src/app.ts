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
    
    origin: process.env.NODE_ENV === 'production'
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error(`CORS blocked: ${origin}`));
        }
      : true, // allow all in dev
    credentials: true,
  })
);


//rate limit
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests', errorCode: 'RATE_LIMIT_EXCEEDED' },
});
app.use(globalLimiter);


app.get('/health', (_req, res) =>
  res.json({ success: true, data: { service: 'gateway', status: 'ok' } })
);


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

// auth middleware
const authenticate = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized', errorCode: 'UNAUTHORIZED' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      role: string;
    };
    // send user info to downstream services as trusted headers
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token', errorCode: 'TOKEN_INVALID' });
  }
};

// send proxies
for (const [prefix, target] of Object.entries(services)) {
  app.use(
    // auth middleware first if the route is NOT public
    (req, res, next) => {
      const isPublic = prefix === '/api/v1/auth' || (prefix === '/api/v1/services' && req.method === 'GET');
      if (req.path.startsWith(prefix) && !isPublic) {
        authenticate(req, res, next);
      } else {
        next();
      }
    },
    createProxyMiddleware({
      // match incoming request if it starts with the service prefix
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




// local dev server
if (require.main === module) {
  app.listen(parseInt(process.env.PORT ?? '3000', 10), () => {
    console.log(`Gateway running on port ${process.env.PORT ?? 3000}`);
  });
}

export default app;
