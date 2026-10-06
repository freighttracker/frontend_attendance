'use client';

import { useState } from 'react';
import { useReviewCorrectionMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime, pad } from '@/lib/utils/format';
import { DAY_STATUS_OPTIONS } from '@/lib/utils/attendanceStatus';
import Modal from '../ui/Modal';

const DECISION_OPTIONS = [
  { value: 'approved', label: 'Approve' },
  { value: 'rejected', label: 'Reject' },
];

// Native <input type="time"> works in 24h "HH:mm" - convert a stored
// Date/ISO value to that shape so the field can be edited.
function toTimeInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "YYYY-MM-DD" passes through; a full timestamp (e.g. IST midnight stored
// as 18:30Z the previous day) is read in local time so the day is right.
function toDateOnly(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Review one correction request: a Decision dropdown picks Approve (with
// editable times and a "count this day as" override, incl. Weekend/Holiday)
// or Reject (with a required reason). `initialDecision` preselects it.
// `onOverride`, when given, adds a "Correct myself" button that hands off to
// a direct correction instead (which closes this request on save).
export default function ApproveCorrectionModal({ correction, onClose, initialDecision = 'approved', onOverride }) {
  const [reviewCorrection, { isLoading }] = useReviewCorrectionMutation();
  const toast = useToast();

  const [decision, setDecision] = useState(initialDecision);
  const [checkInTime, setCheckInTime] = useState(() => toTimeInputValue(correction?.requestedCheckIn));
  const [checkOutTime, setCheckOutTime] = useState(() => toTimeInputValue(correction?.requestedCheckOut));
  const [overrideStatus, setOverrideStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!correction) return null;

  const userName = typeof correction.user === 'object' ? `${correction.user?.firstName || ''} ${correction.user?.lastName || ''}`.trim() : 'Employee';
  const record = correction.attendanceRecord;
  const dateOnly = toDateOnly(correction.date);
  const isReject = decision === 'rejected';

  async function handleConfirm() {
    setError('');

    let body;
    if (isReject) {
      if (!rejectionReason.trim()) {
        setError('Rejection reason is required.');
        return;
      }
      body = { id: correction._id, status: 'rejected', rejectionReason: rejectionReason.trim() };
    } else {
      body = { id: correction._id, status: 'approved' };
      if (dateOnly && checkInTime && checkInTime !== toTimeInputValue(correction.requestedCheckIn)) {
        body.requestedCheckIn = `${dateOnly}T${checkInTime}:00`;
      }
      if (dateOnly && checkOutTime && checkOutTime !== toTimeInputValue(correction.requestedCheckOut)) {
        body.requestedCheckOut = `${dateOnly}T${checkOutTime}:00`;
      }
      if (overrideStatus) {
        body.overrideStatus = overrideStatus;
      }
    }

    try {
      await reviewCorrection(body).unwrap();
      toast(isReject ? 'Correction request rejected' : 'Correction approved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, isReject ? 'Could not reject request.' : 'Could not approve request.'));
    }
  }

  const busyLabel = isReject ? 'Rejecting…' : 'Approving…';

  return (
    <Modal
      open={Boolean(correction)}
      onClose={onClose}
      title="Review Correction Request"
      subtitle={`${userName || 'Employee'} · ${fmtDate(correction.date)}`}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          {onOverride && !isReject ? (
            <button className="btn btn-g" style={{ flex: 1 }} disabled={isLoading} onClick={onOverride}>
              Correct myself
            </button>
          ) : null}
          <button className={`btn ${isReject ? 'btn-r' : 'btn-p'}`} style={{ flex: 1 }} disabled={isLoading} onClick={handleConfirm}>
            {isLoading ? busyLabel : isReject ? 'Reject' : 'Approve'}
          </button>
        </>
      }
    >
      <div className="frow">
        <div className="ff">
          <label className="fl">Current</label>
          <div className="ctimes">
            {record ? `${fmtTime(record.checkIn?.time)} — ${fmtTime(record.checkOut?.time)}` : 'No attendance record yet'}
          </div>
        </div>
        <div className="ff">
          <label className="fl">Requested</label>
          <div className="ctimes">
            {correction.requestedCheckIn ? fmtTime(correction.requestedCheckIn) : '—'} — {correction.requestedCheckOut ? fmtTime(correction.requestedCheckOut) : '—'}
          </div>
        </div>
      </div>
      <div className="ff">
        <label className="fl">Employee&apos;s reason</label>
        <div className="ctimes">{correction.reason}</div>
      </div>
      <div className="ff">
        <label className="fl">Decision</label>
        <select className="fi" value={decision} onChange={(e) => { setDecision(e.target.value); setError(''); }}>
          {DECISION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {isReject ? (
        <div className="ff">
          <label className="fl">Rejection reason</label>
          <textarea className="fi" rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
        </div>
      ) : (
        <>
          <div className="frow">
            <div className="ff">
              <label className="fl">Check-in (edit if wrong)</label>
              <input className="fi" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </div>
            <div className="ff">
              <label className="fl">Check-out (edit if wrong)</label>
              <input className="fi" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Count this day as</label>
            <select className="fi" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}>
              {DAY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </>
      )}
      <div className="ferr">{error}</div>
    </Modal>
  );
}
