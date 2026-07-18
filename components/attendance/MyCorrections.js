'use client';

import { useGetMyCorrectionsQuery } from '@/lib/services/attendanceApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime } from '@/lib/utils/format';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function MyCorrections() {
  const { data, isLoading } = useGetMyCorrectionsQuery({ page: 1, limit: 20 });
  const { items } = unwrapList(data);

  return (
    <>
      <div className="sec-h">
        <span className="sec-t">My correction requests</span>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : items.length ? (
          items.map((c) => (
            <div className="crow" key={c._id}>
              <div className="cinfo">
                <div className="cday">{fmtDate(c.date)}</div>
                <div className="ctimes">
                  Requested: {fmtTime(c.requestedCheckIn)} — {fmtTime(c.requestedCheckOut)}
                </div>
                <div className="ctimes">{c.reason}</div>
                {c.status === 'rejected' && c.rejectionReason ? (
                  <div className="ctimes" style={{ color: 'var(--red)' }}>
                    Reason: {c.rejectionReason}
                  </div>
                ) : null}
              </div>
              <span className={`lpill lp-${c.status}`}>{c.status}</span>
            </div>
          ))
        ) : (
          <EmptyState>No correction requests yet</EmptyState>
        )}
      </div>
    </>
  );
}
