'use client';

import { useGetAllSalarySlipsQuery } from '@/lib/services/salaryApi';
import { normalizeSalarySlip } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { MONTH_NAMES, fmtCurrency } from '@/lib/utils/format';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { SalaryStatusPill } from '../ui/StatusPill';

export default function SalaryHistoryTimeline({ userId, onSelect }) {
  const { data, isLoading } = useGetAllSalarySlipsQuery({ userId, page: 1, limit: 24 }, { skip: !userId });
  const { items } = unwrapList(data);
  const slips = items.map(normalizeSalarySlip).sort((a, b) => (b.year - a.year) || (b.month - a.month));

  if (!userId) return <EmptyState>Select an employee to view salary history</EmptyState>;
  if (isLoading) return <Spinner />;
  if (!slips.length) return <EmptyState>No salary history for this employee yet</EmptyState>;

  return (
    <div className="timeline">
      {slips.map((slip) => (
        <div className="tl-item" key={slip.id}>
          <div className="tl-dot" />
          <div className="tl-card" onClick={() => onSelect(slip)}>
            <div className="tl-card-top">
              <span className="tl-month">{MONTH_NAMES[(slip.month || 1) - 1]} {slip.year}</span>
              <span className="tl-net">{fmtCurrency(slip.netSalary)}</span>
            </div>
            <div className="tl-meta">
              <SalaryStatusPill status={slip.status} />
              <span style={{ fontSize: 10, color: 'var(--ind-d)', fontWeight: 700 }}>View slip →</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
