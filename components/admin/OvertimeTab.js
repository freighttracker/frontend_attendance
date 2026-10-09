'use client';

import { useState } from 'react';
import { useGetOvertimeRequestsQuery, useReviewOvertimeMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

// Overtime is never paid automatically - only hours an admin approves here
// count towards salary (payroll and the salary estimate both read
// approvedOvertimeHours only).
export default function OvertimeTab() {
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useGetOvertimeRequestsQuery({ status, page: 1, limit: 100 });
  const [reviewing, setReviewing] = useState(null);

  const { items } = unwrapList(data);

  return (
    <div>
      <div className="frow" style={{ marginBottom: 11, alignItems: 'center' }}>
        <div className="ff" style={{ margin: 0 }}>
          <select className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          items.map((r) => {
            const userName = typeof r.user === 'object' ? `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() : 'Employee';
            const rowStatus = r.overtimeStatus === 'approved' || r.overtimeStatus === 'rejected' ? r.overtimeStatus : 'pending';
            return (
              <div className="crow" key={r._id}>
                <div className="cinfo">
                  <div className="cday">
                    {userName || 'Employee'} · {fmtDate(r.date)}
                  </div>
                  <div className="ctimes">
                    {fmtTime(r.checkIn?.time)} — {fmtTime(r.checkOut?.time)} · Worked {r.workingHours}h
                  </div>
                  <div className="ctimes">
                    Overtime {r.overtimeHours}h{rowStatus === 'approved' ? ` · Approved ${r.approvedOvertimeHours}h` : ''}
                    {r.overtimeRemarks ? ` · ${r.overtimeRemarks}` : ''}
                  </div>
                </div>
                <span className={`lpill lp-${rowStatus}`}>{rowStatus}</span>
                {rowStatus === 'pending' ? (
                  <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                    <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => setReviewing({ record: r, status: 'approved' })}>
                      ✓
                    </button>
                    <button className="btn btn-r btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => setReviewing({ record: r, status: 'rejected' })}>
                      ✗
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState>No overtime to review</EmptyState>
        )}
      </div>
      <ReviewOvertimeModal key={reviewing ? `${reviewing.record._id}-${reviewing.status}` : 'none'} reviewing={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}

function ReviewOvertimeModal({ reviewing, onClose }) {
  const [reviewOvertime, { isLoading }] = useReviewOvertimeMutation();
  const toast = useToast();
  const [hours, setHours] = useState(reviewing?.record.overtimeHours ?? '');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const isApprove = reviewing?.status === 'approved';

  async function handleSubmit() {
    const body = { id: reviewing.record._id, status: reviewing.status, remarks: remarks.trim() || undefined };
    if (isApprove) {
      const n = Number(hours);
      if (!Number.isFinite(n) || n <= 0 || n > reviewing.record.overtimeHours) {
        setError(`Approved hours must be between 0 and ${reviewing.record.overtimeHours}.`);
        return;
      }
      body.approvedHours = n;
    }
    try {
      await reviewOvertime(body).unwrap();
      toast(isApprove ? 'Overtime approved' : 'Overtime rejected');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update overtime.'));
    }
  }

  return (
    <Modal
      open={Boolean(reviewing)}
      onClose={onClose}
      title={isApprove ? 'Approve Overtime' : 'Reject Overtime'}
      actions={
        <>
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button className={`btn ${isApprove ? 'btn-p' : 'btn-r'}`} style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'Saving…' : isApprove ? 'Approve' : 'Reject'}
          </button>
        </>
      }
    >
      {isApprove ? (
        <div className="ff">
          <label className="fl">Approved hours (logged {reviewing?.record.overtimeHours}h)</label>
          <input className="fi" type="number" min="0" step="0.25" max={reviewing?.record.overtimeHours} value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
      ) : null}
      <div className="ff">
        <label className="fl">Remarks (optional)</label>
        <textarea className="fi" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
