import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(root, 'frontend');
const expoCli = resolve(frontendDir, 'node_modules', 'expo', 'bin', 'cli');
const mobileMode = process.argv.includes('--mobile');

if (!existsSync(expoCli)) {
  console.error('Frontend dependencies are missing. Run npm run setup first.');
  process.exit(1);
}

const transportPort = process.env.TRANSPORT_PORT || '4100';
const marketplacePort = process.env.MARKETPLACE_PORT || '4000';
const transportBaseUrl = process.env.TRANSPORT_API_BASE_URL || `http://127.0.0.1:${transportPort}`;
const apiUrl = process.env.EXPO_PUBLIC_API_URL || `http://localhost:${marketplacePort}`;
const children = [];
let stopping = false;

function start(label, executable, args, cwd, env) {
  const child = spawn(executable, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    windowsHide: true
  });
  children.push({ label, child });

  child.on('error', (error) => {
    console.error(`${label} failed to start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (code !== 0) {
      console.error(`${label} exited unexpectedly (${signal || `code ${code}`}).`);
      stop(code || 1);
    }
  });

  return child;
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const { child } of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

process.once('SIGINT', () => stop(0));
process.once('SIGTERM', () => stop(0));

console.log(`Starting transport service on port ${transportPort}...`);
start('Transport service', process.execPath, ['index.js'], resolve(root, 'transport-service'), {
  PORT: transportPort
});

console.log(`Starting marketplace API on port ${marketplacePort}...`);
start('Marketplace API', process.execPath, ['index.js'], resolve(root, 'server'), {
  PORT: marketplacePort,
  TRANSPORT_API_BASE_URL: transportBaseUrl
});

console.log(`Starting Expo ${mobileMode ? 'for LAN/mobile' : 'web'} with API ${apiUrl}...`);
start('Expo frontend', process.execPath, [expoCli, 'start', ...(mobileMode ? ['--lan'] : ['--web'])], frontendDir, {
  EXPO_PUBLIC_API_URL: apiUrl
});

console.log('Press Ctrl+C to stop all project services.');
