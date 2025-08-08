import { spawn } from 'node:child_process';
import process from 'node:process';

const child = spawn(
  'git',
  ['clean', '-dfX', '-e', '!**/*.local', '-e', '!.idea/**'],
  {
    stdio: ['inherit', 'pipe', 'pipe'],
  }
);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
child.on('close', process.exit);
child.on('error', (error) => {
  throw new Error(`Failed to spawn process.`, { cause: error });
});
