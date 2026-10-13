import { fmtCurrency, fmtDate, initials } from '@/lib/utils/format';
import { EditIcon, LogOutIcon } from '../icons';

export default function EmployeeRow({ user, onEdit, onMarkLeft, onRejoin, onViewExit, isBusy }) {
  const hasLeft = user.isActive === false;
  return (
    <div className="urow">
      <div className="uav" style={hasLeft ? { opacity: 0.5 } : undefined}>{initials(user.name)}</div>
      <div className="uinfo" style={hasLeft ? { opacity: 0.6 } : undefined}>
        <div className="uname">
          {user.name}
          {user.department ? (
            <span style={{ fontSize: 9, color: 'var(--g400)', fontWeight: 400 }}> {user.department}</span>
          ) : null}
          {hasLeft ? <span className="chip chip-rejected" style={{ marginLeft: 6 }} title={user.leftReason || undefined}>Left{user.leftAt ? ` ${fmtDate(user.leftAt)}` : ''}</span> : null}
        </div>
        <div className="uemail">{user.email}</div>
      </div>
      <div className="usal">{user.role === 'employee' ? fmtCurrency(user.baseSalary) : 'Admin'}</div>
      <div className="uacts">
        <button className="ib" onClick={() => onEdit(user)} title="Edit">
          <EditIcon />
        </button>
        {hasLeft ? (
          <>
            <button className="btn btn-g btn-sm" onClick={() => onViewExit?.(user)} title="Dues, final pay and exit details">
              Exit details
            </button>
            <button className="btn btn-g btn-sm" onClick={() => onRejoin(user)} disabled={isBusy} title="Mark as active again">
              Rejoin
            </button>
          </>
        ) : (
          <button className="ib del" onClick={() => onMarkLeft(user)} title="Mark as left">
            <LogOutIcon />
          </button>
        )}
      </div>
    </div>
  );
}
