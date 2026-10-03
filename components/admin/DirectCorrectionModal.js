'use client';

import { useMemo, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useCorrectAttendanceMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

const STATUS_OPTIONS = [
  { value: '', label: 'Auto-calculate from time' },
  { value: 'present', label: 'Full Day (Present)' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'on_leave', label: 'On Leave' },
];

// `initial` prefills the form (e.g. from a clicked calendar day) and
// `lockTarget` pins employee + date so the admin only edits times/status.
// Callers remount via `key` when `initial` changes.
export default function DirectCorrectionModal({ open, onClose, initial, lockTarget = false, currentSummary }) {
  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 500, role: 'employee' }, { skip: !open });
  const { items } = unwrapList(usersData);
  const employees = useMemo(() => items.map(normalizeUser), [items]);

  const [correctAttendance, { isLoading }] = useCorrectAttendanceMutation();
  const toast = useToast();

  const [userId, setUserId] = useState(initial?.userId || '');
  const [date, setDate] = useState(() => initial?.date || todayISO());
  const [checkInTime, setCheckInTime] = useState(initial?.checkInTime || '');
  const [checkOutTime, setCheckOutTime] = useState(initial?.checkOutTime || '');
  const [status, setStatus] = useState(initial?.status || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setUserId(initial?.userId || '');
    setDate(initial?.date || todayISO());
    setCheckInTime(initial?.checkInTime || '');
    setCheckOutTime(initial?.checkOutTime || '');
    setStatus(initial?.status || '');
    setReason('');
    setError('');
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  async function handleSubmit() {
    setError('');
    if (!userId || !date) {
      setError('Employee and date are required.');
      return;
    }
    if (!reason.trim()) {
      setError('A reason is required.');
      return;
    }
    if (!checkInTime && !checkOutTime && !status) {
      setError('Provide a check-in/check-out time and/or a status to force.');
      return;
    }
    const body = { userId, date, reason: reason.trim() };
    if (checkInTime) body.checkInTime = `${date}T${checkInTime}:00`;
    if (checkOutTime) body.checkOutTime = `${date}T${checkOutTime}:00`;
    if (status) body.status = status;

    try {
      await correctAttendance(body).unwrap();
      toast('Attendance corrected');
      handleClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not correct attendance.'));
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Directly Correct Attendance"
      subtitle={currentSummary || 'Use this when there is no correction request on file'}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={handleClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving…' : 'Apply Correction'}
          </button>
        </>
      }
    >
      <div className="frow">
        <div className="ff">
          <label className="fl">Employee</label>
          <select className="fi" value={userId} disabled={lockTarget} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.employeeCode || e.email})
              </option>
            ))}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Date</label>
          <input className="fi" type="date" value={date} max={todayISO()} disabled={lockTarget} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Exact check-in time</label>
          <input className="fi" type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Exact check-out time</label>
          <input className="fi" type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Count this day as</label>
        <select className="fi" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <textarea
          className="fi"
          rows={2}
          placeholder="e.g. Biometric device was down, confirmed via manager"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
