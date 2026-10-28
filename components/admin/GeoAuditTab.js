'use client';

import { useState } from 'react';
import { useGetGeoAuditLogsQuery } from '@/lib/services/geoApi';
import { extractErrorMessage } from '@/lib/hooks';
import { fmtDate, fmtTime, titleCase } from '@/lib/utils/format';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

const ENTITY_TYPES = [
  { value: '', label: 'All changes' },
  { value: 'OfficeLocation', label: 'Office locations' },
  { value: 'EmployeeOfficeAssignment', label: 'Office assignments' },
  { value: 'AttendanceGeoPolicy', label: 'Location policy' },
  { value: 'OfficeAdminPermission', label: 'Admin permissions' },
  { value: 'AttendanceLocation', label: 'Location exception reviews' },
  { value: 'AttendanceRecord', label: 'Attendance corrections' },
];

const fmtValue = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

function ChangeSummary({ oldValues, newValues }) {

  const keys = [...new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})])].slice(0, 8);
  
  if (!keys.length) return <span className="geo-sub">—</span>;
  return (
    <div className="geo-sub" style={{ color: 'var(--g600)' }}>
      {keys.map((k) => (
        <div key={k} style={{ overflowWrap: 'anywhere' }}>
          <b>{k}</b>: {oldValues && k in oldValues ? `${fmtValue(oldValues[k])} → ` : ''}{fmtValue(newValues?.[k])}
        </div>
      ))}
    </div>
  );
}

export default function GeoAuditTab({ companyId }) {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, error } = useGetGeoAuditLogsQuery({ entityType, page, limit: 50, companyId: companyId || undefined });
  const logs = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="frow" style={{ marginBottom: 10 }}>
        <select className="fi" style={{ maxWidth: 260, fontSize: 12, padding: '9px 11px' }} value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
          {ENTITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="card">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <EmptyState>{extractErrorMessage(error, 'Could not load the audit log.')}</EmptyState>
        ) : !logs.length ? (
          <EmptyState>No changes recorded yet</EmptyState>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>By</th>
                  <th>Action</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{fmtDate(log.createdAt)} {fmtTime(log.createdAt)}</td>
                    <td className="wrap">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      {log.user?.role ? <div className="geo-sub">{titleCase(log.user.role)}</div> : null}
                    </td>
                    <td className="wrap">{titleCase(String(log.action).replace(/[._]/g, ' '))}</td>
                    <td className="wrap" style={{ minWidth: 220 }}>
                      <ChangeSummary oldValues={log.oldValues} newValues={log.newValues} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.totalPages > 1 ? (
          <div className="pager">
            <button className="btn btn-g btn-sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="btn btn-g btn-sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>Next ›</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
