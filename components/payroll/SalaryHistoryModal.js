'use client';

import { useGetSalaryStructureHistoryQuery } from '@/lib/services/payrollApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { normalizeSalaryStructure } from '@/lib/utils/normalize';
import { fmtCurrency, fmtDate } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

function changedByName(entry) {
  const revisedBy = entry.raw.revisedBy;
  if (revisedBy?.firstName) return `${revisedBy.firstName} ${revisedBy.lastName || ''}`.trim();
  return '—';
}

function HistoryList({ userId }) {
  const { data, isLoading } = useGetSalaryStructureHistoryQuery(userId, { skip: !userId });
  const { items: rawItems } = unwrapList(data);
  // Backend returns revisions oldest-first; each entry only carries its own
  // gross salary, so the "old" figure for a row is simply the previous row's.
  const items = rawItems.map(normalizeSalaryStructure);

  if (isLoading) return <Spinner />;
  if (!items.length) return <EmptyState>No structure changes recorded yet</EmptyState>;

  return (
    <div className="timeline">
      {items.map((entry, idx) => {
        const oldSalary = idx > 0 ? items[idx - 1].grossSalary : null;
        const isRevision = oldSalary !== null && oldSalary !== entry.grossSalary;
        return (
          <div className="tl-item" key={entry.id || entry.effectiveFrom}>
            <div className="tl-dot" />
            <div className="tl-card">
              <div className="tl-card-top">
                <span className="tl-month">Revision #{idx + 1} · {fmtDate(entry.effectiveFrom)}</span>
                <span className="tl-net">{fmtCurrency(entry.grossSalary)}</span>
              </div>
              {oldSalary !== null ? (
                <div style={{ fontSize: 11, color: isRevision ? 'var(--amb)' : 'var(--g400)', marginTop: 4 }}>
                  {fmtCurrency(oldSalary)} → {fmtCurrency(entry.grossSalary)}
                </div>
              ) : null}
              <div className="tl-meta">
                <span style={{ fontSize: 10, color: 'var(--g400)' }}>{entry.raw.remarks || (idx === items.length - 1 ? 'Current' : '—')}</span>
                <span style={{ fontSize: 10, color: 'var(--g400)' }}>Changed by {changedByName(entry)}</span>
              </div>
            </div>
          </div>
        );
      })}
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
