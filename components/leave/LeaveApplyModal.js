'use client';

import { useState } from 'react';
import { useGetLeaveTypesQuery, useApplyLeaveMutation } from '@/lib/services/leavesApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { unwrapList } from '@/lib/utils/queryParams';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

function LeaveApplyForm({ onClose }) {

  const { data: typesData } = useGetLeaveTypesQuery();
  const { items: leaveTypes } = unwrapList(typesData);
  const [applyLeave, { isLoading }] = useApplyLeaveMutation();
  const toast = useToast();

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const effectiveLeaveTypeId = leaveTypeId || leaveTypes[0]?._id || '';

  const daysSelected =
    startDate && endDate && endDate >= startDate
      ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1
      : 0;

  async function handleSubmit() {
    
    setError('');

    if (!effectiveLeaveTypeId) {
      setError('Select a leave type.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Select from and to dates.');
      return;
    }
    if (endDate < startDate) {
      setError('To date must be after from date.');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }

    try {
      await applyLeave({ leaveTypeId: effectiveLeaveTypeId, startDate, endDate, reason: reason.trim() }).unwrap();
      toast('Leave request submitted');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not submit leave request.'));
    }

  }

  return (
    <>
      <div className="ff">
        <label className="fl">Leave type</label>
        <select className="fi" value={effectiveLeaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
          <option value="">Select leave type</option>
            {leaveTypes.map((type) => (
              <option key={type._id} value={type._id}>
                 {type.name}
              </option>
            ))}
        </select>
      
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">From date</label>
          <input className="fi" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">To date</label>
          <input className="fi" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <textarea
          className="fi"
          rows={2}
          placeholder="Briefly describe why…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      {daysSelected > 0 ? (
        <div style={{ fontSize: 11, color: 'var(--ind-d)', fontWeight: 700, marginBottom: 4 }}>
          {daysSelected} day{daysSelected > 1 ? 's' : ''} selected
        </div>
      ) : null}
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

export default function LeaveApplyModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave" subtitle="Submit a request — admin will approve or reject it.">
      {open ? <LeaveApplyForm onClose={onClose} /> : null}
    </Modal>
  );
}
