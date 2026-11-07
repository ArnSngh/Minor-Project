import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const PORT = Number(process.env.PORT || 4000);
const TRANSPORT_API_BASE_URL = process.env.TRANSPORT_API_BASE_URL;
const seller = { id: 'demo-seller', name: 'Demo Kondagaon Seller', phone: '+910000000000', village: 'Kondagaon', district: 'Kondagaon' };
const listings = new Map();
const photos = new Map();
const requests = new Map();
const draftIds = new Map();
const photoIds = new Map();

function send(res, status, data, contentType = 'application/json') {
  res.writeHead(status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(contentType === 'application/json' ? JSON.stringify(data) : data);
}
function fail(res, status, code, message) { send(res, status, { error: { code, message } }); }
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 7_000_000) throw new Error('TOO_LARGE');
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('INVALID_JSON'); }
}
function positive(n) { return typeof n === 'number' && Number.isFinite(n) && n > 0; }
function text(v) { return typeof v === 'string' && v.trim().length > 0; }
function publicListing(l) { return { ...l, imageUrl: l.photoId ? `/api/photos/${l.photoId}` : null }; }

export async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, null);
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  try {
    if (req.method === 'GET' && path === '/api/health') return send(res, 200, { status: 'ok' });
    if (req.method === 'GET' && path === '/api/demo-seller') return send(res, 200, seller);
    if (req.method === 'POST' && path === '/api/listing-photos') {
      const b = await body(req);
      if (b.sellerId !== seller.id || !text(b.clientPhotoId) || !['image/jpeg', 'image/png', 'image/webp'].includes(b.mimeType) || !text(b.base64)) return fail(res, 400, 'INVALID_INPUT', 'A valid seller, photo ID, image type and image data are required');
      if (!/^[A-Za-z0-9+/=]+$/.test(b.base64) || b.base64.length > 5_500_000) return fail(res, 400, 'INVALID_IMAGE', 'Invalid or oversized image');
      const key = `${b.sellerId}:${b.clientPhotoId}`;
      if (photoIds.has(key)) return send(res, 200, { photoId: photoIds.get(key) });
      const id = randomUUID();
      photos.set(id, { bytes: Buffer.from(b.base64, 'base64'), mimeType: b.mimeType, sellerId: b.sellerId });
      photoIds.set(key, id);
      return send(res, 201, { photoId: id });
    }
    const photoMatch = path.match(/^\/api\/photos\/([^/]+)$/);
    if (req.method === 'GET' && photoMatch) {
      const p = photos.get(photoMatch[1]);
      if (!p) return fail(res, 404, 'NOT_FOUND', 'Photo not found');
      return send(res, 200, p.bytes, p.mimeType);
    }
    if (req.method === 'POST' && path === '/api/listings') {
      const b = await body(req);
      if (b.sellerId !== seller.id || !text(b.clientDraftId) || !text(b.title) || !text(b.category) || !positive(b.quantity) || !['kg', 'piece'].includes(b.unit) || !positive(b.unitPriceRupees) || !positive(b.estimatedWeightKgPerUnit) || !positive(b.packageLengthCmPerUnit) || !positive(b.packageWidthCmPerUnit) || !positive(b.packageHeightCmPerUnit) || !text(b.photoId) || !photos.has(b.photoId)) return fail(res, 400, 'INVALID_INPUT', 'Complete listing and photo are required');
      const key = `${b.sellerId}:${b.clientDraftId}`;
      if (draftIds.has(key)) return send(res, 200, publicListing(listings.get(draftIds.get(key))));
      const id = randomUUID();
      const l = { id, sellerId: b.sellerId, title: b.title.trim(), category: b.category, description: String(b.description || ''), quantity: b.quantity, availableQuantity: b.quantity, unit: b.unit, unitPriceRupees: b.unitPriceRupees, estimatedWeightKgPerUnit: b.estimatedWeightKgPerUnit, packageLengthCmPerUnit: b.packageLengthCmPerUnit, packageWidthCmPerUnit: b.packageWidthCmPerUnit, packageHeightCmPerUnit: b.packageHeightCmPerUnit, village: String(b.village || seller.village), pickupLocation: b.pickupLocation || { lat: 19.5939, lng: 81.6689 }, photoId: b.photoId, status: 'active' };
      listings.set(id, l); draftIds.set(key, id);
      return send(res, 201, publicListing(l));
    }
    if (req.method === 'GET' && path === '/api/listings') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return send(res, 200, { listings: [...listings.values()].filter(l => l.status === 'active' && l.title.toLowerCase().includes(q)).map(publicListing) });
    }
    const listingMatch = path.match(/^\/api\/listings\/([^/]+)$/);
    if (req.method === 'GET' && listingMatch) {
      const l = listings.get(listingMatch[1]);
      return l ? send(res, 200, publicListing(l)) : fail(res, 404, 'NOT_FOUND', 'Listing not found');
    }
    if (req.method === 'POST' && path === '/api/requests') {
      const b = await body(req); const l = listings.get(b.listingId);
      if (!l || !text(b.buyerName) || !/^\+?[0-9]{10,15}$/.test(String(b.buyerPhone || '')) || !positive(b.quantity) || b.quantity > l.availableQuantity) return fail(res, 400, 'INVALID_INPUT', 'Valid listing, buyer and available quantity are required');
      const id = randomUUID();
      const r = { id, listingId: l.id, sellerId: l.sellerId, buyerName: b.buyerName.trim(), buyerPhone: b.buyerPhone, sellerPhone: seller.phone, quantity: b.quantity, unit: l.unit, requestedUnitPriceRupees: l.unitPriceRupees, status: 'pending', createdAt: new Date().toISOString() };
      requests.set(id, r); return send(res, 201, r);
    }
    const requestMatch = path.match(/^\/api\/requests\/([^/]+)$/);
    if (req.method === 'GET' && requestMatch) {
      const r = requests.get(requestMatch[1]); return r ? send(res, 200, r) : fail(res, 404, 'NOT_FOUND', 'Request not found');
    }
    const sellerRequests = path.match(/^\/api\/sellers\/([^/]+)\/requests$/);
    if (req.method === 'GET' && sellerRequests) return send(res, 200, { requests: [...requests.values()].filter(r => r.sellerId === sellerRequests[1]) });
    const statusMatch = path.match(/^\/api\/requests\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
      const r = requests.get(statusMatch[1]); if (!r) return fail(res, 404, 'NOT_FOUND', 'Request not found');
      const b = await body(req);
      if (r.status !== 'pending') return fail(res, 409, 'INVALID_STATE', 'Request is no longer pending');
      if (b.action === 'withdraw' || b.action === 'decline') { r.status = b.action === 'withdraw' ? 'withdrawn' : 'declined'; return send(res, 200, r); }
      if (b.action !== 'accept') return fail(res, 400, 'INVALID_INPUT', 'Unknown action');
      const l = listings.get(r.listingId);
      if (!positive(b.exactQuantity) || !positive(b.unitPriceRupees) || !positive(b.totalPriceRupees) || Math.abs(b.exactQuantity * b.unitPriceRupees - b.totalPriceRupees) > 0.01) return fail(res, 400, 'INVALID_TERMS', 'Price and quantity do not match total');
      if (b.exactQuantity !== r.quantity || b.unitPriceRupees !== r.requestedUnitPriceRupees) return fail(res, 409, 'COUNTEROFFER_REQUIRED', 'Changed terms require buyer approval in a later sprint');
      if (l.availableQuantity < b.exactQuantity) return fail(res, 409, 'STOCK_UNAVAILABLE', 'Not enough stock');
      l.availableQuantity -= b.exactQuantity;
      r.status = 'accepted'; r.acceptedQuantity = b.exactQuantity; r.acceptedUnitPriceRupees = b.unitPriceRupees; r.acceptedTotalPriceRupees = b.totalPriceRupees;
      return send(res, 200, r);
    }
    if (req.method === 'POST' && path === '/api/transport/matches') {
      const b = await body(req);
      const required = ['origin', 'destination', 'pickupRadiusKm', 'dropRadiusKm', 'loadKg', 'packageCount', 'packageLengthCm', 'packageWidthCm', 'packageHeightCm', 'earliestDepartAt'];
      const hasRequired = required.every(key => key in (b || {}));
      if (!hasRequired || typeof b.origin?.lat !== 'number' || typeof b.origin?.lng !== 'number' || typeof b.destination?.lat !== 'number' || typeof b.destination?.lng !== 'number') {
        return fail(res, 400, 'INVALID_INPUT', 'All transport match fields are required');
      }
      if (!Number.isFinite(b.pickupRadiusKm) || !Number.isFinite(b.dropRadiusKm) || b.pickupRadiusKm < 0 || b.dropRadiusKm < 0 || !Number.isFinite(b.loadKg) || b.loadKg <= 0 || !Number.isFinite(b.packageCount) || b.packageCount <= 0 || !Number.isFinite(b.packageLengthCm) || b.packageLengthCm <= 0 || !Number.isFinite(b.packageWidthCm) || b.packageWidthCm <= 0 || !Number.isFinite(b.packageHeightCm) || b.packageHeightCm <= 0 || !b.earliestDepartAt) {
        return fail(res, 400, 'INVALID_INPUT', 'Transport match values must be positive and valid');
      }
      if (TRANSPORT_API_BASE_URL) {
        try {
          const response = await fetch(`${TRANSPORT_API_BASE_URL.replace(/\/$/, '')}/v1/matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b), signal: AbortSignal.timeout(8000) });
          const data = await response.json();
          if (!response.ok) return send(res, response.status, data);
          return send(res, response.status, data);
        } catch {
          return fail(res, 503, 'TRANSPORT_UNAVAILABLE', 'Transport service unavailable');
        }
      }
      const originLat = Number(b.origin.lat); const originLng = Number(b.origin.lng);
      const destLat = Number(b.destination.lat); const destLng = Number(b.destination.lng);
      const validRoute = Math.abs(originLng - 81.6689) < 0.2 && Math.abs(destLng - 81.6296) < 0.2 && Math.abs(originLat - 19.5939) < 0.2 && Math.abs(destLat - 21.2514) < 0.2;
      const fits = Number(b.loadKg) <= 300 && Number(b.packageLengthCm) <= 300 && Number(b.packageWidthCm) <= 180 && Number(b.packageHeightCm) <= 180;
      const pickupRadius = Number(b.pickupRadiusKm); const dropRadius = Number(b.dropRadiusKm);
      if (!validRoute || !fits || pickupRadius < 7.4 || dropRadius < 6.1) return send(res, 200, { matches: [] });
      return send(res, 200, { matches: [{
        tripId: 'sample-kondagaon-raipur',
        transporterName: 'Sample transporter',
        transporterPhone: '+910000000000',
        vehicleType: 'medium_truck',
        availableCapacityKg: 300,
        departAt: new Date(Date.now() + 86400000).toISOString(),
        routeSummary: 'Kondagaon to Raipur via Kanker',
        pickupPoint: { name: 'Sample pickup near Kondagaon', lat: 19.65, lng: 81.66 },
        dropPoint: { name: 'Sample drop near Raipur', lat: 21.20, lng: 81.64 },
        pickupDistanceKm: 7.4,
        dropDistanceKm: 6.1,
        sharedRouteKm: 230,
        fitStatus: 'potential_fit',
        explanation: 'Pickup and drop are on the selected route in the correct order; confirm loading and availability by phone.'
      }] });
    }
    return fail(res, 404, 'NOT_FOUND', 'Endpoint not found');
  } catch (e) {
    if (e.message === 'TOO_LARGE') return fail(res, 413, 'TOO_LARGE', 'Request too large');
    if (e.message === 'INVALID_JSON') return fail(res, 400, 'INVALID_JSON', 'Invalid JSON');
    return fail(res, 500, 'SERVER_ERROR', 'Unexpected server error');
  }
}

export const server = http.createServer(handle);
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) server.listen(PORT, '0.0.0.0', () => console.log(`Marketplace API on ${PORT}`));
