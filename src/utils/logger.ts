import winston from 'winston';

export const loggerOptions = {
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'formatted-docs-ai-translator' },
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 1048576,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      maxsize: 1048576,
      maxFiles: 10,
    }),
  ],
};

// winston 로거 생성 함수
export const createLogger = (): winston.Logger => {
  return winston.createLogger(loggerOptions);
};

// 기본 로거 인스턴스 생성
export const logger = createLogger();
