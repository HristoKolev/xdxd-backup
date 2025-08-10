import inspector from 'node:inspector';

export function isDebugging() {
  return Boolean(
    inspector.url() ||
      process.execArgv.some((a) => /^--inspect(-brk)?/.test(a)) ||
      (process.env.NODE_OPTIONS || '').match(/--inspect(-brk)?/)
  );
}
