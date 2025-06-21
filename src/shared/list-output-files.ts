import fs from 'node:fs/promises';

interface OutputFileListResult {
  archiveFileNames: string[];
  logFileNames: string[];
}

export async function listOutputFiles(
  targetPath: string
): Promise<OutputFileListResult> {
  const result: OutputFileListResult = {
    archiveFileNames: [],
    logFileNames: [],
  };

  const outputFiles = await fs.readdir(targetPath);

  outputFiles.sort((a, b) => a.localeCompare(b));

  result.archiveFileNames = outputFiles.filter((f) =>
    f.match(/-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.rar$/)
  );

  result.logFileNames = outputFiles.filter((f) =>
    f.match(/-\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.log$/)
  );

  return result;
}
