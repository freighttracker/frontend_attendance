import { fmtCurrency, fmtDate, titleCase, initials } from '@/lib/utils/format';
import { TrashIcon } from '../icons';

export default function BonusRow({ bonus, isBusy, onApprove, onDelete }) {
  return (
    <div className="drow">
      <div className="uav" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(bonus.user?.name)}</div>
      <div className="drow-info">
        <div className="drow-title">{bonus.user?.name || 'Unknown employee'}</div>
        <div className="drow-sub">
          {titleCase(bonus.bonusType)} · {bonus.reason || 'No reason given'} · {fmtDate(bonus.date)}
        </div>
        {bonus.approvedBy ? <div className="drow-sub">Approved by {bonus.approvedBy}</div> : null}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="drow-amt">{fmtCurrency(bonus.amount)}</div>
        <span className={`chip chip-${bonus.status}`}>{titleCase(bonus.status)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 4 }}>
        {bonus.status === 'pending' ? (
          <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onApprove(bonus.id)}>
            Approve
          </button>
        ) : null}
        <button className="ib del" onClick={() => onDelete(bonus)}>
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}
