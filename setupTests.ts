import fsSync from 'node:fs';
import os from 'node:os';

import dotenv from 'dotenv';
import { $, usePowerShell } from 'zx';

import { isCIDebugEnabled } from './testing/env-helpers.js';

const fileNames = ['.env.local', '.env'];
const availableFileNames = fileNames.filter(fsSync.existsSync);

if (availableFileNames.length) {
  try {
    const result = dotenv.config({ path: availableFileNames });

    if (result.error) {
      // noinspection ExceptionCaughtLocallyJS
      throw result.error;
    }
    // eslint-disable-next-line @arabasta/javascript/report-caught-error
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

$.verbose = isCIDebugEnabled();
$.quiet = !isCIDebugEnabled();

// Don't format command arguments
$.quote = (arg) => arg;
