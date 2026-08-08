'use client';

import { useState } from 'react';
import { useRejectReimbursementMutation } from '@/lib/services/reimbursementApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

export default function RejectReimbursementModal({ reimbursementId, onClose }) {
  
  const [rejectReimbursement, { isLoading }] = useRejectReimbursementMutation();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    try {
      await rejectReimbursement({ id: reimbursementId, rejectionReason: reason.trim() }).unwrap();
      toast('Reimbursement rejected');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not reject reimbursement.'));
    }
  }

  return (
    <Modal
      open={Boolean(reimbursementId)}
      onClose={onClose}
      title="Reject Reimbursement"
      subtitle="Tell the employee why this claim is being rejected."
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-r" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Rejecting…' : 'Reject'}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Reason</label>
        <textarea className="fi" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
