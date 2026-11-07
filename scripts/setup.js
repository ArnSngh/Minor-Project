import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(root, 'frontend');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('Installing frontend dependencies...');
const result = spawnSync(npm, ['install'], {
  cwd: frontend,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(`Could not run npm install: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('Setup complete. Start the project with npm run dev.');
