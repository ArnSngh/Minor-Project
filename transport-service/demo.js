import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const payload = {
  origin: { lat: 19.5939, lng: 81.6689 },
  destination: { lat: 21.2514, lng: 81.6296 },
  pickupRadiusKm: 10,
  dropRadiusKm: 10,
  loadKg: 100,
  packageCount: 1,
  packageLengthCm: 80,
  packageWidthCm: 60,
  packageHeightCm: 50,
  earliestDepartAt: '2026-11-07T00:00:00+05:30'
};

async function main() {
  const healthResponse = await fetch('http://localhost:4100/v1/health');
  const health = await healthResponse.json();
  console.log('Health:', JSON.stringify(health, null, 2));

  const matchesResponse = await fetch('http://localhost:4100/v1/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const matches = await matchesResponse.json();
  console.log('Matches:', JSON.stringify(matches, null, 2));

  const outPath = resolve(import.meta.dirname, 'demo-output.json');
  writeFileSync(outPath, JSON.stringify({ health, matches }, null, 2), 'utf8');
  console.log(`Saved demo output to ${outPath}`);
}

main().catch((error) => {
  console.error('Transport demo failed:', error);
  process.exit(1);
});
