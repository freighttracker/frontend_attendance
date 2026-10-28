// Browser location capture for check-in/check-out. Location is read once,
// only when the employee taps Check In / Check Out - never watched or
// polled in the background.

export const GEO_ERROR = {
  UNSUPPORTED: 'UNSUPPORTED',
  INSECURE: 'INSECURE',
  DENIED: 'DENIED',
  UNAVAILABLE: 'UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
};

const GEO_ERROR_MESSAGES = {
  UNSUPPORTED: 'This browser cannot share your location. Use a different browser or the mobile app.',
  INSECURE: 'Location only works over a secure (https) connection.',
  DENIED: 'Location permission is blocked. Allow location for this site in your browser settings, then retry.',
  UNAVAILABLE: 'Your location could not be determined. Turn on location services / GPS and retry.',
  TIMEOUT: 'Getting your location took too long. Move near a window or outdoors and retry.',
};

export function geoErrorMessage(code) {
  return GEO_ERROR_MESSAGES[code] || GEO_ERROR_MESSAGES.UNAVAILABLE;
}

// Maps a GeolocationPositionError (code 1/2/3) to our codes.
export function codeFromPositionError(error) {
  if (error?.code === 1) return GEO_ERROR.DENIED;
  if (error?.code === 3) return GEO_ERROR.TIMEOUT;
  return GEO_ERROR.UNAVAILABLE;
}

function geoFailure(code) {
  const err = new Error(geoErrorMessage(code));
  err.code = code;
  return err;
}

// One-shot, high-accuracy position read. `geolocation` and `isSecure` are
// injectable so tests can mock the device.
export function getCurrentLocation({
  geolocation = typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
  isSecure = typeof window !== 'undefined' ? window.isSecureContext !== false : true,
  timeout = 15000,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!isSecure) return reject(geoFailure(GEO_ERROR.INSECURE));
    if (!geolocation || typeof geolocation.getCurrentPosition !== 'function') {
      return reject(geoFailure(GEO_ERROR.UNSUPPORTED));
    }
    geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: pos.timestamp || Date.now(),
        }),
      (error) => reject(geoFailure(codeFromPositionError(error))),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

// 'granted' | 'denied' | 'prompt' | 'unknown' - without prompting the user.
export async function queryLocationPermission(permissions = typeof navigator !== 'undefined' ? navigator.permissions : undefined) {
  try {
    if (!permissions?.query) return 'unknown';
    const status = await permissions.query({ name: 'geolocation' });
    return status?.state || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function fmtDistance(meters) {
  if (meters === null || meters === undefined || Number.isNaN(Number(meters))) return '—';
  const m = Number(meters);
  return m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`;
}

export function fmtAccuracy(meters) {
  if (meters === null || meters === undefined || Number.isNaN(Number(meters))) return '—';
  return `±${Math.round(Number(meters))} m`;
}

export function fmtCoords(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export const VALIDATION_LABELS = {
  valid: 'Inside geofence',
  outside_geofence: 'Outside geofence',
  low_accuracy: 'Low GPS accuracy',
  no_location: 'No location',
  no_office: 'No office assigned',
  not_required: 'Not required',
};

export const REVIEW_LABELS = {
  pending: 'Review pending',
  approved: 'Exception approved',
  rejected: 'Exception rejected',
};

// Tone for a punch's location badge: ok / warn / bad / muted.
export function locationTone(validationStatus, reviewStatus) {
  if (reviewStatus === 'rejected') return 'bad';
  if (reviewStatus === 'approved') return 'ok';
  if (reviewStatus === 'pending') return 'warn';
  if (validationStatus === 'valid') return 'ok';
  if (!validationStatus || validationStatus === 'not_required') return 'muted';
  return 'warn';
}

export function locationLabel(validationStatus, reviewStatus) {
  if (reviewStatus && reviewStatus !== 'none') return REVIEW_LABELS[reviewStatus] || reviewStatus;
  return VALIDATION_LABELS[validationStatus] || 'No location data';
}

// Error codes from the check-in/out API that the employee can resolve by
// retrying or by submitting a reason (see backend geoAttendance.service).
export const RECOVERABLE_PUNCH_CODES = ['LOCATION_REQUIRED', 'LOW_ACCURACY', 'OUTSIDE_GEOFENCE', 'NO_ACTIVE_OFFICE', 'INVALID_COORDINATES'];

export function osmLink(lat, lng) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
}
