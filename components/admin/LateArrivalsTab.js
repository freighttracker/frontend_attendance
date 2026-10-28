'use client';

import { useState } from 'react';
import { useGetLateRequestsQuery, useReviewLateMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime, pad } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

// Late arrivals an admin approves here are excused - payroll's late-deduction
// policy skips them. The month's slip is refreshed automatically while it is
// still in 'generated' status; otherwise the toast says to regenerate it.
export default function LateArrivalsTab() {

  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [period, setPeriod] = useState(`${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}`);
  const [status, setStatus] = useState('pending');
  const [year, month] = period.split('-').map(Number);
  const { data, isLoading } = useGetLateRequestsQuery({ status, month, year, page: 1, limit: 200 });
  const [reviewing, setReviewing] = useState(null);
  const { items } = unwrapList(data);
  

  return (
    <div>
      <div className="frow" style={{ marginBottom: 11, alignItems: 'center', gap: 8 }}>
        <div className="ff" style={{ margin: 0 }}>
          <input type="month" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="ff" style={{ margin: 0 }}>
          <select className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--g400)', marginBottom: 8 }}>
        Approved late arrivals are not counted for late deduction. A generated salary slip for that month is updated automatically.
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          items.map((r) => {
            const userName = typeof r.user === 'object' ? `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim() : 'Employee';
            const rowStatus = r.lateStatus === 'approved' || r.lateStatus === 'rejected' ? r.lateStatus : 'pending';
            return (
              <div className="crow" key={r._id}>
                <div className="cinfo">
                  <div className="cday">
                    {userName || 'Employee'} · {fmtDate(r.date)}
                  </div>
                  <div className="ctimes">
                    Check-in {fmtTime(r.checkIn?.time)}{r.lateMinutes ? ` · ${r.lateMinutes} min late` : ''}
                    {r.lateRemarks ? ` · ${r.lateRemarks}` : ''}
                  </div>
                </div>
                <span className={`lpill lp-${rowStatus}`}>{rowStatus}</span>
                {rowStatus !== 'approved' ? (
                  <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10, marginLeft: 6 }} onClick={() => setReviewing({ record: r, status: 'approved' })}>
                    ✓
                  </button>
                ) : null}
                {rowStatus !== 'rejected' ? (
                  <button className="btn btn-r btn-sm" style={{ padding: '4px 8px', fontSize: 10, marginLeft: 4 }} onClick={() => setReviewing({ record: r, status: 'rejected' })}>
                    ✗
                  </button>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState>No late arrivals to review</EmptyState>
        )}
      </div>
      <ReviewLateModal key={reviewing ? `${reviewing.record._id}-${reviewing.status}` : 'none'} reviewing={reviewing} onClose={() => setReviewing(null)} />
    </div>
  );
}

function ReviewLateModal({ reviewing, onClose }) {
  const [reviewLate, { isLoading }] = useReviewLateMutation();
  const toast = useToast();
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const isApprove = reviewing?.status === 'approved';

  async function handleSubmit() {
    try {
      const result = await reviewLate({ id: reviewing.record._id, status: reviewing.status, remarks: remarks.trim() || undefined }).unwrap();
      const salaryNote = result?.salary?.message ? ` · ${result.salary.message}` : '';
      toast(`${isApprove ? 'Late arrival approved' : 'Late arrival rejected'}${salaryNote}`);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update late arrival.'));
    }
  }

  return (
    <Modal
      open={Boolean(reviewing)}
      onClose={onClose}
      title={isApprove ? 'Approve Late Arrival' : 'Reject Late Arrival'}
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
      <div style={{ fontSize: 12, color: 'var(--g600)', marginBottom: 8 }}>
        {isApprove
          ? 'This late arrival will be excused and not counted for late deduction.'
          : 'This late arrival will count toward the late deduction policy.'}
      </div>
      <div className="ff">
        <label className="fl">Remarks (optional)</label>
        <textarea className="fi" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
    </Modal>
  );
}
