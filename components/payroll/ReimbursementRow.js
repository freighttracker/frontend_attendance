import { fmtCurrency, fmtDate, titleCase, initials } from '@/lib/utils/format';

export default function ReimbursementRow({ item, isBusy, onApprove, onReject }) {
  return (
    <div className="drow">
      <div className="uav" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(item.user?.name)}</div>
      <div className="drow-info">
        <div className="drow-title">{item.user?.name || 'Unknown employee'}</div>
        <div className="drow-sub">
          {titleCase(item.category)} · {item.description || 'No description'} · {fmtDate(item.date)}
        </div>
        {item.status === 'rejected' && item.rejectionReason ? (
          <div className="drow-sub" style={{ color: 'var(--red)' }}>{item.rejectionReason}</div>
        ) : null}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="drow-amt">{fmtCurrency(item.amount)}</div>
        <span className={`chip chip-${item.status}`}>{titleCase(item.status)}</span>
      </div>
      {item.status === 'pending' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 4 }}>
          <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onApprove(item.id)}>
            Approve
          </button>
          <button className="btn btn-g btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onReject(item.id)}>
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}
