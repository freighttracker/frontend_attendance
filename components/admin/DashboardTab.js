'use client';

import { useMemo, useState } from 'react';
import { useGetAdminDashboardQuery } from '@/lib/services/dashboardApi';
import { useGetAttendanceLocationsQuery, useGetMyGeoPermissionsQuery } from '@/lib/services/geoApi';
import { fmtDate, fmtDateLong, fmtDayMonth, fmtTime, initials, pad } from '@/lib/utils/format';
import { fmtAccuracy, fmtDistance } from '@/lib/utils/geolocation';
import LocationBadge from '../geo/LocationBadge';
import LocationDetailModal from './LocationDetailModal';
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
  { key: 'review', label: 'In review', match: (e) => e.locationReview === 'pending', needsLocations: true },
];

// "Office · 35 m · ±13 m" for one punch; empty when nothing was recorded.
const locationLine = (loc) =>
  loc
    ? [loc.officeName, loc.distanceMeters != null ? fmtDistance(loc.distanceMeters) : null, loc.accuracy ? fmtAccuracy(loc.accuracy) : null]
        .filter(Boolean)
        .join(' · ')
    : '';

// Today's location outcome per employee, worst punch first. Order here is
// also the chip order on the monitoring card.
const LOCATION_BUCKETS = [
  { key: 'review', label: 'In review', tone: 'warn' },
  { key: 'outside_geofence', label: 'Outside geofence', tone: 'bad' },
  { key: 'low_accuracy', label: 'Low GPS accuracy', tone: 'warn' },
  { key: 'no_office', label: 'No office assigned', tone: 'muted' },
  { key: 'no_location', label: 'No location', tone: 'muted' },
  { key: 'rejected', label: 'Rejected', tone: 'bad' },
  { key: 'approved', label: 'Exception approved', tone: 'ok' },
  { key: 'inside', label: 'Inside geofence', tone: 'ok' },
];
const CLEAN_BUCKETS = ['inside', 'approved'];

function locationBucket(e) {
  if (!e.checkInLocation && !e.checkOutLocation) return null;
  if (e.locationReview === 'pending') return 'review';
  if (e.locationReview === 'rejected') return 'rejected';
  if (e.locationReview === 'approved') return 'approved';
  const bad = [e.checkInLocation, e.checkOutLocation].find((l) => l && !['valid', 'not_required'].includes(l.validationStatus));
  return bad ? bad.validationStatus : 'inside';
}

const fmtHours = (h) => {
  const mins = Math.round((Number(h) || 0) * 60);
  return mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '—';
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toPunchLocation = (p) =>
  p?.validationStatus
    ? {
        officeName: p.officeName || p.office?.name || null,
        distanceMeters: p.distanceMeters ?? null,
        accuracy: p.accuracy ?? null,
        validationStatus: p.validationStatus,
        reviewStatus: p.reviewStatus || null,
      }
    : null;

const rowReview = (rec) => {
  const states = [rec.checkIn?.reviewStatus, rec.checkOut?.reviewStatus];
  return ['pending', 'rejected', 'approved'].find((s) => states.includes(s)) || null;
};

// Location data for the board. A backend that already sends it on the
// dashboard response wins; otherwise it's filled from the Attendance
// locations API (same permission check), so this also works against a
// server that predates the dashboard location fields.
function useDashboardLocations(data) {
  const { data: perms } = useGetMyGeoPermissionsQuery();
  const backendHasIt = data?.canViewLocations !== undefined;
  const canView = backendHasIt ? Boolean(data.canViewLocations) : Boolean(perms?.canViewLocations);
  const canReview = backendHasIt ? Boolean(data.canReviewExceptions) : Boolean(perms?.canReviewExceptions);
  const skip = !data || backendHasIt || !canView;
  const day = todayIso();
  const poll = { pollingInterval: POLL_MS, skip };

  const { data: today } = useGetAttendanceLocationsQuery({ startDate: day, endDate: day, page: 1, limit: 200 }, poll);
  const { data: pendingAll } = useGetAttendanceLocationsQuery({ reviewStatus: 'pending', startDate: '2000-01-01', endDate: day, page: 1, limit: 1 }, poll);

  const employees = useMemo(() => {
    const list = data?.employees || [];
    if (backendHasIt || !canView || !today?.items) return list;
    const byUser = new Map(today.items.map((rec) => [String(rec.user?._id || rec.user), rec]));
    return list.map((e) => {
      const rec = byUser.get(String(e._id));
      if (!rec) return e;
      return {
        ...e,
        recordId: rec._id,
        checkInLocation: toPunchLocation(rec.checkIn),
        checkOutLocation: toPunchLocation(rec.checkOut),
        locationReview: rowReview(rec),
      };
    });
  }, [data, backendHasIt, canView, today]);

  const pendingReviews = backendHasIt ? data?.pending?.locationReviews : pendingAll?.pagination?.total ?? 0;
  return { employees, canView, canReview, pendingReviews };
}

export default function DashboardTab({ onNavigate }) {
  const { data, isLoading, isFetching, isError, refetch, fulfilledTimeStamp } = useGetAdminDashboardQuery(undefined, {
    pollingInterval: POLL_MS,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const [openRecordId, setOpenRecordId] = useState(null);
  const loc = useDashboardLocations(data);

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
        {loc.canView ? (
          <ActionButton icon={CheckSquareIcon} label="Location reviews" count={loc.pendingReviews} onClick={() => onNavigate?.('attendanceLocations')} />
        ) : null}
        {/* <ActionButton icon={ClockIcon} label="Overtime" count={pending.overtime} onClick={() => onNavigate?.('overtime')} /> */}
        <ActionButton icon={UserIcon} label="Employees" onClick={() => onNavigate?.('employees')} />
        <ActionButton icon={BriefcaseIcon} label="Attendance calendar" onClick={() => onNavigate?.('attendanceCalendar')} />
      </div>

      {loc.canView ? (
        <LocationMonitor
          employees={loc.employees}
          onOpen={setOpenRecordId}
          onViewAll={() => onNavigate?.('attendanceLocations')}
        />
      ) : null}

      <TodayAttendance employees={loc.employees} showLocations={loc.canView} onOpen={setOpenRecordId} />

      {loc.canView ? (
        <LocationDetailModal
          recordId={openRecordId}
          canReview={loc.canReview}
          onClose={() => setOpenRecordId(null)}
        />
      ) : null}

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

// Today's location results at a glance, with the check-ins that need a
// decision listed underneath so they can be reviewed without leaving.
function LocationMonitor({ employees, onOpen, onViewAll }) {
  const [bucket, setBucket] = useState('attention');

  const withBucket = useMemo(
    () => employees.map((e) => ({ e, b: locationBucket(e) })).filter((x) => x.b),
    [employees]
  );
  const counts = useMemo(() => {
    const c = {};
    withBucket.forEach(({ b }) => { c[b] = (c[b] || 0) + 1; });
    return c;
  }, [withBucket]);
  const attentionCount = withBucket.filter(({ b }) => !CLEAN_BUCKETS.includes(b)).length;

  const order = Object.fromEntries(LOCATION_BUCKETS.map((b, i) => [b.key, i]));
  const rows = withBucket
    .filter(({ b }) => (bucket === 'attention' ? !CLEAN_BUCKETS.includes(b) : b === bucket))
    .sort((x, y) => order[x.b] - order[y.b]);

  return (
    <div className="card">
      <div className="sec-h">
        <div className="sec-t">Location monitoring</div>
        <button className="btn btn-g btn-sm" onClick={onViewAll}>Open locations ›</button>
      </div>

      <div className="dash-filters">
        <button className={`dash-chip ${bucket === 'attention' ? 'on' : ''}`} onClick={() => setBucket('attention')}>
          Needs attention <span>{attentionCount}</span>
        </button>
        {LOCATION_BUCKETS.filter((b) => counts[b.key] || b.key === 'review' || b.key === 'inside').map((b) => (
          <button key={b.key} className={`dash-chip ${bucket === b.key ? 'on' : ''}`} onClick={() => setBucket(b.key)}>
            <i className={`dash-dot g-${b.tone}`} />{b.label} <span>{counts[b.key] || 0}</span>
          </button>
        ))}
      </div>

      {rows.length ? (
        rows.map(({ e, b }) => {
          const meta = LOCATION_BUCKETS.find((x) => x.key === b);
          const inLine = locationLine(e.checkInLocation);
          return (
            <div key={e._id} className="urow click" onClick={() => e.recordId && onOpen(e.recordId)}>
              <div className="uav">{initials(e.name)}</div>
              <div className="uinfo">
                <div className="uname">{e.name}</div>
                <div className="uemail">{[e.employeeCode, e.department].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="dash-times">
                <div><b>{fmtTime(e.checkIn)}</b>{e.checkOut ? <> → <b>{fmtTime(e.checkOut)}</b></> : null}</div>
                {inLine ? <div className="dash-muted">{inLine}</div> : null}
              </div>
              <div className="dash-pills">
                <span className={`gpill g-${meta.tone}`}>{meta.label}</span>
                {b === 'review' ? <span className="dash-muted">Click to review</span> : null}
              </div>
            </div>
          );
        })
      ) : (
        <EmptyState>
          {bucket === 'attention' ? 'All of today’s check-ins are inside their office geofence' : 'No check-ins in this group today'}
        </EmptyState>
      )}
    </div>
  );
}

function TodayAttendance({ employees, showLocations, onOpen }) {
  const filters = showLocations ? FILTERS : FILTERS.filter((f) => !f.needsLocations);
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
        {filters.map((f) => (
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
        rows.map((e) => <TodayRow key={e._id} employee={e} onOpen={onOpen} />)
      ) : (
        <EmptyState>{employees.length ? 'No employees match these filters' : 'No active employees yet'}</EmptyState>
      )}
    </div>
  );
}

function TodayRow({ employee: e, onOpen }) {
  const sub = [e.employeeCode, e.designation || e.department].filter(Boolean).join(' · ');
  const inLine = locationLine(e.checkInLocation);
  const outLine = locationLine(e.checkOutLocation);
  const canOpen = Boolean(onOpen && e.recordId);
  return (
    <div className={`urow ${canOpen ? 'click' : ''}`} onClick={canOpen ? () => onOpen(e.recordId) : undefined}>
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
            {inLine ? <div className="dash-muted">In: {inLine}</div> : null}
            {outLine ? <div className="dash-muted">Out: {outLine}</div> : null}
          </>
        ) : e.status === 'on_leave' && e.leaveType ? (
          <div className="dash-muted">{e.leaveType}</div>
        ) : null}
      </div>
      <div className="dash-pills">
        <AttendanceStatusPill status={e.status} />
        <RowLocationPill employee={e} />
      </div>
    </div>
  );
}

// Pending review reads as "In review"; otherwise only flag punches that
// weren't a clean in-geofence check-in, so normal rows stay quiet.
function RowLocationPill({ employee: e }) {
  if (e.locationReview === 'pending') return <span className="gpill g-warn">In review</span>;
  const flagged = [e.checkInLocation, e.checkOutLocation].find(
    (l) => l && (l.reviewStatus === 'rejected' || l.reviewStatus === 'approved' || !['valid', 'not_required'].includes(l.validationStatus))
  );
  return flagged ? <LocationBadge validationStatus={flagged.validationStatus} reviewStatus={flagged.reviewStatus} /> : null;
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
