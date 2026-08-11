import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // ── MongoDB URIs — one per logical domain ──────────────────────────────────
  mongoUriAuth: required('MONGO_URI_AUTH'),
  mongoUriNotification: required('MONGO_URI_NOTIFICATION'),
  mongoUriSupport: required('MONGO_URI_SUPPORT'),

  // ── Upstash Redis (HTTP REST — works on Render & serverless alike) ─────────
  redisUrl: required('UPSTASH_REDIS_REST_URL'),
  redisToken: required('UPSTASH_REDIS_REST_TOKEN'),

  // ── JWT ────────────────────────────────────────────────────────────────────
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },

  // ── OTP ─────────────────────────────────────────────────────────────────────
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '600', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10),
  },

  // ── Cloudflare Turnstile ─────────────────────────────────────────────────────
  turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? '',

  // ── CORS ─────────────────────────────────────────────────────────────────────
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(','),
};
