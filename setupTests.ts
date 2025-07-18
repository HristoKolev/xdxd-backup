import fsSync from 'node:fs';
import os from 'node:os';

import dotenv from 'dotenv';
import { $, usePowerShell } from 'zx';

import {
  isCIDebugEnabled,
  isDebuggerAttached,
} from './src/testing/env-helpers.js';

const fileNames = ['.env.local', '.env'];
const availableFileNames = fileNames.filter(fsSync.existsSync);

if (availableFileNames.length) {
  try {
    const result = dotenv.config({ path: availableFileNames });

    if (result.error) {
      // noinspection ExceptionCaughtLocallyJS
      throw result.error;
    }
  } catch (error) {
    throw new Error(
      'An error occurred while loading environment variables from files.',
      { cause: error }
    );
  }
}

// Setup ZX
if (os.platform() === 'win32') {
  usePowerShell();
}

$.verbose = isCIDebugEnabled() || isDebuggerAttached();
$.quiet = !isCIDebugEnabled() && !isDebuggerAttached();

// Don't format command arguments
$.quote = (arg) => arg;
