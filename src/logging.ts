import log4js from 'log4js';

export function configureLogging() {
  log4js.configure({
    appenders: {
      out: { type: 'stdout' },
      err: { type: 'stderr' },
    },
    categories: {
      default: {
        appenders: ['out'],
        level: 'info',
      },
      error: {
        appenders: ['err'],
        level: 'error',
      },
    },
  });
}

export function getLogger(category: string = 'xdxd-win-backup') {
  return log4js.getLogger(category);
}

export function getErrorLogger() {
  return getLogger('error');
}

export function fail(message: string, ...args: unknown[]): never {
  const logger = getErrorLogger();
  logger.fatal(message, ...args);
  process.exit(1);
}
