import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const suites = [
  ['Marketplace API', resolve(root, 'server')],
  ['Transport service', resolve(root, 'transport-service')]
];

for (const [label, cwd] of suites) {
  console.log(`\nRunning ${label} tests...`);
  const result = spawnSync(process.execPath, ['--test'], {
    cwd,
    stdio: 'inherit'
  });
  if (result.error) {
    console.error(`${label} tests could not start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('\nAll backend test suites passed.');
