'use client';

import { useState } from 'react';
import { useCreateLoanMutation } from '@/lib/services/loanApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

function AddLoanForm({ onClose, employees }) {

  const [createLoan, { isLoading }] = useCreateLoanMutation();
  const toast = useToast();
  const [userId, setUserId] = useState(employees[0]?.id || '');
  const [type, setType] = useState('loan');
  const [principal, setPrincipal] = useState('');
  const [tenureMonths, setTenureMonths] = useState('12');
  const [startDate, setStartDate] = useState(todayISO());
  const [error, setError] = useState('');

  const emi = principal && tenureMonths ? Math.round(Number(principal) / Number(tenureMonths)) : 0;

  async function handleSubmit() {
    setError('');
    if (!userId || !principal || Number(principal) <= 0 || !tenureMonths || Number(tenureMonths) <= 0) {
      setError('Employee, amount and tenure are required.');
      return;
    }
    try {
      await createLoan({ userId, type, principal: Number(principal), tenureMonths: Number(tenureMonths), emi, startDate }).unwrap();
      toast(`${type === 'advance' ? 'Advance' : 'Loan'} added`);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add loan.'));
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
          <label className="fl">Type</label>
          <select className="fi" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="loan">Loan</option>
            <option value="advance">Advance</option>
          </select>
        </div>
        <div className="ff">
          <label className="fl">Principal (₹)</label>
          <input type="number" min="0" className="fi" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Tenure (months)</label>
          <input type="number" min="1" className="fi" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Start date</label>
          <input type="date" className="fi" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Estimated EMI</label>
        <div style={{ fontSize: 16, fontWeight: 900 }}>₹{emi.toLocaleString('en-IN')}</div>
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Add'}
        </button>
      </div>
    </>
  );
}

export default function ({ open, onClose, employees }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Loan / Advance">
      {open ? <AddLoanForm onClose={onClose} employees={employees} /> : null}
    </Modal>
  );
}
