import os from 'node:os';

import { $, usePowerShell } from 'zx';

import { isDetailedLoggingEnabled } from './env-helpers.js';

let initialized = false;

export function setupZx() {
  if (initialized) {
    return $;
  }

  if (os.platform() === 'win32') {
    usePowerShell();
  }

  $.verbose = isDetailedLoggingEnabled();
  $.quiet = !isDetailedLoggingEnabled();
  $.env.FORCE_COLOR = '3';

  initialized = true;

  return $;
}
