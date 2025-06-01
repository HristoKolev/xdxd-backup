import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';

import { Option, program } from 'commander';

import { getErrorLogger } from './logging.js';

export interface CliOptions {
  inputDirectory: string;
  outputDirectory: string;
  ignoreFilePath?: string;
}

export async function readCliArguments() {
  const logger = getErrorLogger();

  function fail(message: string, ...args: unknown[]): never {
    logger.fatal(message, ...args);
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf8')
  ) as {
    version: string;
  };

  program.version(
    packageJson.version,
    '-v, --version',
    'Display version number'
  );

  program.requiredOption(
    '-i, --inputDirectory <inputDirectory>',
    'Input directory'
  );

  program.requiredOption(
    '-o, --outputDirectory <outputDirectory>',
    'Output directory'
  );

  program.addOption(
    new Option(
      '--ignoreFilePath <ignoreFilePath>',
      'Backup ignore file path'
    ).argParser((value) => {
      if (value) {
        const resolvedFilePath = path.resolve(value);

        if (!fsSync.existsSync(resolvedFilePath)) {
          fail(`Could not find backup ignore file "${resolvedFilePath}".`);
        }

        return resolvedFilePath;
      }

      return undefined;
    })
  );

  return program.parse(process.argv).opts<CliOptions>();
}
