'use client';

export default function PayrollTabs({ tabs, active, onChange, pendingCount }) {
  return (
    <div className="atabs">
      {tabs.map((tab) => (
        <button key={tab.key} className={`atab ${active === tab.key ? 'on' : ''}`} onClick={() => onChange(tab.key)}>
          {tab.label}
          {tab.key === 'reimbursements' && pendingCount > 0 ? <span className="pdot2">{pendingCount}</span> : null}
        </button>
      ))}
    </div>
  );
}
