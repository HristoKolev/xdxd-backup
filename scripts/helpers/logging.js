import log4js from 'log4js';

export function configureLogging() {
  const patternLayout = {
    type: 'pattern',
    pattern: '%[[%p] %c -%] %m',
  };

  log4js.configure({
    appenders: {
      out: { type: 'stdout', layout: patternLayout },
      err: { type: 'stderr', layout: patternLayout },
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
    },
    categories: {
      default: {
        appenders: ['nonErrorAppender', 'errorAppender'],
        level: process.env.SCRIPT_LOG_LEVEL || 'info',
      },
    },
  });
}

export function getLogger(scriptName) {
  // Ensure we have a valid script name for logging
  if (!scriptName || typeof scriptName !== 'string') {
    throw new Error('Script name must be provided for logging configuration');
  }

  if (!log4js.isConfigured()) {
    configureLogging();
  }

  return log4js.getLogger(scriptName);
}
