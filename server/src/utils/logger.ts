import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logFormat = isProduction
  ? winston.format.json()
  : winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${message}${metaString}`;
      })
    );

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  transports: [new winston.transports.Console()],
  defaultMeta: {
    service: 'keynection-api'
  }
});

export default logger;
