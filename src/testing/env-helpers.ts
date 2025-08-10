import process from 'node:process';

export function isCIDebugEnabled() {
  return process.env.CI_DEBUG === '1';
}

export function runsInCI() {
  return process.env.CI === 'true';
}

export function runNonExistingExecutableTests() {
  return process.env.RUN_NON_EXISTING_EXECUTABLES_TESTS === 'true';
}

export function getTestRetries() {
  const value = Number(process.env.TEST_RETRIES || '2');
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}
