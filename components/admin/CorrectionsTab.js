'use client';

import { useState } from 'react';
import { useGetCorrectionRequestsQuery, useReviewCorrectionMutation } from '@/lib/services/attendanceApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import RejectCorrectionModal from './RejectCorrectionModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function CorrectionsTab() {
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useGetCorrectionRequestsQuery({ status, page: 1, limit: 100 });
  const [reviewCorrection] = useReviewCorrectionMutation();
  const toast = useToast();
  const [rejectingId, setRejectingId] = useState(null);

  const { items } = unwrapList(data);

  async function handleApprove(id) {
    try {
      await reviewCorrection({ id, status: 'approved' }).unwrap();
      toast('Correction approved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve request.'), 'err');
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
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          items.map((c) => {
            const userName = typeof c.userId === 'object' ? `${c.userId?.firstName || ''} ${c.userId?.lastName || ''}`.trim() : 'Employee';
            const recordDate = c.attendanceRecordId?.date || c.date;
            return (
              <div className="crow" key={c._id}>
                <div className="cinfo">
                  <div className="cday">
                    {userName} · {recordDate ? fmtDate(recordDate) : '—'}
                  </div>
                  <div className="ctimes">
                    Requested: {fmtTime(c.requestedCheckIn)} — {fmtTime(c.requestedCheckOut)}
                  </div>
                  <div className="ctimes">{c.reason}</div>
                </div>
                <span className={`lpill lp-${c.status}`}>{c.status}</span>
                {c.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                    <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => handleApprove(c._id)}>
                      ✓
                    </button>
                    <button className="btn btn-r btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => setRejectingId(c._id)}>
                      ✗
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState>No correction requests</EmptyState>
        )}
      </div>
      <RejectCorrectionModal correctionId={rejectingId} onClose={() => setRejectingId(null)} />
    </div>
  );
}
