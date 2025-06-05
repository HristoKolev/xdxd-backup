import fsSync from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// eslint-disable-next-line no-underscore-dangle,@typescript-eslint/naming-convention
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

let cachedPackageJSON: Record<string, unknown> | undefined;

export function readPackageJson(): Record<string, unknown> {
  if (!cachedPackageJSON) {
    const fileContents = fsSync
      .readFileSync(path.resolve(__dirname, '../../package.json'))
      .toString();

    const parsed = JSON.parse(fileContents) as Record<string, unknown>;

    cachedPackageJSON = parsed;
  }

  return cachedPackageJSON;
}
