'use client';

import { useState } from 'react';
import { useReviewCorrectionMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

export default function RejectCorrectionModal({ correctionId, onClose }) {
  const [reviewCorrection, { isLoading }] = useReviewCorrectionMutation();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    try {
      await reviewCorrection({ id: correctionId, status: 'rejected', rejectionReason: reason.trim() }).unwrap();
      toast('Correction request rejected');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not reject request.'));
    }
  }

  return (
    <Modal
      open={Boolean(correctionId)}
      onClose={onClose}
      title="Reject Correction Request"
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
