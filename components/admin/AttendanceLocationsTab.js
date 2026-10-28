'use client';

import { useState } from 'react';
import { useGetAttendanceLocationsQuery, useGetOfficeLocationsQuery, useGetMyGeoPermissionsQuery } from '@/lib/services/geoApi';
import { useGetUsersQuery, useGetDepartmentsQuery } from '@/lib/services/usersApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime, pad } from '@/lib/utils/format';
import { fmtAccuracy, fmtDistance, locationTone, VALIDATION_LABELS, REVIEW_LABELS } from '@/lib/utils/geolocation';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { AttendanceStatusPill } from '../ui/StatusPill';
import LocationBadge from '../geo/LocationBadge';
import LocationMap, { MAP_COLORS } from '../geo/LocationMap';
import LocationDetailModal from './LocationDetailModal';

const PAGE_SIZE = 50;

const isoDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function PunchCell({ punch }) {
  if (!punch) return <span className="geo-sub">—</span>;
  const where = punch.office?.name || punch.officeName;
  return (
    <div>
      <div>
        <b>{fmtTime(punch.time)}</b> {where ? `· ${where}` : ''}
      </div>
      <div className="geo-sub" style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {punch.distanceMeters !== undefined ? <span>{fmtDistance(punch.distanceMeters)}</span> : null}
        {punch.accuracy ? <span>{fmtAccuracy(punch.accuracy)}</span> : null}
        <LocationBadge validationStatus={punch.validationStatus} reviewStatus={punch.reviewStatus} />
      </div>
    </div>
  );
}

// Admin monitoring of where employees checked in/out. The API enforces scope
// and the canViewLocations permission; this screen never sees other tenants.
export default function AttendanceLocationsTab({ companyId }) {

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const [filters, setFilters] = useState({
    startDate: isoDay(weekAgo),
    endDate: isoDay(today),
    userId: '',
    department: '',
    officeId: '',
    validationStatus: '',
    reviewStatus: '',
  });

  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [openId, setOpenId] = useState(null);
  
  const { data: perms } = useGetMyGeoPermissionsQuery();

  const { data, isLoading, isFetching, isError, error } = useGetAttendanceLocationsQuery({
    ...filters,
    page,
    limit: PAGE_SIZE,
    companyId: companyId || undefined,
  });
  
  const employees = unwrapList(usersData).items.map(normalizeUser);
  const offices = officeData?.items || [];
  const rows = data?.items || [];
  const pagination = data?.pagination;

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const markers = [];
  rows.forEach((r) => {
    const name = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Employee';
    [['checkIn', 'In', MAP_COLORS.checkIn], ['checkOut', 'Out', MAP_COLORS.checkOut]].forEach(([key, label, color]) => {
      const p = r[key];
      if (typeof p?.latitude !== 'number') return;
      const tone = locationTone(p.validationStatus, p.reviewStatus);
      markers.push({
        id: `${r._id}-${key}`,
        latitude: p.latitude,
        longitude: p.longitude,
        color: tone === 'ok' ? color : MAP_COLORS[tone] || color,
        label: [`${name} · ${label} ${fmtTime(p.time)}`, `${fmtDate(r.date)} · ${p.office?.name || p.officeName || 'No office'} · ${fmtDistance(p.distanceMeters)}`],
        onClick: () => setOpenId(r._id),
      });
    });
  });

  return (
    <div>
      <div className="geo-filters">
        <div className="ff">
          <label className="fl">From</label>
          <input className="fi" type="date" value={filters.startDate} onChange={setFilter('startDate')} />
        </div>
        <div className="ff">
          <label className="fl">To</label>
          <input className="fi" type="date" value={filters.endDate} onChange={setFilter('endDate')} />
        </div>
        <div className="ff">
          <label className="fl">Employee</label>
          <select className="fi" value={filters.userId} onChange={setFilter('userId')}>
            <option value="">All employees</option>
            {employees.map((u) => <option key={u.id} value={u.id}>{u.name}{u.employeeCode ? ` · ${u.employeeCode}` : ''}</option>)}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Department</label>
          <select className="fi" value={filters.department} onChange={setFilter('department')}>
            <option value="">All departments</option>
            {(Array.isArray(departments) ? departments : []).filter(Boolean).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Office</label>
          <select className="fi" value={filters.officeId} onChange={setFilter('officeId')}>
            <option value="">All offices</option>
            {offices.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Location result</label>
          <select className="fi" value={filters.validationStatus} onChange={setFilter('validationStatus')}>
            <option value="">Any</option>
            {Object.entries(VALIDATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="ff">
          <label className="fl">Review</label>
          <select className="fi" value={filters.reviewStatus} onChange={setFilter('reviewStatus')}>
            <option value="">Any</option>
            {Object.entries(REVIEW_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="ff" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div className="atabs" style={{ margin: 0, width: '100%' }}>
            <button className={`atab ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')}>Table</button>       
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <EmptyState>{extractErrorMessage(error, 'Could not load attendance locations.')}</EmptyState>
        ) : !rows.length ? (
          <EmptyState>No check-ins match these filters</EmptyState>
        ) : view === 'map' ? (
          <>
            <LocationMap
              height={420}
              markers={markers}
              circles={offices.filter((o) => o.isActive).map((o) => ({ id: o._id, latitude: o.latitude, longitude: o.longitude, radiusMeters: o.radiusMeters, color: MAP_COLORS.office, label: [o.name, `Radius ${o.radiusMeters} m`] }))}
            />
            <div className="geo-sub" style={{ marginTop: 6 }}>
              Blue = check-in, purple = check-out, amber/red = flagged. Showing this page&apos;s {rows.length} record(s); click a dot for details.
            </div>
          </>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Assigned office</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="click" onClick={() => setOpenId(r._id)}>
                    <td>{fmtDate(r.date)}</td>
                    <td className="wrap">
                      <b>{r.user ? `${r.user.firstName} ${r.user.lastName}` : '—'}</b>
                      <div className="geo-sub">{r.user?.employeeCode}</div>
                    </td>
                    <td>{r.user?.department || '—'}</td>
                    <td>{r.primaryOffice?.name || '—'}</td>
                    <td><PunchCell punch={r.checkIn} /></td>
                    <td><PunchCell punch={r.checkOut} /></td>
                    <td><AttendanceStatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 ? (
          <div className="pager">
            <button className="btn btn-g btn-sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
            <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</span>
            <button className="btn btn-g btn-sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>Next ›</button>
          </div>
        ) : null}
      </div>

      <LocationDetailModal recordId={openId} canReview={Boolean(perms?.canReviewExceptions)} onClose={() => setOpenId(null)} />
    </div>
  );
}
