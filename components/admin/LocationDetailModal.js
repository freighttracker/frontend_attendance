'use client';

import { useState } from 'react';
import { useGetAttendanceLocationQuery, useReviewAttendanceLocationMutation } from '@/lib/services/geoApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import { fmtAccuracy, fmtCoords, fmtDistance, locationTone, osmLink } from '@/lib/utils/geolocation';
import { reverseGeocode, isGeocoderEnabled } from '@/lib/utils/geocode';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { AttendanceStatusPill } from '../ui/StatusPill';
import LocationBadge from '../geo/LocationBadge';
import LocationMap, { MAP_COLORS } from '../geo/LocationMap';

function ReviewBox({ recordId, punch, onDone }) {
  const [review, { isLoading }] = useReviewAttendanceLocationMutation();
  const toast = useToast();
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  async function decide(decision) {
    if (decision === 'rejected' && !remarks.trim()) {
      setError('Add remarks explaining the rejection.');
      return;
    }
    try {
      const res = await review({ id: recordId, punch, decision, remarks: remarks.trim() || undefined }).unwrap();
      toast(res?.message || 'Saved');
      onDone?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save review.'));
    }
  }

  return (
    <div style={{ marginTop: 8, padding: 10, background: 'var(--amb-l)', borderRadius: 'var(--r)' }}>
      <div className="ff" style={{ marginBottom: 8 }}>
        <label className="fl">Review remarks</label>
        <textarea className="fi" rows={2} maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="frow">
        <button className="btn btn-p btn-sm" style={{ flex: 1 }} disabled={isLoading} onClick={() => decide('approved')}>
          Approve exception
        </button>
        <button className="btn btn-r btn-sm" style={{ flex: 1 }} disabled={isLoading} onClick={() => decide('rejected')}>
          Reject
        </button>
      </div>
      <div className="ferr">{error}</div>
    </div>
  );
}

function PunchDetail({ label, recordId, punch, punchKey, canReview }) {
  const [address, setAddress] = useState('');
  const [looking, setLooking] = useState(false);

  if (!punch) {
    return (
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="card-label">{label}</div>
        <div className="geo-sub">Not recorded</div>
      </div>
    );
  }

  const hasCoords = typeof punch.latitude === 'number' && typeof punch.longitude === 'number';
  const office = punch.office && typeof punch.office === 'object' ? punch.office : null;

  async function lookup() {
    setLooking(true);
    try {
      setAddress((await reverseGeocode(punch.latitude, punch.longitude)) || 'No address found');
    } catch (err) {
      setAddress(err.message);
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label} · {fmtTime(punch.time)}</span>
        <LocationBadge validationStatus={punch.validationStatus} reviewStatus={punch.reviewStatus} />
      </div>
      <div className="prow"><span className="pl">Coordinates</span><span className="pv">
        {hasCoords ? <a href={osmLink(punch.latitude, punch.longitude)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>{fmtCoords(punch.latitude, punch.longitude)}</a> : punch.locationPurgedAt ? 'Removed after retention period' : 'None'}
      </span></div>
      <div className="prow"><span className="pl">GPS accuracy</span><span className="pv">{fmtAccuracy(punch.accuracy)}</span></div>
      <div className="prow"><span className="pl">Office</span><span className="pv">{office?.name || punch.officeName || '—'}</span></div>
      <div className="prow"><span className="pl">Distance</span><span className="pv">
        {fmtDistance(punch.distanceMeters)}{office?.radiusMeters ? ` (radius ${office.radiusMeters} m)` : ''}
      </span></div>
      <div className="prow"><span className="pl">Policy at the time</span><span className="pv">{punch.policyMode || '—'}</span></div>
      {punch.exceptionReason ? <div className="prow"><span className="pl">Employee reason</span><span className="pv" style={{ whiteSpace: 'normal' }}>{punch.exceptionReason}</span></div> : null}
      {punch.reviewedAt ? (
        <div className="prow"><span className="pl">Reviewed</span><span className="pv" style={{ whiteSpace: 'normal' }}>
          {punch.reviewedBy?.firstName ? `${punch.reviewedBy.firstName} ${punch.reviewedBy.lastName || ''} · ` : ''}{fmtDate(punch.reviewedAt)}{punch.reviewRemarks ? ` · ${punch.reviewRemarks}` : ''}
        </span></div>
      ) : null}
      {hasCoords && isGeocoderEnabled() ? (
        <div style={{ marginTop: 6 }}>
          {address ? <div className="geo-sub" style={{ color: 'var(--g600)' }}>{address}</div> : null}
          {!address ? <button className="btn btn-g btn-sm" disabled={looking} onClick={lookup}>{looking ? 'Looking up…' : 'Show readable address'}</button> : null}
        </div>
      ) : null}
      {canReview && punch.reviewStatus === 'pending' ? <ReviewBox recordId={recordId} punch={punchKey} /> : null}
    </div>
  );
}

function Detail({ id, canReview }) {
  const { data, isLoading, isError, error } = useGetAttendanceLocationQuery(id);
  if (isLoading) return <Spinner />;
  if (isError || !data) return <EmptyState>{extractErrorMessage(error, 'Could not load location.')}</EmptyState>;

  const offices = new Map();
  [data.checkIn, data.checkOut].forEach((p) => {
    if (p?.office && typeof p.office === 'object') offices.set(p.office._id, p.office);
  });
  const markers = [
    ['checkIn', 'Check-in', MAP_COLORS.checkIn],
    ['checkOut', 'Check-out', MAP_COLORS.checkOut],
  ]
    .filter(([key]) => typeof data[key]?.latitude === 'number')
    .map(([key, label, color]) => {
      const p = data[key];
      const tone = locationTone(p.validationStatus, p.reviewStatus);
      return { id: key, latitude: p.latitude, longitude: p.longitude, color: tone === 'ok' ? color : MAP_COLORS[tone] || color, label: [`${label} ${fmtTime(p.time)}`, `${fmtAccuracy(p.accuracy)} · ${fmtDistance(p.distanceMeters)}`] };
    });

  return (
    <>
      <div className="frow" style={{ alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flex: 1, fontSize: 12 }}>
          <b>{data.user ? `${data.user.firstName} ${data.user.lastName}` : 'Employee'}</b>
          {data.user?.employeeCode ? ` · ${data.user.employeeCode}` : ''}
          {data.user?.department ? ` · ${data.user.department}` : ''}
          <div className="geo-sub">{fmtDate(data.date)} · Assigned: {data.primaryOffice?.name || '—'}</div>
        </div>
        <AttendanceStatusPill status={data.status} />
      </div>
      {markers.length || offices.size ? (
        <div style={{ marginBottom: 10 }}>
          <LocationMap
            height={240}
            markers={markers}
            circles={[...offices.values()].map((o) => ({ id: o._id, latitude: o.latitude, longitude: o.longitude, radiusMeters: o.radiusMeters, color: MAP_COLORS.office, label: [o.name, `Radius ${o.radiusMeters} m`] }))}
          />
        </div>
      ) : null}
      <PunchDetail label="Check-in" recordId={data._id} punch={data.checkIn} punchKey="checkIn" canReview={canReview} />
      <PunchDetail label="Check-out" recordId={data._id} punch={data.checkOut} punchKey="checkOut" canReview={canReview} />
      {data.isCorrected ? <div className="geo-sub">This day was corrected by an admin; the original values are in the audit log.</div> : null}
    </>
  );
}

export default function LocationDetailModal({ recordId, canReview, onClose }) {
  return (
    <Modal open={Boolean(recordId)} onClose={onClose} title="Attendance Location" wide>
      {recordId ? <Detail key={recordId} id={recordId} canReview={canReview} /> : null}
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}
