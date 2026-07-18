'use client';

import { useReviewCorrectionMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import Modal from '../ui/Modal';

export default function ApproveCorrectionModal({ correction, onClose }) {
  const [reviewCorrection, { isLoading }] = useReviewCorrectionMutation();
  const toast = useToast();

  if (!correction) return null;

  const userName = typeof correction.user === 'object' ? `${correction.user?.firstName || ''} ${correction.user?.lastName || ''}`.trim() : 'Employee';
  const record = correction.attendanceRecord;

  async function handleConfirm() {
    try {
      await reviewCorrection({ id: correction._id, status: 'approved' }).unwrap();
      toast('Correction approved');
      onClose();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve request.'), 'err');
    }
  }

  return (
    <Modal
      open={Boolean(correction)}
      onClose={onClose}
      title="Approve Correction Request"
      subtitle={`${userName || 'Employee'} · ${fmtDate(correction.date)}`}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleConfirm}>
            {isLoading ? 'Approving…' : 'Approve'}
          </button>
        </>
      }
    >
      <div className="ff">
        <label className="fl">Current</label>
        <div className="ctimes" style={{ marginBottom: 8 }}>
          {record ? `${fmtTime(record.checkIn?.time)} — ${fmtTime(record.checkOut?.time)}` : 'No attendance record yet'}
        </div>
      </div>
      <div className="ff">
        <label className="fl">Requested</label>
        <div className="ctimes" style={{ marginBottom: 8 }}>
          {fmtTime(correction.requestedCheckIn)} — {fmtTime(correction.requestedCheckOut)}
        </div>
      </div>
      <div className="ff">
        <label className="fl">Reason</label>
        <div className="ctimes">{correction.reason}</div>
      </div>
    </Modal>
  );
}
