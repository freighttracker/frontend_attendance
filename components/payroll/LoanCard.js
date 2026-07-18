'use client';

import { useState } from 'react';
import { fmtCurrency, fmtDate, titleCase, initials } from '@/lib/utils/format';

export default function LoanCard({ loan, onRecordPayment }) {
  const [expanded, setExpanded] = useState(false);
  const pct = loan.principal > 0 ? Math.min(100, Math.round((loan.paid / loan.principal) * 100)) : 0;

  return (
    <div className="loan-card">
      <div className="loan-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="uav">{initials(loan.user?.name)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>{loan.user?.name}</div>
            <div style={{ fontSize: 10, color: 'var(--g400)' }}>{titleCase(loan.type)} · Started {fmtDate(loan.startDate)}</div>
          </div>
        </div>
        <span className={`chip chip-${loan.status === 'active' ? 'active' : 'closed'}`}>{titleCase(loan.status)}</span>
      </div>

      <div className="loan-figs">
        <div className="loan-fig">
          <div className="stat-v">{fmtCurrency(loan.principal)}</div>
          <div className="stat-l">Principal</div>
        </div>
        <div className="loan-fig">
          <div className="stat-v">{fmtCurrency(loan.emi)}</div>
          <div className="stat-l">EMI</div>
        </div>
        <div className="loan-fig">
          <div className="stat-v">{fmtCurrency(loan.outstanding)}</div>
          <div className="stat-l">Balance</div>
        </div>
      </div>

      <div className="pbar-wrap">
        <div className="pbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 9, color: 'var(--g400)' }}>
        <span>{pct}% repaid</span>
        <span>{fmtCurrency(loan.paid)} of {fmtCurrency(loan.principal)}</span>
      </div>

      <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
        {loan.status === 'active' ? (
          <button className="btn btn-p btn-sm" onClick={() => onRecordPayment(loan)}>
            Record payment
          </button>
        ) : null}
        <button className="btn btn-g btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide timeline' : 'Payment timeline'}
        </button>
      </div>

      {expanded ? (
        <div className="timeline" style={{ marginTop: 14 }}>
          {loan.payments.length ? (
            loan.payments.map((p, i) => (
              <div className="tl-item" key={p._id || p.id || i}>
                <div className="tl-dot" />
                <div className="tl-card" style={{ cursor: 'default' }}>
                  <div className="tl-card-top">
                    <span className="tl-month">{fmtDate(p.date)}</span>
                    <span className="tl-net">{fmtCurrency(p.amount)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">No payments recorded yet</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
