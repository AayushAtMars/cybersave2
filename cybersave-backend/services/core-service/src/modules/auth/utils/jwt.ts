import jwt from 'jsonwebtoken';
import { config } from '../../../config';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;   // userId or operatorId
  role: string;
  jti: string;   // unique token ID for blacklisting
  iat?: number;
  exp?: number;
}

export const signAccessToken = (sub: string, role: string): string =>
  jwt.sign({ sub, role, jti: uuidv4() }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });

export const signRefreshToken = (sub: string, role: string): { token: string; jti: string } => {
  const jti = uuidv4();
  const token = jwt.sign({ sub, role, jti }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
  return { token, jti };
};

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;

// Remaining TTL in seconds for a token (used when blacklisting on logout)
export const getRemainingTtl = (exp: number): number =>
  Math.max(0, exp - Math.floor(Date.now() / 1000));
