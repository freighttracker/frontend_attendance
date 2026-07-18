'use client';

import Link from 'next/link';
import { CheckSquareIcon, ClockIcon, UserIcon } from '../icons';

export default function QuickActions({ onApplyLeave }) {
  return (
    <div className="qa-grid">
      <button className="qa-btn" onClick={onApplyLeave}>
        <div className="qa-icon">
          <CheckSquareIcon />
        </div>
        <span className="qa-lbl">Apply Leave</span>
      </button>
      <Link href="/history" className="qa-btn">
        <div className="qa-icon">
          <ClockIcon />
        </div>
        <span className="qa-lbl">History</span>
      </Link>
      <Link href="/profile" className="qa-btn">
        <div className="qa-icon">
          <UserIcon />
        </div>
        <span className="qa-lbl">Profile</span>
      </Link>
    </div>
  );
}
