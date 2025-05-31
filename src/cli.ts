import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Option, program } from 'commander';

interface Cli {
  inputDirectory: string;
  outputDirectory: string;
  ignoreFilePath: string;
}

export function readCliArguments() {
  // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
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
    ).default('.backupignore')
  );

  return program.parse().opts<Cli>();
}
