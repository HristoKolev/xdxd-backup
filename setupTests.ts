import os from 'node:os';

import { $, usePowerShell } from 'zx';

import {
  isCIDebugEnabled,
  isDebuggerAttached,
} from './src/testing/env-helpers.js';

// Setup ZX
if (os.platform() === 'win32') {
  usePowerShell();
}

$.verbose = isCIDebugEnabled() || isDebuggerAttached();
$.quiet = !isCIDebugEnabled() && !isDebuggerAttached();

// Don't format command arguments
$.quote = (arg) => arg;
