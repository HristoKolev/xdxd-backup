import { $ } from 'zx';

/**
 * Checks if an executable exists in the system PATH.
 */
export async function isExecutableInPath(executable: string): Promise<boolean> {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'where' : 'which';

  const result = await $`${command} ${executable}`.nothrow();
  return result.exitCode === 0;
}

const startTime = new Date();

export function generateDateString() {
  const day = String(startTime.getDate()).padStart(2, '0');
  const month = String(startTime.getMonth() + 1).padStart(2, '0');
  const year = startTime.getFullYear();
  const hours = String(startTime.getHours()).padStart(2, '0');
  const minutes = String(startTime.getMinutes()).padStart(2, '0');
  const seconds = String(startTime.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
}
