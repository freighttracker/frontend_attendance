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

export default function DirectCorrectionModal({ open, onClose }) {
  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 500, role: 'employee' }, { skip: !open });
  const { items } = unwrapList(usersData);
  const employees = useMemo(() => items.map(normalizeUser), [items]);

  const [correctAttendance, { isLoading }] = useCorrectAttendanceMutation();
  const toast = useToast();

  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(() => todayISO());
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setUserId('');
    setDate(todayISO());
    setCheckInTime('');
    setCheckOutTime('');
    setStatus('');
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
    if (checkInTime && checkOutTime && checkOutTime < checkInTime) {
      setError(`Check-out (${checkOutTime}) is earlier than check-in (${checkInTime}) - did you mean to pick the other AM/PM?`);
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
      subtitle="Use this when there is no correction request on file"
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
          <select className="fi" value={userId} onChange={(e) => setUserId(e.target.value)}>
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
          <input className="fi" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
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
