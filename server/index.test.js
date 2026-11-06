import test from 'node:test';
import assert from 'node:assert/strict';
import { server } from './index.js';

test('photo and listing retries are idempotent; withdrawn and accepted orders obey stock', async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, method, payload) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
    return { status: response.status, data: await response.json() };
  };
  try {
    const photoInput = { sellerId: 'demo-seller', clientPhotoId: 'test-photo', mimeType: 'image/png', base64: 'iVBORw0KGgo=' };
    const photo1 = await call('/api/listing-photos', 'POST', photoInput);
    const photo2 = await call('/api/listing-photos', 'POST', photoInput);
    assert.equal(photo1.data.photoId, photo2.data.photoId);
    const listingInput = { sellerId: 'demo-seller', clientDraftId: 'test-draft', photoId: photo1.data.photoId, title: 'Bell metal craft', category: 'handicraft', quantity: 2, unit: 'piece', unitPriceRupees: 500, estimatedWeightKgPerUnit: 1, packageLengthCmPerUnit: 20, packageWidthCmPerUnit: 20, packageHeightCmPerUnit: 20 };
    const listing1 = await call('/api/listings', 'POST', listingInput);
    const listing2 = await call('/api/listings', 'POST', listingInput);
    assert.equal(listing1.data.id, listing2.data.id);
    const order = () => call('/api/requests', 'POST', { listingId: listing1.data.id, buyerName: 'Demo buyer', buyerPhone: '+910000000001', quantity: 1 });
    const r1 = await order();
    await call(`/api/requests/${r1.data.id}/status`, 'PATCH', { action: 'withdraw' });
    const lateAccept = await call(`/api/requests/${r1.data.id}/status`, 'PATCH', { action: 'accept', exactQuantity: 1, unitPriceRupees: 500, totalPriceRupees: 500 });
    assert.equal(lateAccept.status, 409);
    const r2 = await order();
    const accepted = await call(`/api/requests/${r2.data.id}/status`, 'PATCH', { action: 'accept', exactQuantity: 1, unitPriceRupees: 500, totalPriceRupees: 500 });
    assert.equal(accepted.data.status, 'accepted');
    const duplicate = await call(`/api/requests/${r2.data.id}/status`, 'PATCH', { action: 'accept', exactQuantity: 1, unitPriceRupees: 500, totalPriceRupees: 500 });
    assert.equal(duplicate.status, 409);
    const listingAfter = await call(`/api/listings/${listing1.data.id}`, 'GET');
    assert.equal(listingAfter.data.availableQuantity, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
