import http from 'node:http';
import { readFileSync } from 'node:fs';

const PORT = Number(process.env.PORT || 4100);
const SAMPLE_TRIPS = JSON.parse(readFileSync(new URL('./data/trips.json', import.meta.url), 'utf8'));

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(JSON.stringify(payload));
}

function errorResponse(status, code, message) {
  return send({ status }, { error: { code, message } });
}

function parseRequiredNumber(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a finite number`);
  }
  return num;
}

function validateRequest(body) {
  if (!body || typeof body !== 'object') throw new Error('Request body is required');
  const requiredFields = ['origin', 'destination', 'pickupRadiusKm', 'dropRadiusKm', 'loadKg', 'packageCount', 'packageLengthCm', 'packageWidthCm', 'packageHeightCm', 'earliestDepartAt'];
  for (const field of requiredFields) {
    if (!(field in body)) throw new Error(`Missing required field: ${field}`);
  }
  if (!body.origin || typeof body.origin.lat !== 'number' || typeof body.origin.lng !== 'number') throw new Error('origin must include lat and lng numbers');
  if (!body.destination || typeof body.destination.lat !== 'number' || typeof body.destination.lng !== 'number') throw new Error('destination must include lat and lng numbers');

  const pickupRadiusKm = parseRequiredNumber(body.pickupRadiusKm, 'pickupRadiusKm');
  const dropRadiusKm = parseRequiredNumber(body.dropRadiusKm, 'dropRadiusKm');
  const loadKg = parseRequiredNumber(body.loadKg, 'loadKg');
  const packageCount = parseRequiredNumber(body.packageCount, 'packageCount');
  const packageLengthCm = parseRequiredNumber(body.packageLengthCm, 'packageLengthCm');
  const packageWidthCm = parseRequiredNumber(body.packageWidthCm, 'packageWidthCm');
  const packageHeightCm = parseRequiredNumber(body.packageHeightCm, 'packageHeightCm');

  if (pickupRadiusKm < 0 || dropRadiusKm < 0) throw new Error('pickupRadiusKm and dropRadiusKm must be non-negative');
  if (loadKg <= 0 || packageCount <= 0 || packageLengthCm <= 0 || packageWidthCm <= 0 || packageHeightCm <= 0) throw new Error('All load and package values must be greater than zero');

  if (Number.isNaN(Date.parse(body.earliestDepartAt))) throw new Error('earliestDepartAt must be an ISO 8601 timestamp');
  return {
    origin: { lat: body.origin.lat, lng: body.origin.lng },
    destination: { lat: body.destination.lat, lng: body.destination.lng },
    pickupRadiusKm,
    dropRadiusKm,
    loadKg,
    packageCount,
    packageLengthCm,
    packageWidthCm,
    packageHeightCm,
    earliestDepartAt: new Date(body.earliestDepartAt)
  };
}

function routeDirectionIsCorrect(request, trip) {
  const originLat = request.origin.lat;
  const destLat = request.destination.lat;
  const pickupLat = trip.pickupPoint.lat;
  const dropLat = trip.dropPoint.lat;

  return originLat <= pickupLat && pickupLat <= dropLat && dropLat <= destLat;
}

function hasObviousCargoSizeMismatch(request, trip) {
  const maxParcelDimension = Math.max(request.packageLengthCm, request.packageWidthCm, request.packageHeightCm);
  const maxTripParcel = 180;
  if (maxParcelDimension > maxTripParcel) return true;
  const cubicCm = request.packageLengthCm * request.packageWidthCm * request.packageHeightCm;
  return cubicCm > 1_500_000;
}

function findMatches(request) {
  const bestMatches = SAMPLE_TRIPS.filter((trip) => {
    if (trip.active === false) return false;
    if (trip.availableCapacityKg < request.loadKg) return false;
    if (request.loadKg > 300) return false;
    if (trip.pickupDistanceKm > request.pickupRadiusKm) return false;
    if (trip.dropDistanceKm > request.dropRadiusKm) return false;
    if (!routeDirectionIsCorrect(request, trip)) return false;
    if (new Date(trip.departAt).getTime() < request.earliestDepartAt.getTime()) return false;
    if (hasObviousCargoSizeMismatch(request, trip)) return false;
    return true;
  }).sort((a, b) => (a.pickupDistanceKm + a.dropDistanceKm) - (b.pickupDistanceKm + b.dropDistanceKm));

  return bestMatches.map((trip) => ({
    tripId: trip.tripId,
    transporterName: trip.transporterName,
    transporterPhone: trip.transporterPhone,
    vehicleType: trip.vehicleType,
    availableCapacityKg: trip.availableCapacityKg,
    departAt: trip.departAt,
    routeSummary: trip.routeSummary,
    pickupPoint: trip.pickupPoint,
    dropPoint: trip.dropPoint,
    pickupDistanceKm: trip.pickupDistanceKm,
    dropDistanceKm: trip.dropDistanceKm,
    sharedRouteKm: trip.sharedRouteKm,
    fitStatus: trip.fitStatus,
    explanation: trip.explanation
  }));
}

export async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'OPTIONS') {
    return send(res, 204, {});
  }

  if (req.method === 'GET' && url.pathname === '/v1/health') {
    return send(res, 200, { status: 'ok', contractVersion: '1' });
  }

  if (req.method === 'POST' && url.pathname === '/v1/matches') {
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 2_000_000) {
          throw new Error('request body too large');
        }
      }
      const body = raw ? JSON.parse(raw) : {};
      const request = validateRequest(body);
      const matches = findMatches(request);
      return send(res, 200, { matches });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid transport request';
      if (message.includes('Missing required field') || message.includes('must be') || message.includes('Request body is required')) {
        return send(res, 400, { error: { code: 'INVALID_INPUT', message } });
      }
      if (message === 'request body too large') {
        return send(res, 413, { error: { code: 'INVALID_INPUT', message } });
      }
      return send(res, 503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'Transport service unavailable' } });
    }
  }

  return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
}

export const server = http.createServer(handle);

if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Transport API on ${PORT}`));
}
