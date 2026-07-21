'use client';

import { useMemo, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetMonthlyAttendanceReportQuery } from '@/lib/services/attendanceApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtCurrency, MONTH_NAMES } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';
import KpiCard from '../payroll/KpiCard';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import {
  UsersIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  CalendarIcon,
  TrendUpIcon,
  PieChartIcon,
  BriefcaseIcon,
  MoneyIcon,
} from '../icons';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'weekend', label: 'Week Off' },
  { value: 'holiday', label: 'Holiday' },
];

const LIMIT = 20;

function SalaryCell({ amount, source }) {
  if (source === 'unavailable') return <span style={{ color: 'var(--g400)' }}>—</span>;
  return (
    <span>
      {fmtCurrency(amount)}
      {source === 'estimated' ? <span style={{ color: 'var(--g400)', fontSize: 9, marginLeft: 4 }}>(est.)</span> : null}
    </span>
  );
}

export default function AttendanceReportTab() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Loaded purely to populate the department/designation filter dropdowns -
  // the report table itself is fetched (and paginated) separately below.
  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser);
  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);
  const designations = useMemo(() => [...new Set(employees.map((e) => e.designation).filter(Boolean))], [employees]);

  const { data, isLoading, isFetching } = useGetMonthlyAttendanceReportQuery({
    month, year, department, designation, search, status, page, limit: LIMIT,
  });

  const summary = data?.summary || {};
  const rows = data?.employees || [];
  const pagination = data?.pagination;

  function resetAnd(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <select className="fi" value={month} onChange={(e) => resetAnd(setMonth)(Number(e.target.value))}>
          {MONTH_NAMES.map((name, idx) => (
            <option key={name} value={idx + 1}>{name}</option>
          ))}
        </select>
        <input className="fi" type="number" style={{ width: 90 }} value={year} onChange={(e) => resetAnd(setYear)(Number(e.target.value))} />
        <select className="fi" value={department} onChange={(e) => resetAnd(setDepartment)(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="fi" value={designation} onChange={(e) => resetAnd(setDesignation)(e.target.value)}>
          <option value="">All designations</option>
          {designations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <input
          className="fi"
          style={{ flex: 1, minWidth: 160 }}
          placeholder="Search employee name or ID…"
          value={search}
          onChange={(e) => resetAnd(setSearch)(e.target.value)}
        />
        <select className="fi" value={status} onChange={(e) => resetAnd(setStatus)(e.target.value)}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <div className="kpi-grid">
            <KpiCard icon={UsersIcon} tone="ind" label="Total Employees" value={summary.totalEmployees ?? 0} />
            <KpiCard icon={CheckIcon} tone="grn" label="Present Days" value={summary.presentDays ?? 0} />
            <KpiCard icon={XIcon} tone="red" label="Absent Days" value={summary.absentDays ?? 0} />
            <KpiCard icon={ClockIcon} tone="amb" label="Half Days" value={summary.halfDays ?? 0} />
            <KpiCard icon={CalendarIcon} tone="blu" label="Paid Leaves" value={summary.paidLeaves ?? 0} />
            <KpiCard icon={CalendarIcon} tone="red" label="Unpaid Leaves" value={summary.unpaidLeaves ?? 0} />
            <KpiCard icon={CalendarIcon} tone="ind" label="Week Offs" value={summary.weekOffs ?? 0} />
            <KpiCard icon={CalendarIcon} tone="blu" label="Holidays" value={summary.holidays ?? 0} />
            <KpiCard icon={ClockIcon} tone="amb" label="Late Check-ins" value={summary.lateCheckIns ?? 0} />
            <KpiCard icon={ClockIcon} tone="amb" label="Early Check-outs" value={summary.earlyCheckOuts ?? 0} />
            <KpiCard icon={TrendUpIcon} tone="grn" label="Overtime Hours" value={summary.overtimeHours ?? 0} format={(v) => `${v}h`} />
            <KpiCard icon={PieChartIcon} tone="ind" label="Attendance %" value={summary.attendancePercentage ?? 0} format={(v) => `${v}%`} />
            <KpiCard icon={BriefcaseIcon} tone="grn" label="Working Days" value={summary.workingDays ?? 0} />
            <KpiCard icon={MoneyIcon} tone="grn" label="Payroll Days" value={summary.payrollDays ?? 0} />
          </div>

          <div className="card" style={{ padding: 0 }}>
            {rows.length ? (
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Working Days</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Half Day</th>
                      <th>Paid Leave</th>
                      <th>Unpaid Leave</th>
                      <th>Holiday</th>
                      <th>Week Off</th>
                      <th>Late Days</th>
                      <th>Overtime Hrs</th>
                      <th>Attendance %</th>
                      <th>Salary Days</th>
                      <th>Gross Salary</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.employeeCode}</td>
                        <td>{r.name}</td>
                        <td>{r.department || '—'}</td>
                        <td>{r.designation || '—'}</td>
                        <td>{r.workingDays}</td>
                        <td>{r.presentDays}</td>
                        <td>{r.absentDays}</td>
                        <td>{r.halfDays}</td>
                        <td>{r.paidLeaveDays}</td>
                        <td>{r.unpaidLeaveDays}</td>
                        <td>{r.holidays}</td>
                        <td>{r.weeklyOffs}</td>
                        <td>{r.lateCount}</td>
                        <td>{r.overtimeHours}</td>
                        <td>{r.attendancePct}%</td>
                        <td>{r.salaryDays}</td>
                        <td><SalaryCell amount={r.grossSalary} source={r.salarySource} /></td>
                        <td><SalaryCell amount={r.netSalary} source={r.salarySource} /></td>
                        <td><AttendanceStatusPill status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>No attendance records match these filters</EmptyState>
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
              <button className="btn btn-g btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span style={{ fontSize: 11, color: 'var(--g400)' }}>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} employees
                {isFetching ? ' · updating…' : ''}
              </span>
              <button className="btn btn-g btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
