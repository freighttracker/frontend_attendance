'use client';

import { useState } from 'react';
import { useMarkSalaryPaidMutation } from '@/lib/services/salaryApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

export default function MarkPaidModal({ slipId, onClose }) {
  const [markPaid, { isLoading }] = useMarkSalaryPaidMutation();
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    try {
      await markPaid({ id: slipId, paymentMethod, transactionId: transactionId || undefined }).unwrap();
      toast('Marked as paid');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not mark as paid.'));
    }
  }

  return (
    <Modal
      open={Boolean(slipId)}
      onClose={onClose}
      title="Mark Salary as Paid"
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving…' : 'Mark Paid'}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Payment method</label>
        <select className="fi" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="upi">UPI</option>
        </select>
      </div>
      <div className="ff">
        <label className="fl">Transaction ID (optional)</label>
        <input className="fi" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
