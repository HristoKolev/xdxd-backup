import log4js from 'log4js';

export function configureLogging(scriptName) {
  // Ensure we have a valid script name for logging
  if (!scriptName || typeof scriptName !== 'string') {
    throw new Error('Script name must be provided for logging configuration');
  }

  log4js.configure({
    appenders: {
      out: {
        type: 'stdout',
        layout: { type: 'colored' },
      },
      err: {
        type: 'stderr',
        layout: { type: 'colored' },
      },
      combined: {
        type: 'logLevelFilter',
        appender: 'err',
        level: 'error',
      },
      info: {
        type: 'logLevelFilter',
        appender: 'out',
        level: 'trace',
        maxLevel: 'warn',
      },
    },
    categories: {
      default: {
        appenders: ['info', 'combined'],
        level: process.env.SCRIPT_LOG_LEVEL || 'info',
      },
    },
  });

  return log4js.getLogger(scriptName);
}
