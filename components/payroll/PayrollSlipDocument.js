import { MONTH_NAMES, fmtCurrency } from '@/lib/utils/format';
import { SalaryStatusPill } from '../ui/StatusPill';

function componentAmount(component, gross) {
  const value = Number(component.value) || 0;
  return component.calcType === 'percentage' ? (value / 100) * gross : value;
}

// A generated slip carries its own calculated line items (including LOP /
// half-day deductions) - show those as fixed amounts so the document always
// matches the slip's net salary, rather than re-deriving them from whatever
// the salary structure looks like today.
function slipLines(lines) {
  return (lines || [])
    .filter((l) => l.amount)
    .map((l) => ({ id: l.key || l.name, name: l.name, calcType: 'fixed', value: l.amount }));
}

export default function PayrollSlipDocument({ slip, employee, structure, companyName = 'AttendanceHR' }) {

    console.log('slip', slip, 'employee', employee, 'structure', structure, 'companyName', companyName);
    
  const raw = slip.raw || {};
  const hasSlipLines = Array.isArray(raw.earnings) && raw.earnings.length > 0;
  const gross = hasSlipLines ? raw.grossSalary ?? 0 : structure?.grossSalary ?? slip.baseSalary ?? 0;
  const earnings = hasSlipLines
    ? slipLines(raw.earnings)
    : structure?.earnings?.length ? structure.earnings : [{ id: 'base', name: 'Basic salary', calcType: 'fixed', value: slip.baseSalary }];

  const deductions = hasSlipLines ? slipLines(raw.deductions) : (structure?.deductions || []).filter((d) => d.enabled !== false);
  const totalEarnings = earnings.reduce((sum, c) => sum + componentAmount(c, gross), 0);
  const totalDeductions = deductions.length ? deductions.reduce((sum, c) => sum + componentAmount(c, gross), 0) : slip.deductions || 0;

  return (
    <div className="slip">
      <div className="slip-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="logo-mark">
            <svg viewBox="0 0 24 24">
              <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
            </svg>
          </div>
          <div>
            <div className="slip-co">{companyName}</div>
            <div className="slip-mon">Salary Slip — {MONTH_NAMES[(slip.month || 1) - 1]} {slip.year}</div>
          </div>
        </div>
        <div className="slip-emp-r">
          <div className="sn">{employee?.name}</div>
          <div className="sd">{employee?.employeeCode} · {employee?.department || '—'} · {employee?.designation || '—'}</div>
        </div>
      </div>

      <div className="card-label" style={{ marginTop: 4 }}>Attendance summary</div>
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

      <div className="card-label" style={{ marginTop: 14 }}>Earnings</div>
      {earnings.map((c) => (
        <div className="slip-row" key={c.id || c.name}>
          <span>{c.name}</span>
          <span>{fmtCurrency(componentAmount(c, gross))}</span>
        </div>
      ))}
      <div className="slip-row" style={{ fontWeight: 800 }}>
        <span>Gross salary</span>
        <span>{fmtCurrency(gross || totalEarnings)}</span>
      </div>

      <div className="card-label" style={{ marginTop: 14 }}>Deductions</div>
      {deductions.length ? (
        deductions.map((c) => (
          <div className="slip-row ded" key={c.id || c.name}>
            <span>{c.name}</span>
            <span>−{fmtCurrency(componentAmount(c, gross))}</span>
          </div>
        ))
      ) : (
        <div className="slip-row ded">
          <span>Deductions</span>
          <span>−{fmtCurrency(totalDeductions)}</span>
        </div>
      )}

      <div className="slip-row ttl">
        <span>Net salary</span>
        <span>{fmtCurrency(slip.netSalary ?? totalEarnings - totalDeductions)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28 }}>
        <div>
          <SalaryStatusPill status={slip.status} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid var(--g300)', width: 140, marginBottom: 4 }} />
          <div style={{ fontSize: 10, color: 'var(--g400)' }}>Employer signature</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 9, color: 'var(--g400)' }}>
        This is a computer-generated salary slip and does not require a signature.
      </div>
    </div>
  );
}
