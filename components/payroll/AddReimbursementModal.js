'use client';

import { useState } from 'react';
import { useCreateReimbursementMutation } from '@/lib/services/reimbursementApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

export const REIMBURSEMENT_CATEGORIES = ['Travel', 'Fuel', 'Medical', 'Internet', 'Food', 'Other'];

function AddReimbursementForm({ onClose, employees }) {
  const [createReimbursement, { isLoading }] = useCreateReimbursementMutation();
  const toast = useToast();
  const [userId, setUserId] = useState(employees[0]?.id || '');
  const [category, setCategory] = useState(REIMBURSEMENT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
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
      await createReimbursement({ userId, category: category.toLowerCase(), description, amount: Number(amount), date }).unwrap();
      toast('Reimbursement submitted');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not submit reimbursement.'));
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
          <label className="fl">Category</label>
          <select className="fi" value={category} onChange={(e) => setCategory(e.target.value)}>
            {REIMBURSEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Amount (₹)</label>
          <input type="number" min="0" className="fi" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Description</label>
        <textarea className="fi" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this claim for?" />
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
          {isLoading ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </>
  );
}

export default function AddReimbursementModal({ open, onClose, employees }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Reimbursement">
      {open ? <AddReimbursementForm onClose={onClose} employees={employees} /> : null}
    </Modal>
  );
}
  