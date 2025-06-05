import process from 'node:process';

export function isCIDebugEnabled() {
  return process.env.CI_DEBUG === '1';
}

export function runsInCI() {
  return process.env.CI === 'true';
}

export function isDebuggerAttached() {
  return process.env.IS_DEBUGGER_ATTACHED === 'true';
}

export function runNonExistingExecutableTests() {
  return process.env.RUN_NON_EXISTING_EXECUTABLES_TESTS === 'true';
}
