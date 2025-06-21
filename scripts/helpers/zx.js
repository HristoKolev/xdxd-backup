import os from 'node:os';

import { $, usePowerShell } from 'zx';

export function configureZx() {
  // Configure shell based on platform
  if (os.platform() === 'win32') {
    usePowerShell();
  }

  $.verbose = true;

  // Don't format command arguments to avoid issues with special characters
  $.quote = (arg) => arg;
}
