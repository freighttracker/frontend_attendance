'use client';

import { useMemo, useState } from 'react';
import { useGetAdminDashboardQuery } from '@/lib/services/dashboardApi';
import { fmtDate, fmtDateLong, fmtDayMonth, fmtTime, initials } from '@/lib/utils/format';
import KpiCard from '../payroll/KpiCard';
import { AttendanceStatusPill } from '../ui/StatusPill';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import AttendanceTrendChart from './AttendanceTrendChart';
import {
  UsersIcon,
  CheckIcon,
  ClockIcon,
  XIcon,
  CalendarIcon,
  LogInIcon,
  TrendUpIcon,
  BriefcaseIcon,
  CheckSquareIcon,
  EditIcon,
  UserIcon,
} from '../icons';

// Today's board refreshes on its own so check-ins show up without a reload.
const POLL_MS = 60 * 1000;

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'in', label: 'Present', match: (e) => ['present', 'wfh', 'half_day'].includes(e.status) },
  { key: 'working', label: 'Working now', match: (e) => e.isWorking },
  { key: 'late', label: 'Late', match: (e) => e.isLate },
  { key: 'not_checked_in', label: 'Not checked in', match: (e) => e.status === 'not_checked_in' },
  { key: 'on_leave', label: 'On leave', match: (e) => e.status === 'on_leave' },
  { key: 'absent', label: 'Absent', match: (e) => e.status === 'absent' },
];

const fmtHours = (h) => {
  const mins = Math.round((Number(h) || 0) * 60);
  return mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '—';
};

export default function DashboardTab({ onNavigate }) {
  const { data, isLoading, isFetching, isError, refetch, fulfilledTimeStamp } = useGetAdminDashboardQuery(undefined, {
    pollingInterval: POLL_MS,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  if (isLoading) return <Spinner />;
  // No summary means an older backend answered (it returns a different
  // shape) - say so rather than rendering a board full of zeros.
  if (isError || !data?.summary) {
    return (
      <div className="card">
        <EmptyState>
          {isError ? 'Couldn’t load the dashboard.' : 'The server returned an unexpected response — restart the backend so it picks up the latest code.'}
        </EmptyState>
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-g btn-sm" onClick={refetch}>Try again</button>
        </div>
      </div>
    );
  }

  const s = data.summary || {};
  const pending = data.pending || {};

  return (
    <div className="fade-in">
      <div className="dash-head">
        <div>
          <div className="dash-date">{fmtDateLong(data.date)}</div>
          {data.dayType === 'weekend' || data.dayType === 'holiday' ? (
            <span className="apill ahol" style={{ marginTop: 4, display: 'inline-block' }}>
              {data.dayType === 'holiday' ? data.holidayName || 'Holiday' : 'Weekend'}
            </span>
          ) : null}
        </div>
        <div className="dash-refresh">
          <span>{isFetching ? 'Refreshing…' : `Updated ${fmtTime(fulfilledTimeStamp)}`}</span>
          <button className="btn btn-g btn-sm" onClick={refetch} disabled={isFetching}>Refresh</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={UsersIcon} tone="ind" label="Total Employees" value={s.totalEmployees ?? 0} />
        <KpiCard icon={CheckIcon} tone="grn" label={s.wfh ? `Present (incl. ${s.wfh} WFH)` : 'Present Today'} value={(s.present ?? 0) + (s.wfh ?? 0)} />
        <KpiCard icon={ClockIcon} tone="amb" label="Late Today" value={s.late ?? 0} />
        <KpiCard icon={XIcon} tone="red" label="Not Checked In" value={s.notCheckedIn ?? 0} />
        <KpiCard icon={CalendarIcon} tone="blu" label="On Leave" value={s.onLeave ?? 0} />
        <KpiCard icon={TrendUpIcon} tone="amb" label="Half Day" value={s.halfDay ?? 0} />
        <KpiCard icon={LogInIcon} tone="ind" label="Working Now" value={s.working ?? 0} />
        <KpiCard icon={CheckSquareIcon} tone="grn" label="Attendance Rate" value={s.attendanceRate ?? 0} format={(v) => `${v}%`} />
      </div>

      <div className="sec-h">
        <div className="sec-t">Needs your attention</div>
      </div>
      <div className="pqa-grid">
        <ActionButton icon={CalendarIcon} label="Leave requests" count={pending.leaves} onClick={() => onNavigate?.('leave')} />
        <ActionButton icon={EditIcon} label="Corrections" count={pending.corrections} onClick={() => onNavigate?.('corrections')} />
        {/* <ActionButton icon={ClockIcon} label="Overtime" count={pending.overtime} onClick={() => onNavigate?.('overtime')} /> */}
        <ActionButton icon={UserIcon} label="Employees" onClick={() => onNavigate?.('employees')} />
        <ActionButton icon={BriefcaseIcon} label="Attendance calendar" onClick={() => onNavigate?.('attendanceCalendar')} />
      </div>

      <TodayAttendance employees={data.employees || []} />

      <div className="chart-grid">
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Last 7 days</div></div>
          <AttendanceTrendChart data={data.trend} />
        </div>
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Today by department</div></div>
          <DepartmentBars departments={data.departments || []} />
        </div>
      </div>

      <div className="chart-grid">
        <CelebrationCard
          title="Upcoming birthdays"
          items={data.upcomingBirthdays}
          empty="No birthdays in the next 30 days"
          todayLabel="🎂 Today"
        />
        <CelebrationCard
          title="Work anniversaries"
          items={data.workAnniversaries}
          empty="No work anniversaries in the next 30 days"
          todayLabel="🎉 Today"
          detail={(c) => `${c.years} ${c.years === 1 ? 'year' : 'years'}`}
        />
      </div>

      <div className="chart-grid">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-label">Upcoming holidays</div>
          {data.upcomingHolidays?.length ? (
            data.upcomingHolidays.map((h) => (
              <div className="crow" key={h._id}>
                <div className="cinfo">
                  <div className="cday">{h.name}</div>
                  <div className="ctimes">{fmtDate(h.date)}</div>
                </div>
                <span className="apill ahol">{h.type}</span>
              </div>
            ))
          ) : (
            <EmptyState>No upcoming holidays</EmptyState>
          )}
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-label">This month</div>
          <div className="dash-stat"><span>New joiners</span><b>{data.newJoinersThisMonth ?? 0}</b></div>
          <div className="dash-stat"><span>Checked out today</span><b>{s.checkedOut ?? 0}</b></div>
          <div className="dash-stat"><span>Absent today</span><b>{s.absent ?? 0}</b></div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, count, onClick }) {
  return (
    <button className="qa-btn" onClick={onClick} style={{ position: 'relative' }}>
      <div className="qa-icon"><Icon /></div>
      <span className="qa-lbl">{label}</span>
      {count > 0 ? <span className="dash-badge">{count}</span> : null}
    </button>
  );
}

function TodayAttendance({ employees }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort(),
    [employees]
  );

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, employees.filter(f.match).length])),
    [employees]
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const match = FILTERS.find((f) => f.key === filter)?.match || (() => true);
    return employees.filter(
      (e) =>
        match(e) &&
        (!department || e.department === department) &&
        (!q || e.name.toLowerCase().includes(q) || (e.employeeCode || '').toLowerCase().includes(q))
    );
  }, [employees, filter, search, department]);

  return (
    <div className="card">
      <div className="sec-h">
        <div className="sec-t">Today&apos;s attendance</div>
        <span className="dash-muted">{rows.length} of {employees.length}</span>
      </div>

      <div className="dash-filters">
        {FILTERS.map((f) => (
          <button key={f.key} className={`dash-chip ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label} <span>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="frow" style={{ gap: 8, marginBottom: 6 }}>
        <input
          className="fi"
          style={{ fontSize: 12, padding: '9px 11px', flex: 2 }}
          placeholder="Search name or employee code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {departments.length ? (
          <select className="fi" style={{ fontSize: 12, padding: '9px 11px', flex: 1 }} value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        ) : null}
      </div>

      {rows.length ? (
        rows.map((e) => <TodayRow key={e._id} employee={e} />)
      ) : (
        <EmptyState>{employees.length ? 'No employees match these filters' : 'No active employees yet'}</EmptyState>
      )}
    </div>
  );
}

function TodayRow({ employee: e }) {
  const sub = [e.employeeCode, e.designation || e.department].filter(Boolean).join(' · ');
  return (
    <div className="urow">
      <div className="uav" style={e.status === 'not_checked_in' ? { background: 'var(--g300)' } : undefined}>{initials(e.name)}</div>
      <div className="uinfo">
        <div className="uname">{e.name}</div>
        <div className="uemail">{sub}</div>
      </div>
      <div className="dash-times">
        {e.checkIn ? (
          <>
            <div>
              <b>{fmtTime(e.checkIn)}</b> → {e.checkOut ? <b>{fmtTime(e.checkOut)}</b> : <span className="dash-live">working</span>}
            </div>
            <div className="dash-muted">
              {e.checkOut ? fmtHours(e.workingHours) : ''}
              {e.isLate ? <span className="dash-flag late">Late {e.lateMinutes}m</span> : null}
              {e.isEarlyLeave ? <span className="dash-flag">Left early {e.earlyLeaveMinutes}m</span> : null}
            </div>
          </>
        ) : e.status === 'on_leave' && e.leaveType ? (
          <div className="dash-muted">{e.leaveType}</div>
        ) : null}
      </div>
      <AttendanceStatusPill status={e.status} />
    </div>
  );
}

const whenLabel = (days) => (days === 1 ? 'Tomorrow' : `In ${days} days`);

function CelebrationCard({ title, items, empty, todayLabel, detail }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-label">{title}</div>
      {items?.length ? (
        <div className="dash-celebs">
          {items.map((c) => {
            const sub = [c.employeeCode, c.designation || c.department].filter(Boolean).join(' · ');
            return (
              <div className="urow" key={c._id}>
                <div className={`uav ${c.daysUntil === 0 ? 'dash-celeb-today' : ''}`}>{initials(c.name)}</div>
                <div className="uinfo">
                  <div className="uname">{c.name}</div>
                  <div className="uemail">{sub}</div>
                </div>
                <div className="dash-times">
                  <div><b>{fmtDayMonth(c.date).dd} {fmtDayMonth(c.date).mo}</b></div>
                  <div className="dash-muted">
                    {detail ? `${detail(c)} · ` : ''}
                    {c.daysUntil === 0 ? <span className="dash-flag late">{todayLabel}</span> : whenLabel(c.daysUntil)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState>{empty}</EmptyState>
      )}
    </div>
  );
}

function DepartmentBars({ departments }) {
  if (!departments.length) return <div className="chart-empty">No department data yet</div>;
  return (
    <div className="dash-depts">
      {departments.map((d) => {
        const pct = d.total ? Math.round((d.present / d.total) * 100) : 0;
        return (
          <div key={d.department} className="dash-dept">
            <div className="dash-dept-top">
              <span>{d.department}</span>
              <span className="dash-muted">{d.present}/{d.total} · {pct}%</span>
            </div>
            <div className="dash-bar"><div style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}
