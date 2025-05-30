import log4js from 'log4js';

export function configureLogging() {
  log4js.configure({
    appenders: {
      out: { type: 'stdout' },
    },
    categories: {
      default: {
        appenders: ['out'],
        level: 'info',
      },
    },
  });
}

export function getLogger() {
  return log4js.getLogger('xdxd-win-backup');
}
