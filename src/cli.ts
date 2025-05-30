import { Option, program } from 'commander';

interface Cli {
  inputDirectory: string;
  outputDirectory: string;
  ignoreFilePath: string;
}

export function readCliArguments() {
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
