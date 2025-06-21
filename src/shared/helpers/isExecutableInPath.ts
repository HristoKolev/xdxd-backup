import { exec } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Checks if an executable exists in the system PATH.
 */
export async function isExecutableInPath(executable: string): Promise<boolean> {
  // Handle edge cases
  if (!executable || !executable.trim()) {
    return false;
  }

  try {
    if (process.platform === 'win32') {
      await execAsync(`get-command ${executable}`, { shell: 'powershell' });
      return true;
    }

    await execAsync(`which ${executable}`);
    return true;
  } catch (_error) {
    return false;
  }
}
