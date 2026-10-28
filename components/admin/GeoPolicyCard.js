'use client';

import { useState } from 'react';
import { useGetGeoPolicyQuery, useUpdateGeoPolicyMutation } from '@/lib/services/geoApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Spinner from '../ui/Spinner';

const MODE_OPTIONS = [
  { value: 'off', label: 'Off - location not used' },
  { value: 'flag', label: 'Record & flag - allow, but flag outside/low accuracy for review' },
  { value: 'enforce', label: 'Enforce - must be inside an assigned office' },
];

const SOURCE_TEXT = {
  company: 'Company policy',
  platform: 'Using the platform default (saving creates a company policy)',
  default: 'Not configured yet - geofencing is off',
};

function PolicyForm({ policy, companyId, canEdit, isPlatform }) {
  const [updatePolicy, { isLoading }] = useUpdateGeoPolicyMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    checkInMode: policy.checkInMode,
    checkOutMode: policy.checkOutMode,
    defaultRadiusMeters: String(policy.defaultRadiusMeters),
    maxAccuracyMeters: String(policy.maxAccuracyMeters),
    allowExceptions: Boolean(policy.allowExceptions),
    locationRetentionDays: String(policy.locationRetentionDays),
  });
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSave() {
    const radius = Number(form.defaultRadiusMeters);
    const accuracy = Number(form.maxAccuracyMeters);
    const retention = Number(form.locationRetentionDays);
    if (!Number.isInteger(radius) || radius < 10 || radius > 5000) return setError('Default radius must be 10-5000 m.');
    if (!Number.isInteger(accuracy) || accuracy < 5 || accuracy > 2000) return setError('Maximum GPS accuracy must be 5-2000 m.');
    if (!Number.isInteger(retention) || retention < 30 || retention > 3650) return setError('Retention must be 30-3650 days.');
    setError('');
    try {
      await updatePolicy({
        companyId: companyId || undefined,
        checkInMode: form.checkInMode,
        checkOutMode: form.checkOutMode,
        defaultRadiusMeters: radius,
        maxAccuracyMeters: accuracy,
        allowExceptions: form.allowExceptions,
        locationRetentionDays: retention,
      }).unwrap();
      toast('Location policy saved');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save policy.'));
    }
  }

  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--g400)', marginBottom: 10 }}>
        {isPlatform ? 'Platform default - applies to every company without its own policy.' : SOURCE_TEXT[policy.source] || ''}
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Check-in</label>
          <select className="fi" value={form.checkInMode} onChange={set('checkInMode')} disabled={!canEdit}>
            {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Check-out</label>
          <select className="fi" value={form.checkOutMode} onChange={set('checkOutMode')} disabled={!canEdit}>
            {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Default radius (m)</label>
          <input className="fi" type="number" min={10} max={5000} value={form.defaultRadiusMeters} onChange={set('defaultRadiusMeters')} disabled={!canEdit} />
        </div>
        <div className="ff">
          <label className="fl">Max GPS accuracy (m)</label>
          <input className="fi" type="number" min={5} max={2000} value={form.maxAccuracyMeters} onChange={set('maxAccuracyMeters')} disabled={!canEdit} />
        </div>
        <div className="ff">
          <label className="fl">Keep coordinates (days)</label>
          <input className="fi" type="number" min={30} max={3650} value={form.locationRetentionDays} onChange={set('locationRetentionDays')} disabled={!canEdit} />
        </div>
      </div>
      <label className="chk" style={{ marginBottom: 10 }}>
        <input type="checkbox" checked={form.allowExceptions} onChange={set('allowExceptions')} disabled={!canEdit} />
        Let employees submit a blocked check-in/out with a reason for review
      </label>
      <div style={{ fontSize: 10, color: 'var(--g400)', marginBottom: 10 }}>
        GPS can be spoofed or imprecise - it supports, but does not prove, an employee&apos;s presence. Location is captured only at
        check-in/check-out, never tracked continuously.
      </div>
      <div className="ferr">{error}</div>
      {canEdit ? (
        <button className="btn btn-p btn-sm" disabled={isLoading} onClick={handleSave}>
          {isLoading ? 'Saving…' : 'Save policy'}
        </button>
      ) : null}
    </>
  );
}

export default function GeoPolicyCard({ companyId, canEdit, isPlatform }) {
  const { data, isLoading, isError } = useGetGeoPolicyQuery({ companyId: companyId || undefined });
  return (
    <div className="card">
      <div className="card-label">Location attendance policy</div>
      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <div className="empty">Could not load the policy.</div>
      ) : (
        <PolicyForm key={`${companyId || 'own'}-${data.updatedAt || data.source}`} policy={data} companyId={companyId} canEdit={canEdit} isPlatform={isPlatform} />
      )}
    </div>
  );
}
