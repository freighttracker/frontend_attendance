'use client';

import { useState } from 'react';
import { useMarkEmployeeLeftMutation } from '@/lib/services/usersApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import { ExitSummaryPanel, EXIT_TYPES } from './ExitSummary';

function MarkLeftForm({ employee, onClose }) {
  const [markLeft, { isLoading }] = useMarkEmployeeLeftMutation();
  const toast = useToast();
  const [leavingDate, setLeavingDate] = useState(todayISO());
  const [exitType, setExitType] = useState('resigned');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!leavingDate) {
      setError('Leaving date is required.');
      return;
    }
    try {
      const result = await markLeft({ id: employee.id, leavingDate, exitType, reason: reason.trim() || undefined }).unwrap();
      const cancelled = result?.data?.cleanup?.cancelledLeaves || 0;
      toast(cancelled ? `Employee marked as left · ${cancelled} leave request${cancelled > 1 ? 's' : ''} cancelled` : 'Employee marked as left');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not mark employee as left.'));
    }
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--g600)', marginBottom: 12, lineHeight: 1.5 }}>
        <b>{employee.name}</b> will no longer be able to log in. All their past attendance, leave and salary records are
        kept, and they still appear in salary and reports up to the month they left - but not in any month after.
        Salary for the final month is paid only up to the leaving date.
      </div>
      <div className="ff">
        <label className="fl">Leaving date (last working day)</label>
        <input className="fi" type="date" max={todayISO()} value={leavingDate} onChange={(e) => setLeavingDate(e.target.value)} />
      </div>
      <div className="ff">
        <label className="fl">Exit type</label>
        <select className="fi" value={exitType} onChange={(e) => setExitType(e.target.value)}>
          {EXIT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="ff">
        <label className="fl">Reason / notes (optional)</label>
        <input className="fi" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Moving to another city" />
      </div>
      {/* What needs settling before this employee goes - dues, pay, open requests. */}
      <div className="card" style={{ padding: '10px 12px', marginBottom: 10 }}>
        <ExitSummaryPanel employeeId={employee.id} leavingDate={leavingDate || undefined} />
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-r" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Mark as left'}
        </button>
      </div>
    </div>
  );
}

export default function MarkLeftModal({ employee, onClose }) {
  return (
    <Modal open={Boolean(employee)} onClose={onClose} title="Mark Employee as Left">
      {employee ? <MarkLeftForm key={employee.id} employee={employee} onClose={onClose} /> : null}
    </Modal>
  );
}
