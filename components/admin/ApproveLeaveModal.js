'use client';

import { useState } from 'react';
import { useReviewLeaveMutation } from '@/lib/services/leavesApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils/format';
import Modal from '../ui/Modal';

const PAY_OPTIONS = [
  { value: 'paid', label: 'Fully Paid Leave' },
  { value: 'unpaid', label: 'Fully Unpaid Leave' },
  { value: 'partial', label: 'Partially Paid / Unpaid' },
];

export default function ApproveLeaveModal({ leave, onClose }) {

  const [reviewLeave, { isLoading }] = useReviewLeaveMutation();
  const toast = useToast();

  const [payChoice, setPayChoice] = useState('');

  const totalDays = leave?.totalDays ?? 0;

  function handlePayChoice(value) {
    setPayChoice(value);
    setError('');
    if (value === 'paid') {
      setPaidDays(String(totalDays));
      setUnpaidDays('0');
    } else if (value === 'unpaid') {
      setPaidDays('0');
      setUnpaidDays(String(totalDays));
    } else {
      setPaidDays('');
      setUnpaidDays('');
    }
  }

  const paidNum = Number(paidDays);
  const unpaidNum = Number(unpaidDays);

  const splitIsValid =
    payChoice !== 'partial' ||
    (paidDays !== '' && unpaidDays !== '' && Number.isFinite(paidNum) && Number.isFinite(unpaidNum) && paidNum >= 0 && unpaidNum >= 0 && paidNum + unpaidNum === totalDays);

  async function handleSubmit() {

    if (!payChoice) {
      setError('Select a leave payment type.');
      return;
    }
    if (payChoice === 'partial' && !splitIsValid) {
      setError(`Paid Leave Days + Unpaid Leave Days must equal Total Leave Days (${totalDays}).`);
      return;
    }

    const body = { id: leave.id, status: 'approved', paidStatus: payChoice, remarks: remarks.trim() || undefined };
    
    if (payChoice === 'partial') {
      body.paidDays = paidNum;
      body.unpaidDays = unpaidNum;
    }

    try {
      await reviewLeave(body).unwrap();
      toast('Leave approved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not approve leave.'));
    }
    
  }

  const typeName = leave && typeof leave.leaveType === 'object' ? leave.leaveType?.name : null;
  const userName = leave && typeof leave.user === 'object' ? `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim() : '';

  return (
    <Modal
      open={Boolean(leave)}
      onClose={onClose}
      title="Approve Leave"
      subtitle="Choose how much of this leave is paid before approving."
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading || !payChoice || (payChoice === 'partial' && !splitIsValid)} onClick={handleSubmit}>
            {isLoading ? 'Approving…' : 'Approve Leave'}
          </button>
        </>
      }
    >
      {leave ? (
        <>
          <div className="ff">
            <label className="fl">Employee Name</label>
            <div style={{ fontSize: 13 }}>{userName || 'Unknown'}</div>
          </div>
          <div className="frow">
            <div className="ff">
              <label className="fl">Leave Type</label>
              <div style={{ fontSize: 13 }}>{typeName || '—'}</div>
            </div>
            <div className="ff">
              <label className="fl">Total Leave Days</label>
              <div style={{ fontSize: 13 }}>{totalDays}</div>
            </div>
          </div>
          <div className="frow">
            <div className="ff">
              <label className="fl">From Date</label>
              <div style={{ fontSize: 13 }}>{fmtDate(leave.startDate)}</div>
            </div>
            <div className="ff">
              <label className="fl">To Date</label>
              <div style={{ fontSize: 13 }}>{fmtDate(leave.endDate)}</div>
            </div>
          </div>
          <div className="ff">
            <label className="fl">Employee Reason</label>
            <div style={{ fontSize: 13 }}>{leave.reason || 'No reason provided'}</div>
          </div>

          <div className="ff">
            <label className="fl">Leave Payment Type</label>
            <div className="dsf-options">
              {PAY_OPTIONS.map((opt) => (
                <label key={opt.value} className="dsf-opt">
                  <input type="radio" name="leavePayChoice" checked={payChoice === opt.value} onChange={() => handlePayChoice(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {payChoice === 'partial' ? (
            <>
              <div className="frow">
                <div className="ff">
                  <label className="fl">Paid Leave Days</label>
                  <input
                    className="fi"
                    type="number"
                    min="0"
                    step="1"
                    value={paidDays}
                    onChange={(e) => setPaidDays(e.target.value)}
                  />
                </div>
                <div className="ff">
                  <label className="fl">Unpaid Leave Days</label>
                  <input
                    className="fi"
                    type="number"
                    min="0"
                    step="1"
                    value={unpaidDays}
                    onChange={(e) => setUnpaidDays(e.target.value)}
                  />
                </div>
              </div>
              <div className="ff" style={{ fontSize: 12, color: splitIsValid ? 'var(--g400)' : 'var(--red)' }}>
                {totalDays} Total Days = {paidDays || 0} Paid + {unpaidDays || 0} Unpaid
              </div>
            </>
          ) : null}

          <div className="ff">
            <label className="fl">Admin Remarks</label>
            <textarea className="fi" rows={2} placeholder="Enter remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <div className="ferr">{error}</div>
        </>
      ) : null}
    </Modal>
  );
}
