'use client';
import { useState } from 'react';
import Modal from '../ui/Modal';

// Shown when a check-in/out was blocked by the location policy. The
// employee can retry (fresh GPS reading) or, when the policy allows it,
// submit the punch with a reason for an admin to review.
export default function LocationExceptionModal({ problem, onClose, onRetry, onSubmitException, isBusy }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const actionLabel = problem?.action === 'checkOut' ? 'check out' : 'check in';

  async function handleSubmit() {

    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Please describe the reason (at least 5 characters).');
      return;
    }
    setError('');
    const err = await onSubmitException(trimmed);
    if (err) setError(err);
  }

  return (
    <Modal
      open={Boolean(problem)}
      onClose={onClose}
      title={`Could not ${actionLabel}`}
      subtitle={problem?.message}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose} disabled={isBusy}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} onClick={onRetry} disabled={isBusy}>
            {isBusy ? 'Working…' : 'Retry location'}
          </button>
        </>
      }
    >
      {problem?.canRequestException ? (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--g600)', marginBottom: 8 }}>
            If you are working from an approved place (client visit, field work) or your device cannot provide a location,
            you can {actionLabel} with a reason. It will be flagged for HR/admin review.
          </div>
          <div className="ff">
            <label className="fl">Reason for exception</label>
            <textarea
              className="fi"
              rows={3}
              maxLength={500}
              value={reason}
              placeholder="e.g. Client visit at ABC Ltd, approved by manager"
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button className="btn btn-g btn-full" onClick={handleSubmit} disabled={isBusy}>
              Submit {actionLabel} for review
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--g600)', marginBottom: 6 }}>
          If this keeps happening, contact HR. You can also request an attendance correction later from your history.
        </div>
      )}
      <div className="ferr">{error}</div>
    </Modal>
  );
}
