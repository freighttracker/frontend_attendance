'use client';

import { useState } from 'react';
import { useCreateBonusMutation } from '@/lib/services/bonusApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

const BONUS_TYPES = ['Performance', 'Festival', 'Referral', 'Retention', 'Project', 'Other'];

function AddBonusForm({ onClose, employees }) {
  const [createBonus, { isLoading }] = useCreateBonusMutation();
  const toast = useToast();
  const [userId, setUserId] = useState(employees[0]?.id || '');
  const [bonusType, setBonusType] = useState(BONUS_TYPES[0]);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!userId || !amount || Number(amount) <= 0) {
      setError('Employee and a valid amount are required.');
      return;
    }
    try {
      await createBonus({ userId, bonusType: bonusType.toLowerCase(), reason, amount: Number(amount), date }).unwrap();
      toast('Bonus added');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add bonus.'));
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Employee</label>
        <select className="fi" value={userId} onChange={(e) => setUserId(e.target.value)}>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Bonus type</label>
          <select className="fi" value={bonusType} onChange={(e) => setBonusType(e.target.value)}>
            {BONUS_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Amount (₹)</label>
          <input type="number" min="0" className="fi" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <textarea className="fi" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for this bonus" />
      </div>
      <div className="ff">
        <label className="fl">Date</label>
        <input type="date" className="fi" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Add bonus'}
        </button>
      </div>
    </>
  );
}

export default function AddBonusModal({ open, onClose, employees }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Bonus">
      {open ? <AddBonusForm onClose={onClose} employees={employees} /> : null}
    </Modal>
  );
}
