'use client';

export default function AdminTabs({ tabs, active, onChange, pendingCount }) {
  return (
    <div className="atabs">
      {tabs.map((tab) => (
        <button key={tab.key} className={`atab ${active === tab.key ? 'on' : ''}`} onClick={() => onChange(tab.key)}>
          {tab.label}
          {tab.key === 'leave' && pendingCount > 0 ? <span className="pdot2">{pendingCount}</span> : null}
        </button>
      ))}
    </div>
  );
}
