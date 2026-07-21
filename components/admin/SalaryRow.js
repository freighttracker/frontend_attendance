import { fmtCurrency, initials } from '@/lib/utils/format';
import { SalaryStatusPill } from '../ui/StatusPill';

export default function SalaryRow({ name, slip, onGenerate, onApprove, onPublish, onMarkPaid, isBusy }) {
  return (
    <div className="srow">
      <div className="uav" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
        {initials(name)}
      </div>
      <div className="sinfo">
        <div className="sname">{name}</div>
        <div className="sbreak">
          {slip ? (
            <>
              {slip.presentDays ?? 0}P · {slip.halfDays ?? 0}HD · {slip.absentDays ?? 0}A
            </>
          ) : (
            'No slip generated'
          )}
        </div>
      </div>
      {slip ? (
        <>
          <div>
            <div className="snet">{fmtCurrency(slip.netSalary)}</div>
            {slip.deductions > 0 ? <div className="sded">−{fmtCurrency(slip.deductions)}</div> : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, marginLeft: 8 }}>
            <SalaryStatusPill status={slip.status} />
            {slip.status === 'generated' ? (
              <button className="btn btn-p btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onApprove(slip.id)}>
                Approve
              </button>
            ) : null}
            {slip.status === 'approved' ? (
              <button className="btn btn-g btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onPublish(slip.id)}>
                Publish
              </button>
            ) : null}
            {slip.status === 'published' ? (
              <button className="btn btn-g btn-sm" style={{ padding: '4px 8px', fontSize: 10 }} disabled={isBusy} onClick={() => onMarkPaid(slip.id)}>
                Mark paid
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <button className="btn btn-g btn-sm" disabled={isBusy} onClick={onGenerate}>
          Generate
        </button>
      )}
    </div>
  );
}
