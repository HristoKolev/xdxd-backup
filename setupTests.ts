import os from 'node:os';

import { $, usePowerShell } from 'zx';

import { isDebugging } from './src/testing/debugger.js';
import { isCIDebugEnabled } from './src/testing/env-helpers.js';

// Setup ZX
if (os.platform() === 'win32') {
  usePowerShell();
}

$.verbose = isCIDebugEnabled() || isDebugging();
$.quiet = !isCIDebugEnabled() && !isDebugging();

// Don't format command arguments
$.quote = (arg) => arg;
