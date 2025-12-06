type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const logLevels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const shouldLog = (level: LogLevel): boolean => {
  return logLevels[level] <= logLevels[currentLevel];
};

const formatMessage = (level: LogLevel, message: string, ...args: any[]): string => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}${args.length > 0 ? ' ' + JSON.stringify(args) : ''}`;
};

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args));
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },
  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, ...args));
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, ...args));
    }
  },
};
