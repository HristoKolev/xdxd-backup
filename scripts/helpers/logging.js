import log4js from 'log4js';

export function configureLogging(scriptName) {
  // Ensure we have a valid script name for logging
  if (!scriptName || typeof scriptName !== 'string') {
    throw new Error('Script name must be provided for logging configuration');
  }

  log4js.configure({
    appenders: {
      out: { type: 'stdout' },
      err: { type: 'stderr' },
    },
    categories: {
      default: {
        appenders: ['out'],
        level: process.env.SCRIPT_LOG_LEVEL || 'info',
      },
    },
  });

  return log4js.getLogger(scriptName);
}
