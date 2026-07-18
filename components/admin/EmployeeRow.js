import { fmtCurrency, initials } from '@/lib/utils/format';
import { EditIcon, TrashIcon } from '../icons';

export default function EmployeeRow({ user, onEdit, onDelete }) {
  return (
    <div className="urow">
      <div className="uav">{initials(user.name)}</div>
      <div className="uinfo">
        <div className="uname">
          {user.name}
          {user.department ? (
            <span style={{ fontSize: 9, color: 'var(--g400)', fontWeight: 400 }}> {user.department}</span>
          ) : null}

        </div>
        <div className="uemail">{user.email}</div>
      </div>
      <div className="usal">{user.role === 'employee' ? fmtCurrency(user.baseSalary) : 'Admin'}</div>
      <div className="uacts">
        <button className="ib" onClick={() => onEdit(user)} title="Edit">
          <EditIcon />
        </button>
        <button className="ib del" onClick={() => onDelete(user)} title="Delete">
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
