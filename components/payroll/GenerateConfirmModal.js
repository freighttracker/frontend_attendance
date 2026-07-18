'use client';

import { useState } from 'react';
import { MONTH_NAMES } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import { CheckIcon } from '../icons';

const PHASE_IDLE = 'idle';
const PHASE_RUNNING = 'running';
const PHASE_DONE = 'done';

export default function GenerateConfirmModal({ open, onClose, count, month, year, scopeLabel, isLoading, onConfirm }) {
  const [phase, setPhase] = useState(PHASE_IDLE);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevLoading, setPrevLoading] = useState(isLoading);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setPhase(PHASE_IDLE);
  }

  if (isLoading !== prevLoading) {
    setPrevLoading(isLoading);
    if (isLoading) setPhase(PHASE_RUNNING);
    else if (phase === PHASE_RUNNING) setPhase(PHASE_DONE);
  }

  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Modal
      open={open}
      onClose={phase === PHASE_RUNNING ? undefined : onClose}
      title={phase === PHASE_DONE ? 'Payroll Generated' : 'Generate Payroll?'}
      subtitle={phase === PHASE_IDLE ? `${scopeLabel} for ${MONTH_NAMES[(month || 1) - 1]} ${year}` : undefined}
      actions={
        phase === PHASE_IDLE ? (
          <>
            <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-p" style={{ flex: 1 }} onClick={handleConfirm}>
              Generate
            </button>
          </>
        ) : phase === PHASE_DONE ? (
          <button className="btn btn-p btn-full" onClick={onClose}>
            Done
          </button>
        ) : null
      }
    >
      {phase === PHASE_IDLE ? (
        <div style={{ fontSize: 12, color: 'var(--g600)' }}>
          This will generate salary slips for <b>{count}</b> employee{count === 1 ? '' : 's'}. Existing slips for this period will be regenerated.
        </div>
      ) : (
        <div className="gen-progress-wrap">
          {phase === PHASE_RUNNING ? (
            <>
              <div className="spinner-wrap"><div className="spinner" /></div>
              <div style={{ fontSize: 12, color: 'var(--g400)', marginTop: 8 }}>Generating {count} slip{count === 1 ? '' : 's'}…</div>
            </>
          ) : (
            <>
              <div className="gen-success">
                <CheckIcon />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{count} slip{count === 1 ? '' : 's'} generated successfully</div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
