'use client';

import { useState } from 'react';
import { useReviewCorrectionMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime, pad } from '@/lib/utils/format';
import Modal from '../ui/Modal';

const OVERRIDE_STATUS_OPTIONS = [
  { value: '', label: 'Auto-calculate from time' },
  { value: 'present', label: 'Full Day (Present)' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'on_leave', label: 'On Leave' },
];

// Native <input type="time"> works in 24h "HH:mm" - convert a stored
// Date/ISO value to that shape so the field can be edited.
function toTimeInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ApproveCorrectionModal({ correction, onClose }) {
  const [reviewCorrection, { isLoading }] = useReviewCorrectionMutation();
  const toast = useToast();

  const [checkInTime, setCheckInTime] = useState(() => toTimeInputValue(correction?.requestedCheckIn));
  const [checkOutTime, setCheckOutTime] = useState(() => toTimeInputValue(correction?.requestedCheckOut));
  const [overrideStatus, setOverrideStatus] = useState('');
  const [error, setError] = useState('');

  if (!correction) return null;

  const userName = typeof correction.user === 'object' ? `${correction.user?.firstName || ''} ${correction.user?.lastName || ''}`.trim() : 'Employee';
  const record = correction.attendanceRecord;
  const dateOnly = correction.date ? String(correction.date).slice(0, 10) : null;

  async function handleConfirm() {
    setError('');
    if (checkInTime && checkOutTime && checkOutTime < checkInTime) {
      setError(`Check-out (${checkOutTime}) is earlier than check-in (${checkInTime}) - did you mean to pick the other AM/PM?`);
      return;
    }


    const body = { id: correction._id, status: 'approved' };
    if (dateOnly && checkInTime && checkInTime !== toTimeInputValue(correction.requestedCheckIn)) {
      body.requestedCheckIn = `${dateOnly}T${checkInTime}:00`;
    }
    if (dateOnly && checkOutTime && checkOutTime !== toTimeInputValue(correction.requestedCheckOut)) {
      body.requestedCheckOut = `${dateOnly}T${checkOutTime}:00`;
    }
    if (overrideStatus) {
      body.overrideStatus = overrideStatus;
    }

    try {
      await reviewCorrection(body).unwrap();
      toast('Correction approved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not approve request.'));
    }
  }

  return (
    <Modal
      open={Boolean(correction)}
      onClose={onClose}
      title="Approve Correction Request"
      subtitle={`${userName || 'Employee'} · ${fmtDate(correction.date)}`}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleConfirm}>
            {isLoading ? 'Approving…' : 'Approve'}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Current</label>
        <div className="ctimes" style={{ marginBottom: 8 }}>
          {record ? `${fmtTime(record.checkIn?.time)} — ${fmtTime(record.checkOut?.time)}` : 'No attendance record yet'}
        </div>
      </div>
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
          {OVERRIDE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <div className="ctimes">{correction.reason}</div>
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
