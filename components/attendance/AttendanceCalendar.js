'use client';

import { useState } from 'react';
import { useGetAttendanceCalendarQuery } from '@/lib/services/attendanceApi';
import { MONTH_NAMES, todayISO } from '@/lib/utils/format';
import KpiCard from '../payroll/KpiCard';
import AttendanceCalendarGrid from './AttendanceCalendarGrid';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { CheckIcon, XIcon, ClockIcon, CalendarIcon } from '../icons';

// Self-contained month calendar for one employee's attendance - fetches its
// own data and owns its own month/year navigation, so it drops into either
// the employee's own history page or an admin employee picker unchanged.
export default function AttendanceCalendar({ userId, employeeLabel }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useGetAttendanceCalendarQuery({ userId, month, year }, { skip: !userId });

  function shiftMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  if (!userId) return <EmptyState>Select an employee to view their attendance calendar</EmptyState>;

  return (
    <div>
      <div className="cal-nav">
        <button className="btn btn-g btn-sm" onClick={() => shiftMonth(-1)}>
          ‹ Prev
        </button>
        <div className="cal-nav-label">
          {employeeLabel ? `${employeeLabel} · ` : ''}
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button className="btn btn-g btn-sm" onClick={() => shiftMonth(1)}>
          Next ›
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : data ? (
        <>
          <div className="kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard icon={CheckIcon} tone="grn" label="Present" value={data.summary.presentDays} />
            <KpiCard icon={XIcon} tone="red" label="Absent" value={data.summary.absentDays} />
            <KpiCard icon={ClockIcon} tone="amb" label="Half Day" value={data.summary.halfDays} />
            <KpiCard icon={CalendarIcon} tone="ind" label="Working Days" value={data.summary.workingDays} />
          </div>
          <AttendanceCalendarGrid days={data.days} month={month} year={year} todayISO={todayISO()} />
        </>
      ) : (
        <EmptyState>No attendance data for this period</EmptyState>
      )}
    </div>
  );
}
