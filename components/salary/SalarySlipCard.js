import { MONTH_NAMES, fmtCurrency } from '@/lib/utils/format';
import { SalaryStatusPill } from '../ui/StatusPill';

export default function SalarySlipCard({ slip, companyName = 'AttendanceHR', employeeName, employeeMeta }) {
  return (
    <div className="slip">
      <div className="slip-head">
        <div>
          <div className="slip-co">{companyName}</div>
          <div className="slip-mon">
            Salary Slip — {MONTH_NAMES[(slip.month || 1) - 1]} {slip.year}
          </div>
        </div>
        <div className="slip-emp-r">
          <div className="sn">{employeeName}</div>
          <div className="sd">{employeeMeta}</div>
        </div>
      </div>
      <div className="slip-row">
        <span>Working days in month</span>
        <span>{slip.workingDays ?? '—'}</span>
      </div>
      <div className="slip-row">
        <span>Days present</span>
        <span>{slip.presentDays ?? '—'}</span>
      </div>
      <div className="slip-row">
        <span>Half days</span>
        <span>{slip.halfDays ?? '—'}</span>
      </div>
      <div className="slip-row">
        <span>Absent days</span>
        <span>{slip.absentDays ?? '—'}</span>
      </div>
      <div className="slip-row">
        <span>Base salary</span>
        <span>{fmtCurrency(slip.baseSalary)}</span>
      </div>
      <div className="slip-row ded">
        <span>Deductions</span>
        <span>−{fmtCurrency(slip.deductions)}</span>
      </div>
      <div className="slip-row ttl">
        <span>Net salary</span>
        <span>{fmtCurrency(slip.netSalary)}</span>
      </div>
      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <SalaryStatusPill status={slip.status} />
      </div>
    </div>
  );
}
