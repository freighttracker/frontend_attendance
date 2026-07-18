'use client';

import { useState } from 'react';
import { useRequestCorrectionMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

function RequestCorrectionForm({ defaultDate, onClose }) {
  const [requestCorrection, { isLoading }] = useRequestCorrectionMutation();
  const toast = useToast();

  const [date, setDate] = useState(defaultDate || todayISO());
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!date) {
      setError('Select a date.');
      return;
    }
    if (date > todayISO()) {
      setError('Cannot request a correction for a future date.');
      return;
    }
    if (!checkInTime && !checkOutTime) {
      setError('Provide a check-in and/or check-out time.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    const body = { date, reason: reason.trim() };
    if (checkInTime) body.requestedCheckIn = `${date}T${checkInTime}:00`;
    if (checkOutTime) body.requestedCheckOut = `${date}T${checkOutTime}:00`;

    try {
      await requestCorrection(body).unwrap();
      toast('Correction request submitted');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not submit correction request.'));
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Date</label>
        <input className="fi" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Check-in time</label>
          <input className="fi" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Check-out time</label>
          <input className="fi" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <textarea
          className="fi"
          rows={2}
          placeholder="e.g. Forgot to check in / check out"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </>
  );
}

export default function RequestCorrectionModal({ open, onClose, defaultDate }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Attendance Correction"
      subtitle="Missed a check-in or check-out? Submit a request — an admin will review it."
    >
      {open ? <RequestCorrectionForm key={defaultDate || 'today'} defaultDate={defaultDate} onClose={onClose} /> : null}
    </Modal>
  );
}
