'use client';

import { useGetExitSummaryQuery } from '@/lib/services/usersApi';
import { fmtCurrency, fmtDate, MONTH_NAMES } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

export const EXIT_TYPES = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'absconded', label: 'Absconded' },
  { value: 'contract_ended', label: 'Contract ended' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

export const exitTypeLabel = (value) => EXIT_TYPES.find((t) => t.value === value)?.label || '';

function Line({ label, value, tone }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, padding: '5px 0' }}>
      <span style={{ color: 'var(--g600)' }}>{label}</span>
      <b style={tone ? { color: `var(--${tone})` } : undefined}>{value}</b>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--g400)', marginBottom: 2 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// Dues to recover, amounts still payable, open requests and final-month pay
// for one employee. With `leavingDate` (and the employee still active) it is
// a preview of what marking them as left will do; otherwise it is the record
// of an exit that already happened.
export function ExitSummaryPanel({ employeeId, leavingDate }) {
  const { data, isLoading, isError } = useGetExitSummaryQuery({ id: employeeId, leavingDate }, { skip: !employeeId });

  if (isLoading) return <Spinner />;
  if (isError || !data) return <div className="ferr">Could not load exit details.</div>;

  const { recoverable, payable, openItems, finalMonth, unpaidSlips } = data;
  const isPreview = !data.hasLeft;
  const monthLabel = `${MONTH_NAMES[finalMonth.month - 1]} ${finalMonth.year}`;

  return (
    <div>
      {data.hasLeft ? (
        <Section title="Exit">
          <Line label="Last working day" value={fmtDate(data.lastWorkingDay)} />
          {data.exitType ? <Line label="Type" value={exitTypeLabel(data.exitType)} /> : null}
          {data.reason ? <Line label="Reason" value={data.reason} /> : null}
          {data.tenureMonths !== null ? <Line label="Time with company" value={`${Math.floor(data.tenureMonths / 12)}y ${data.tenureMonths % 12}m`} /> : null}
        </Section>
      ) : null}

      <Section title="To recover from employee">
        {recoverable.total > 0 ? (
          <>
            {recoverable.loanCount ? <Line label={`Loan balance (${recoverable.loanCount})`} value={fmtCurrency(recoverable.loanBalance)} tone="red" /> : null}
            {recoverable.advanceCount ? <Line label={`Advance salary balance (${recoverable.advanceCount})`} value={fmtCurrency(recoverable.advanceBalance)} tone="red" /> : null}
          </>
        ) : (
          <Line label="Loans / advances" value="Nothing outstanding" />
        )}
      </Section>

      <Section title="Still to pay employee">
        <Line
          label={`${monthLabel} salary`}
          value={finalMonth.slip ? `${fmtCurrency(finalMonth.slip.netSalary)} · ${finalMonth.slip.status}` : 'Slip not generated'}
          tone={finalMonth.slip?.status === 'paid' ? 'grn' : undefined}
        />
        {data.hasLeft ? (
          <Line label="Payable days in final month" value={`${finalMonth.payableDays} of ${finalMonth.daysInMonth}`} />
        ) : null}
        {unpaidSlips.filter((s) => !(s.month === finalMonth.month && s.year === finalMonth.year)).map((s) => (
          <Line key={s.id} label={`${MONTH_NAMES[s.month - 1]} ${s.year} salary`} value={`${fmtCurrency(s.netSalary)} · ${s.status}`} />
        ))}
        {payable.approvedBonuses > 0 ? <Line label="Approved bonuses (unpaid)" value={fmtCurrency(payable.approvedBonuses)} /> : null}
        {payable.approvedReimbursements > 0 ? <Line label="Approved reimbursements (unpaid)" value={fmtCurrency(payable.approvedReimbursements)} /> : null}
      </Section>

      <Section title={isPreview ? 'Open items' : 'Still open'}>
        <Line
          label={isPreview ? 'Leave requests that will be cancelled' : 'Open leave requests'}
          value={openItems.leaveRequests}
        />
        <Line label="Pending attendance corrections" value={openItems.correctionRequests} />
        <Line label="Overtime awaiting approval" value={openItems.overtimeDays ? `${openItems.overtimeHours}h (${openItems.overtimeDays} days)` : 0} />
        {payable.pendingBonusCount + payable.pendingReimbursementCount > 0 ? (
          <Line label="Bonus / reimbursement requests pending" value={payable.pendingBonusCount + payable.pendingReimbursementCount} />
        ) : null}
      </Section>
    </div>
  );
}

export default function ExitSummaryModal({ employee, onClose }) {
  return (
    <Modal
      open={Boolean(employee)}
      onClose={onClose}
      title="Exit Details"
      subtitle={employee?.name}
      actions={
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Close
        </button>
      }
    >
      {employee ? <ExitSummaryPanel key={employee.id} employeeId={employee.id} /> : null}
    </Modal>
  );
}
