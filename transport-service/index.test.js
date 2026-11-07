import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from './index.js';

async function call(path, method, payload) {
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
  return { status: response.status, data: await response.json() };
}

test('transport service health and valid match contract', async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const health = await call('/v1/health', 'GET');
    assert.equal(health.status, 200);
    assert.equal(health.data.status, 'ok');

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

    const result = await call('/v1/matches', 'POST', payload);
    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.data.matches));
    assert.ok(result.data.matches.length > 0);
    assert.equal(result.data.matches[0].tripId, 'demo-trip-1');
    assert.equal(result.data.matches[0].fitStatus, 'potential_fit');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('transport service rejects invalid input and empty match scenarios', async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const invalid = await call('/v1/matches', 'POST', {
      origin: { lat: 19.5939, lng: 81.6689 },
      destination: { lat: 21.2514, lng: 81.6296 },
      pickupRadiusKm: -1,
      dropRadiusKm: 10,
      loadKg: 100,
      packageCount: 1,
      packageLengthCm: 80,
      packageWidthCm: 60,
      packageHeightCm: 50,
      earliestDepartAt: '2026-11-07T00:00:00+05:30'
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.data.error.code, 'INVALID_INPUT');

    const tooHeavy = await call('/v1/matches', 'POST', {
      origin: { lat: 19.5939, lng: 81.6689 },
      destination: { lat: 21.2514, lng: 81.6296 },
      pickupRadiusKm: 10,
      dropRadiusKm: 10,
      loadKg: 500,
      packageCount: 1,
      packageLengthCm: 80,
      packageWidthCm: 60,
      packageHeightCm: 50,
      earliestDepartAt: '2026-11-07T00:00:00+05:30'
    });
    assert.equal(tooHeavy.status, 200);
    assert.deepEqual(tooHeavy.data.matches, []);

    const reverseRoute = await call('/v1/matches', 'POST', {
      origin: { lat: 21.2514, lng: 81.6296 },
      destination: { lat: 19.5939, lng: 81.6689 },
      pickupRadiusKm: 10,
      dropRadiusKm: 10,
      loadKg: 100,
      packageCount: 1,
      packageLengthCm: 80,
      packageWidthCm: 60,
      packageHeightCm: 50,
      earliestDepartAt: '2026-11-07T00:00:00+05:30'
    });
    assert.equal(reverseRoute.status, 200);
    assert.deepEqual(reverseRoute.data.matches, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
