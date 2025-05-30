import { Option, program } from 'commander';

interface Cli {
  inputDirectory: string;
  outputDirectory: string;
  ignoreFilePath: string;
}

export function readCliArguments() {
  // TODO: Mark as required.
  program.addOption(
    new Option('-i, --inputDirectory <inputDirectory>', 'Input directory')
  );

  // TODO: Mark as required.
  program.addOption(
    new Option('-o, --outputDirectory <outputDirectory>', 'Output directory')
  );

  program.addOption(
    new Option(
      '--ignoreFilePath <ignoreFilePath>',
      'Backup ignore file path'
    ).default('.backupignore')
  );

  return program.parse().opts<Cli>();
}
