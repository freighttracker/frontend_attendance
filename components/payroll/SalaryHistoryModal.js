'use client';

import { useGetSalaryStructureHistoryQuery } from '@/lib/services/payrollApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtCurrency, fmtDate } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

function HistoryList({ userId }) {
  const { data, isLoading } = useGetSalaryStructureHistoryQuery(userId, { skip: !userId });
  const { items } = unwrapList(data);

  if (isLoading) return <Spinner />;
  if (!items.length) return <EmptyState>No structure changes recorded yet</EmptyState>;

  return (
    <div className="timeline">
      {items.map((entry) => (
        <div className="tl-item" key={entry._id || entry.id}>
          <div className="tl-dot" />
          <div className="tl-card">
            <div className="tl-card-top">
              <span className="tl-month">{fmtDate(entry.effectiveFrom || entry.createdAt)}</span>
              <span className="tl-net">{fmtCurrency(entry.grossSalary)}</span>
            </div>
            <div className="tl-meta">
              <span style={{ fontSize: 10, color: 'var(--g400)' }}>
                {(entry.earnings?.length || 0) + (entry.deductions?.length || 0)} components
              </span>
              <span style={{ fontSize: 10, color: 'var(--g400)' }}>{entry.changedBy?.name || 'System'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SalaryHistoryModal({ open, onClose, employee }) {
  return (
    <Modal open={open} onClose={onClose} title="Salary Structure History" subtitle={employee?.name}>
      {open ? <HistoryList userId={employee?.id} /> : null}
    </Modal>
  );
}
