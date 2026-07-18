import { fmtCurrency, initials } from '@/lib/utils/format';
import { EditIcon, ClockIcon, MoneyIcon } from '../icons';

export default function SalaryStructureRow({ employee, structure, isBusy, onView, onEdit, onHistory, onGenerate }) {
  const componentCount = (structure?.earnings?.length || 0) + (structure?.deductions?.length || 0);

  return (
    <div className="urow">
      <div className="uav">{initials(employee.name)}</div>
      <div className="uinfo">
        <div className="uname">{employee.name}</div>
        <div className="uemail">
          {employee.employeeCode || '—'} · {employee.department || '—'} · {employee.designation || '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginRight: 6 }}>
        <div className="usal">{fmtCurrency(structure?.grossSalary ?? employee.baseSalary)}</div>
        <div style={{ fontSize: 9, color: 'var(--g400)' }}>{structure ? `${componentCount} components` : 'Not configured'}</div>
      </div>
      <span className={`chip ${structure ? 'chip-active' : 'chip-closed'}`}>{structure ? 'Active' : 'Not set'}</span>
      <div className="uacts">
        <button className="ib" title="View" onClick={() => onView(employee, structure)}>
          <MoneyIcon />
        </button>
        <button className="ib" title="Edit" onClick={() => onEdit(employee, structure)}>
          <EditIcon />
        </button>
        <button className="ib" title="History" onClick={() => onHistory(employee)}>
          <ClockIcon />
        </button>
      </div>
      <button className="btn btn-p btn-sm" disabled={isBusy} onClick={() => onGenerate(employee)}>
        Generate
      </button>
    </div>
  );
}
