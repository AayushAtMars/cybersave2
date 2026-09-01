import winston from 'winston';
import { config } from '../../../config';

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.nodeEnv === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        )
  ),
  transports: [new winston.transports.Console()],
});

// PII masking helper
// Never log raw phone numbers or Aadhaar — mask before logging
export const maskPhone = (phone: string): string =>
  phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');

export const maskAadhaar = (aadhaar: string): string =>
  aadhaar.replace(/\d{8}(\d{4})/, 'XXXX-XXXX-$1');
