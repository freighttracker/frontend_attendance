'use client';

import { useState } from 'react';
import { useCreateOfficeLocationMutation, useUpdateOfficeLocationMutation } from '@/lib/services/geoApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { getCurrentLocation, fmtAccuracy } from '@/lib/utils/geolocation';
import { searchAddress, isGeocoderEnabled } from '@/lib/utils/geocode';
import Modal from '../ui/Modal';
import LocationMap, { MAP_COLORS } from '../geo/LocationMap';

const numOrEmpty = (v) => (v === null || v === undefined ? '' : String(v));

// Client-side checks mirror the backend's (which remain authoritative).
function validate(form) {
  if (!form.name.trim()) return 'Office name is required.';
  if (!form.address.trim()) return 'Address is required.';
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  if (form.latitude === '' || Number.isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.';
  if (form.longitude === '' || Number.isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be between -180 and 180.';
  if (lat === 0 && lng === 0) return 'Pick the office on the map - 0,0 is not a valid location.';
  const radius = Number(form.radiusMeters);
  if (!Number.isInteger(radius) || radius < 10 || radius > 5000) return 'Geofence radius must be a whole number between 10 and 5000 metres.';
  if (form.maxAccuracyMeters !== '') {
    const acc = Number(form.maxAccuracyMeters);
    if (!Number.isInteger(acc) || acc < 5 || acc > 2000) return 'Maximum GPS accuracy must be 5-2000 metres (or blank for the policy value).';
  }
  if (form.code && !/^[A-Za-z0-9_-]{1,30}$/.test(form.code)) return 'Office code may contain letters, digits, - and _ only.';
  return null;
}

function OfficeForm({ office, defaultRadius, companyId, onClose }) {
  const [createOffice, { isLoading: creating }] = useCreateOfficeLocationMutation();
  const [updateOffice, { isLoading: updating }] = useUpdateOfficeLocationMutation();
  const toast = useToast();

  const [form, setForm] = useState({
    name: office?.name || '',
    code: office?.code || '',
    address: office?.address || '',
    latitude: numOrEmpty(office?.latitude),
    longitude: numOrEmpty(office?.longitude),
    radiusMeters: numOrEmpty(office?.radiusMeters ?? defaultRadius ?? 100),
    maxAccuracyMeters: numOrEmpty(office?.maxAccuracyMeters),
    allowCheckIn: office ? office.allowCheckIn !== false : true,
    allowCheckOut: office ? office.allowCheckOut !== false : true,
  });
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setPoint = ({ latitude, longitude }) =>
    setForm((f) => ({ ...f, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }));

  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const hasPoint = form.latitude !== '' && form.longitude !== '' && !Number.isNaN(lat) && !Number.isNaN(lng);

  async function useDeviceLocation() {
    setLocating(true);
    setLocNote('');
    try {
      const fix = await getCurrentLocation();
      setPoint(fix);
      setLocNote(`Captured from this device (${fmtAccuracy(fix.accuracy)}). Stand inside the office for best results.`);
    } catch (err) {
      setLocNote(err.message);
    } finally {
      setLocating(false);
    }
  }

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await searchAddress(query.trim()));
    } catch (err) {
      setResults([]);
      setLocNote(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit() {
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    const body = {
      name: form.name.trim(),
      code: form.code.trim() || (office ? '' : undefined),
      address: form.address.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusMeters: Number(form.radiusMeters),
      maxAccuracyMeters: form.maxAccuracyMeters === '' ? null : Number(form.maxAccuracyMeters),
      allowCheckIn: form.allowCheckIn,
      allowCheckOut: form.allowCheckOut,
    };
    try {
      if (office) {
        await updateOffice({ id: office._id, ...body }).unwrap();
        toast('Office updated');
      } else {
        await createOffice({ ...body, companyId: companyId || undefined }).unwrap();
        toast(`${body.name} added`);
      }
      onClose();
    } catch (err) {
      const details = Array.isArray(err?.data?.errors) ? err.data.errors.map((e) => e.msg || e).join(' ') : '';
      setError(details || extractErrorMessage(err, 'Could not save office.'));
    }
  }

  return (
    <>
      <div className="frow">
        <div className="ff">
          <label className="fl">Office name</label>
          <input className="fi" value={form.name} maxLength={120} onChange={set('name')} placeholder="e.g. Ahmedabad HQ" />
        </div>
        <div className="ff" style={{ maxWidth: 140 }}>
          <label className="fl">Code (optional)</label>
          <input className="fi" value={form.code} maxLength={30} onChange={set('code')} placeholder="AHD-HQ" />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Address</label>
        <textarea className="fi" rows={2} maxLength={500} value={form.address} onChange={set('address')} />
      </div>

      {isGeocoderEnabled() ? (
        <div className="ff">
          <label className="fl">Find on map</label>
          <div className="frow" style={{ alignItems: 'center' }}>
            <input
              className="fi"
              value={query}
              placeholder="Search an address or place"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <button className="btn btn-g btn-sm" onClick={runSearch} disabled={searching}>
              {searching ? '…' : 'Search'}
            </button>
          </div>
          {results.map((r) => (
            <button
              key={`${r.latitude},${r.longitude}`}
              className="btn btn-g btn-sm btn-full"
              style={{ marginTop: 4, justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'left' }}
              onClick={() => {
                setPoint(r);
                if (!form.address.trim()) setForm((f) => ({ ...f, address: r.label }));
                setResults([]);
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ fontSize: 11, color: 'var(--g400)', marginBottom: 6 }}>Click the map to place the office, or use this device&apos;s location.</div>
      <LocationMap
        height={240}
        onPick={setPoint}
        circles={hasPoint ? [{ id: 'office', latitude: lat, longitude: lng, radiusMeters: Number(form.radiusMeters) || 0, color: MAP_COLORS.office, label: [form.name || 'Office', `Radius ${form.radiusMeters} m`] }] : []}
      />
      <button className="btn btn-g btn-sm" style={{ marginTop: 8 }} onClick={useDeviceLocation} disabled={locating}>
        {locating ? 'Getting location…' : 'Use my current location'}
      </button>
      {locNote ? <div style={{ fontSize: 11, color: 'var(--g600)', marginTop: 4 }}>{locNote}</div> : null}

      <div className="frow" style={{ marginTop: 12 }}>
        <div className="ff">
          <label className="fl">Latitude</label>
          <input className="fi" inputMode="decimal" value={form.latitude} onChange={set('latitude')} />
        </div>
        <div className="ff">
          <label className="fl">Longitude</label>
          <input className="fi" inputMode="decimal" value={form.longitude} onChange={set('longitude')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Geofence radius (m)</label>
          <input className="fi" type="number" min={10} max={5000} value={form.radiusMeters} onChange={set('radiusMeters')} />
        </div>
        <div className="ff">
          <label className="fl">Max GPS accuracy (m)</label>
          <input className="fi" type="number" min={5} max={2000} placeholder="Policy default" value={form.maxAccuracyMeters} onChange={set('maxAccuracyMeters')} />
        </div>
      </div>
      <div className="frow" style={{ marginBottom: 8 }}>
        <label className="chk">
          <input type="checkbox" checked={form.allowCheckIn} onChange={set('allowCheckIn')} /> Accept check-in here
        </label>
        <label className="chk">
          <input type="checkbox" checked={form.allowCheckOut} onChange={set('allowCheckOut')} /> Accept check-out here
        </label>
      </div>

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : office ? 'Save changes' : 'Add office'}
        </button>
      </div>
    </>
  );
}

export default function OfficeModal({ open, office, defaultRadius, companyId, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={office ? 'Edit Office Location' : 'Add Office Location'} wide>
      {open ? <OfficeForm key={office?._id || 'new'} office={office} defaultRadius={defaultRadius} companyId={companyId} onClose={onClose} /> : null}
    </Modal>
  );
}
