// Optional address lookup via a Nominatim-compatible geocoder (default: the
// public OpenStreetMap instance - no API key, low-volume use only). Only ever
// called on an explicit admin click, never automatically. Set
// NEXT_PUBLIC_GEOCODER_URL=off to disable, or point it at your own instance.
const GEOCODER_URL = process.env.NEXT_PUBLIC_GEOCODER_URL || 'https://nominatim.openstreetmap.org';

export const isGeocoderEnabled = () => GEOCODER_URL !== 'off';

async function geocoderFetch(path, params) {
  if (!isGeocoderEnabled()) throw new Error('Address lookup is disabled');
  const url = `${GEOCODER_URL.replace(/\/$/, '')}/${path}?${new URLSearchParams({ format: 'jsonv2', ...params })}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Address lookup failed');
  return res.json();
}

export async function reverseGeocode(latitude, longitude) {
  const data = await geocoderFetch('reverse', { lat: String(latitude), lon: String(longitude), zoom: '18' });
  return data?.display_name || null;
}

export async function searchAddress(query) {
  const rows = await geocoderFetch('search', { q: query, limit: '5' });
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    label: r.display_name,
    latitude: Number(r.lat),
    longitude: Number(r.lon),
  }));
}
