'use client';

import { useGetWorkingHoursQuery } from '@/lib/services/attendanceApi';
import { MONTH_NAMES } from '@/lib/utils/format';

export default function MonthBar() {
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { data } = useGetWorkingHoursQuery({ month, year });

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = totalDaysInMonth - dayOfMonth;
  const workingDays = data?.workingDays ?? data?.totalWorkingDays ?? data?.workDays?.length ?? null;

  return (
    <div className="card">
      <div className="mbar-meta">
        <span className="mbar-name">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <span className="mbar-left">{daysLeft === 0 ? 'Last day' : `${daysLeft}d left`}</span>
      </div>
      <div className="mbar-wrap">
        <div className="mbar-fill" style={{ width: `${Math.round((dayOfMonth / totalDaysInMonth) * 100)}%` }} />
      </div>
      <div className="mbar-foot">
        <span>
          Day {dayOfMonth} of {totalDaysInMonth}
        </span>
        <span>{workingDays !== null ? `${workingDays} working days` : '—'}</span>
      </div>
    </div>
  );
}

