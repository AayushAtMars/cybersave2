import { Redis } from '@upstash/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

// @upstash/redis uses HTTP REST — works perfectly on Vercel serverless
// (ioredis requires persistent TCP which doesn't suit serverless — switched, 2026-08-06)
export const redis = new Redis({
  url: config.redisUrl,
  token: config.redisToken,
});

// ── OTP helpers ─────────────────────────────────────────────────────────────
const otpKey = (phone: string) => `otp:${phone}`;
const otpAttemptsKey = (phone: string) => `otp_attempts:${phone}`;

export const storeOtp = async (phone: string, hashedOtp: string): Promise<void> => {
  await redis.setex(otpKey(phone), config.otp.ttlSeconds, hashedOtp);
  await redis.del(otpAttemptsKey(phone));
};

export const getStoredOtp = async (phone: string): Promise<string | null> =>
  redis.get<string>(otpKey(phone));

export const deleteOtp = async (phone: string): Promise<void> => {
  await redis.del(otpKey(phone));
  await redis.del(otpAttemptsKey(phone));
};

export const incrementOtpAttempts = async (phone: string): Promise<number> => {
  const key = otpAttemptsKey(phone);
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, config.otp.ttlSeconds + 60);
  }
  return attempts;
};

// ── Refresh token blacklist ──────────────────────────────────────────────────
export const blacklistToken = async (jti: string, ttlSeconds: number): Promise<void> => {
  await redis.setex(`blacklist:${jti}`, ttlSeconds, '1');
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  const val = await redis.get(`blacklist:${jti}`);
  return val !== null;
};
