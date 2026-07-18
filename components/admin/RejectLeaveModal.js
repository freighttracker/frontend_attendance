'use client';

import { useState } from 'react';
import { useReviewLeaveMutation } from '@/lib/services/leavesApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

export default function RejectLeaveModal({ leaveId, onClose }) {
  
  const [reviewLeave, { isLoading }] = useReviewLeaveMutation();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {

    if (!reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    try {
      await reviewLeave({ id: leaveId, status: 'rejected', rejectionReason: reason.trim() }).unwrap();
      toast('Leave rejected');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not reject leave.'));
    }

  }

  return (
    <Modal
      open={Boolean(leaveId)}
      onClose={onClose}
      title="Reject Leave Request"
      subtitle="Tell the employee why this request is being rejected."
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
