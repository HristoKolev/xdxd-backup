import log4js from 'log4js';

export function configureLogging() {
  log4js.configure({
    appenders: {
      out: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '%[[%p] %c -%] %m',
        },
      },
      err: {
        type: 'stderr',
        layout: {
          type: 'pattern',
          pattern: '%[[%p] %c -%] %m',
        },
      },
      errorAppender: {
        type: 'logLevelFilter',
        appender: 'err',
        level: 'error',
      },
      nonErrorAppender: {
        type: 'logLevelFilter',
        appender: 'out',
        level: 'trace',
        maxLevel: 'warn',
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
