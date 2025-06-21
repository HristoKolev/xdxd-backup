import log4js from 'log4js';

export function configureLogging() {
  const defaultLogLevel = 'info';

  const patternLayout = {
    type: 'pattern',
    pattern: '%[%p%] %m',
  };

  const cleanLayout = { type: 'messagePassThrough' };

  log4js.configure({
    appenders: {
      out: { type: 'stdout', layout: patternLayout },
      err: { type: 'stderr', layout: patternLayout },
      outClean: { type: 'stdout', layout: cleanLayout },
      errClean: { type: 'stderr', layout: cleanLayout },
      nonErrorAppender: {
        type: 'logLevelFilter',
        appender: 'out',
        level: 'trace',
        maxLevel: 'warn',
      },
      errorAppender: {
        type: 'logLevelFilter',
        appender: 'err',
        level: 'error',
      },
      cleanNonErrorAppender: {
        type: 'logLevelFilter',
        appender: 'outClean',
        level: 'trace',
        maxLevel: 'warn',
      },
      cleanErrorAppender: {
        type: 'logLevelFilter',
        appender: 'errClean',
        level: 'error',
      },
    },
    categories: {
      default: {
        appenders: ['nonErrorAppender', 'errorAppender'],
        level: defaultLogLevel,
      },
      clean: {
        appenders: ['cleanNonErrorAppender', 'cleanErrorAppender'],
        level: defaultLogLevel,
      },
    },
  });
}

export function getLogger(category = 'xdxd-backup') {
  if (!log4js.isConfigured()) {
    configureLogging();
  }

  return log4js.getLogger(category);
}

export function getCleanLogger() {
  return getLogger('clean');
}
