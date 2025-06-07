import log4js from 'log4js';

export function configureLogging() {
  log4js.configure({
    appenders: {
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[%p%] %m',
        },
      },
      outClean: {
        type: 'stdout',
        layout: { type: 'messagePassThrough' },
      },
      error: {
        type: 'stderr',
        layout: {
          type: 'pattern',
          pattern: '%[%p%] %m',
        },
      },
      errorClean: {
        type: 'stderr',
        layout: { type: 'messagePassThrough' },
      },
    },
    categories: {
      default: {
        appenders: ['out'],
        level: 'info',
      },
      outClean: {
        appenders: ['outClean'],
        level: 'info',
      },
      error: {
        appenders: ['error'],
        level: 'error',
      },
      errorClean: {
        appenders: ['errorClean'],
        level: 'error',
      },
    },
  });
}

export function getLogger(
  category: 'xdxd-backup' | 'outClean' = 'xdxd-backup'
) {
  return log4js.getLogger(category);
}

export function getErrorLogger(category: 'error' | 'errorClean' = 'error') {
  return log4js.getLogger(category);
}
