import { fmtDate } from '@/lib/utils/format';
import { LeaveStatusPill } from '../ui/StatusPill';

export default function LeaveRow({ leave, onCancel, showUser }) {
  const typeName = typeof leave.leaveType === 'object' ? leave.leaveType?.name : null;
  const userName = showUser && typeof leave.user === 'object' ? `${leave.user?.firstName || ''} ${leave.user?.lastName || ''}`.trim() : null;

  return (
    <div className="litem">
      <div className="linfo">
        {userName ? <div style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 700 }}>{userName}</div> : null}
        <div className="ldate-label">
          {fmtDate(leave.startDate)}
          {leave.startDate !== leave.endDate ? ` — ${fmtDate(leave.endDate)}` : ''}
          {typeName ? ` · ${typeName}` : ''}
        </div>
        <div className="lreason">{leave.reason || 'No reason provided'}</div>
        {leave.totalDays ? (
          <div className="ldays-label">
            {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''} applied
          </div>
        ) : null}
        {leave.status === 'rejected' && leave.rejectionReason ? (
          <div className="lreason" style={{ color: 'var(--red)' }}>
            {leave.rejectionReason}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <LeaveStatusPill status={leave.status} />
        {leave.status === 'pending' && onCancel ? (
          <button className="btn btn-g btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => onCancel(leave.id)}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
