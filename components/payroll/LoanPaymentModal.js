'use client';

import { useState } from 'react';
import { useRecordLoanPaymentMutation } from '@/lib/services/loanApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { todayISO } from '@/lib/utils/format';
import Modal from '../ui/Modal';

export default function LoanPaymentModal({ loan, onClose }) {
  const [recordPayment, { isLoading }] = useRecordLoanPaymentMutation();
  const toast = useToast();
  const [amount, setAmount] = useState(loan?.emi ?? '');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }
    try {
      await recordPayment({ id: loan.id, amount: Number(amount), date }).unwrap();
      toast('Payment recorded');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not record payment.'));
    }
  }

  return (
    <Modal
      open={Boolean(loan)}
      onClose={onClose}
      title="Record Payment"
      subtitle={loan ? `${loan.user?.name} · Outstanding ₹${loan.outstanding?.toLocaleString('en-IN')}` : undefined}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving…' : 'Record payment'}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Amount (₹)</label>
        <input type="number" min="0" className="fi" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="ff">
        <label className="fl">Date</label>
        <input type="date" className="fi" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
