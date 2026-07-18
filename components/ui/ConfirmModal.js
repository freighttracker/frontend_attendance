'use client';

import Modal from './Modal';

export default function ConfirmModal({ open, onClose, onConfirm, title, subtitle, confirmLabel = 'Delete', isLoading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-r" style={{ flex: 1 }} disabled={isLoading} onClick={onConfirm}>
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    />
  );
}
