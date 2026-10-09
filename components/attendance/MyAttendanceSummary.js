'use client';

import { useGetEmployeeAttendanceReportQuery, useGetWorkingHoursQuery } from '@/lib/services/attendanceApi';
import { fmtCurrency } from '@/lib/utils/format';
import KpiCard from '../payroll/KpiCard';
import Spinner from '../ui/Spinner';
import { CheckIcon, XIcon, ClockIcon, CalendarIcon, PieChartIcon, MoneyIcon } from '../icons';

// Employee's own monthly attendance snapshot - present/absent/leave counts,
// attendance %, and what that translates to for this month's pay. The
// day-value math (salaryDays) mirrors payroll.service.js exactly so this
// never disagrees with what payroll actually calculates.
// Polled so an admin approving a correction (from another session) shows
// up here without the employee having to reload.
const REFRESH_MS = 60000;

export default function MyAttendanceSummary({ userId, month, year }) {
  const { data, isLoading } = useGetEmployeeAttendanceReportQuery({ userId, month, year }, { skip: !userId, pollingInterval: REFRESH_MS });
  const { data: hours } = useGetWorkingHoursQuery({ month, year }, { skip: !userId, pollingInterval: REFRESH_MS });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="kpi-grid" style={{ marginBottom: 16 }}>
      <KpiCard icon={CheckIcon} tone="grn" label="Present Days" value={data.presentDays} />
      <KpiCard icon={XIcon} tone="red" label="Absent Days" value={data.absentDays} />
      <KpiCard icon={ClockIcon} tone="amb" label="Half Days" value={data.halfDays} />
      <KpiCard icon={CalendarIcon} tone="red" label="Unpaid Leaves" value={data.unpaidLeaveDays} />
      <KpiCard icon={ClockIcon} tone="amb" label="Late Days" value={data.lateCount} />
      <KpiCard icon={PieChartIcon} tone="ind" label="Attendance %" value={data.attendancePct} format={(v) => `${v}%`} />
      <KpiCard icon={ClockIcon} tone="ind" label="Working Hours" value={hours?.totalWorkingHours ?? 0} format={(v) => `${v}h`} />
      <KpiCard icon={CalendarIcon} tone="grn" label="Salary Days (To Date)" value={data.expectedSalaryDays} />
      <KpiCard icon={MoneyIcon} tone="grn" label="Salary Estimate" value={data.currentMonthSalaryEstimate ?? 0} format={fmtCurrency} />
    </div>
  );
}
