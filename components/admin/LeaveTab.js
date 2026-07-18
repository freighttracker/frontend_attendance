'use client';

import { useState } from 'react';
import { useGetAllLeavesQuery, useReviewLeaveMutation } from '@/lib/services/leavesApi';
import { normalizeLeave } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import LeaveRow from '../leave/LeaveRow';
import RejectLeaveModal from './RejectLeaveModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function LeaveTab() {
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useGetAllLeavesQuery({ status, page: 1, limit: 100 });
  const [reviewLeave] = useReviewLeaveMutation();
  const toast = useToast();
  const [rejectingId, setRejectingId] = useState(null);

  const { items } = unwrapList(data);
  const leaves = items.map(normalizeLeave).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  async function handleApprove(id) {
    try {
      await reviewLeave({ id, status: 'approved' }).unwrap();
      toast('Leave approved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve leave.'), 'err');
    }
  }

  return (
    <div>
      <div className="frow" style={{ marginBottom: 11 }}>
        <div className="ff" style={{ margin: 0 }}>
          <select className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : leaves.length ? (
          leaves.map((leave) => (
            <div key={leave.id} className="litem">
              <LeaveRowContent leave={leave} onApprove={handleApprove} onReject={setRejectingId} />
            </div>
          ))
        ) : (
          <EmptyState>No leave requests</EmptyState>
        )}
      </div>
      <RejectLeaveModal leaveId={rejectingId} onClose={() => setRejectingId(null)} />
    </div>
  );
}

function LeaveRowContent({ leave, onApprove, onReject }) {
  const typeName = typeof leave.leaveType === 'object' ? leave.leaveType?.name : null;
  const userName = typeof leave.user === 'object' ? `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim() : 'Unknown';

  return (
    <>
      <div className="linfo">
        <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 700 }}>{userName}</div>
        <div className="ldate-label">
          {leave.startDate}
          {leave.startDate !== leave.endDate ? ` — ${leave.endDate}` : ''}
          {typeName ? ` · ${typeName}` : ''}
        </div>
        <div className="lreason">{leave.reason || 'No reason'}</div>
        {leave.totalDays ? (
          <div className="ldays-label">
            {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <span className={`lpill lp-${leave.status}`}>{leave.status}</span>
        {leave.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => onApprove(leave.id)}>
              ✓
            </button>
            <button className="btn btn-r btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => onReject(leave.id)}>
              ✗
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
