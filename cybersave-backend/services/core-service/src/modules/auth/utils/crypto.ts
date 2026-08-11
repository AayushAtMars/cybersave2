import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashOtp = (otp: string): Promise<string> =>
  bcrypt.hash(otp, SALT_ROUNDS);

export const verifyOtp = (otp: string, hash: string): Promise<boolean> =>
  bcrypt.compare(otp, hash);

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();
