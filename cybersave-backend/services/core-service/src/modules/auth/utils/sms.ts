import { logger } from './logger';

/**
 * mock sender only for offline development.
 */
export const sendMockOtp = async (phone: string, otp: string): Promise<void> => {
  logger.info(`[MOCK OTP] Send SMS to=${phone} code=${otp}`);
};
