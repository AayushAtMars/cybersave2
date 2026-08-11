import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, ...meta }) =>
          `${timestamp} [${level}]: ${message}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`
        )
  ),
  transports: [new winston.transports.Console()],
});
