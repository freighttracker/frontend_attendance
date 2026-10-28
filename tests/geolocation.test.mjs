// Run with `npm test` (Node's built-in runner; no extra dependencies).
// The device location is always mocked - nothing touches real GPS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrentLocation,
  queryLocationPermission,
  codeFromPositionError,
  GEO_ERROR,
  fmtDistance,
  fmtAccuracy,
  locationTone,
  locationLabel,
  RECOVERABLE_PUNCH_CODES,
} from '../lib/utils/geolocation.js';

const mockGeolocation = (outcome) => ({
  calls: [],
  getCurrentPosition(success, failure, options) {
    this.calls.push(options);
    if (outcome.error) failure(outcome.error);
    else success({ coords: outcome.coords, timestamp: 1700000000000 });
  },
});

test('getCurrentLocation resolves a one-shot high-accuracy reading', async () => {
  const geolocation = mockGeolocation({ coords: { latitude: 23.0225, longitude: 72.5714, accuracy: 14 } });
  const fix = await getCurrentLocation({ geolocation, isSecure: true });
  assert.deepEqual(fix, { latitude: 23.0225, longitude: 72.5714, accuracy: 14, capturedAt: 1700000000000 });
  assert.equal(geolocation.calls.length, 1);
  assert.equal(geolocation.calls[0].enableHighAccuracy, true);
  assert.equal(geolocation.calls[0].maximumAge, 0);
});

test('permission denied, unavailable and timeout map to clear errors', async () => {
  for (const [code, expected] of [[1, GEO_ERROR.DENIED], [2, GEO_ERROR.UNAVAILABLE], [3, GEO_ERROR.TIMEOUT]]) {
    const geolocation = mockGeolocation({ error: { code } });
    await assert.rejects(getCurrentLocation({ geolocation, isSecure: true }), (err) => {
      assert.equal(err.code, expected);
      assert.ok(err.message.length > 10);
      return true;
    });
  }
});

test('insecure context and missing API are reported without prompting', async () => {
  const geolocation = mockGeolocation({ coords: { latitude: 1, longitude: 1, accuracy: 1 } });
  await assert.rejects(getCurrentLocation({ geolocation, isSecure: false }), (err) => err.code === GEO_ERROR.INSECURE);
  assert.equal(geolocation.calls.length, 0);
  await assert.rejects(getCurrentLocation({ geolocation: undefined, isSecure: true }), (err) => err.code === GEO_ERROR.UNSUPPORTED);
});

test('codeFromPositionError defaults to unavailable', () => {
  assert.equal(codeFromPositionError(undefined), GEO_ERROR.UNAVAILABLE);
});

test('queryLocationPermission reads state and tolerates unsupported browsers', async () => {
  assert.equal(await queryLocationPermission({ query: async () => ({ state: 'denied' }) }), 'denied');
  assert.equal(await queryLocationPermission(undefined), 'unknown');
  assert.equal(await queryLocationPermission({ query: async () => { throw new Error('nope'); } }), 'unknown');
});

test('distance and accuracy formatting', () => {
  assert.equal(fmtDistance(42.4), '42 m');
  assert.equal(fmtDistance(1500), '1.5 km');
  assert.equal(fmtDistance(25000), '25 km');
  assert.equal(fmtDistance(undefined), '—');
  assert.equal(fmtAccuracy(12.6), '±13 m');
});

test('location badge tone and label follow review state first', () => {
  assert.equal(locationTone('valid', 'none'), 'ok');
  assert.equal(locationTone('outside_geofence', 'pending'), 'warn');
  assert.equal(locationTone('outside_geofence', 'approved'), 'ok');
  assert.equal(locationTone('low_accuracy', 'rejected'), 'bad');
  assert.equal(locationTone('not_required', 'none'), 'muted');
  assert.equal(locationTone(undefined, undefined), 'muted');
  assert.equal(locationLabel('outside_geofence', 'pending'), 'Review pending');
  assert.equal(locationLabel('valid', 'none'), 'Inside geofence');
});

test('recoverable punch codes cover the location failures the server returns', () => {
  for (const code of ['LOCATION_REQUIRED', 'LOW_ACCURACY', 'OUTSIDE_GEOFENCE', 'NO_ACTIVE_OFFICE']) {
    assert.ok(RECOVERABLE_PUNCH_CODES.includes(code), code);
  }
  assert.ok(!RECOVERABLE_PUNCH_CODES.includes('ALREADY_CHECKED_IN'));
});
