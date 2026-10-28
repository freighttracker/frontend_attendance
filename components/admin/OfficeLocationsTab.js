'use client';

import { useState } from 'react';
import {
  useGetOfficeLocationsQuery,
  useSetOfficeLocationStatusMutation,
  useGetMyGeoPermissionsQuery,
  useGetGeoPolicyQuery,
} from '@/lib/services/geoApi';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtCoords } from '@/lib/utils/geolocation';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import GeoPolicyCard from './GeoPolicyCard';
import OfficeModal from './OfficeModal';
import OfficeAssignmentModal from './OfficeAssignmentModal';
import OfficeAdminPermissions from './OfficeAdminPermissions';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import LocationMap, { MAP_COLORS } from '../geo/LocationMap';
import { EditIcon } from '../icons';

function EmployeeAssignmentPicker({ companyId, onPick }) {
  const [search, setSearch] = useState('');
  const { data, isFetching } = useGetUsersQuery({ page: 1, limit: 50, isActive: true, search: search.trim() || undefined, companyId: companyId || undefined });
  const users = unwrapList(data).items.map(normalizeUser).filter((u) => u.role === 'employee' || u.role === 'manager');
  const [selected, setSelected] = useState('');

  return (
    <div className="card">
      <div className="card-label">Employee office assignments</div>
      <div className="frow" style={{ alignItems: 'center' }}>
        <input className="fi" placeholder="Search employee by name, email or code" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="fi" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">{isFetching ? 'Loading…' : `Select employee (${users.length})`}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}{u.employeeCode ? ` · ${u.employeeCode}` : ''}</option>
          ))}
        </select>
        <button className="btn btn-p btn-sm" disabled={!selected} onClick={() => onPick(users.find((u) => u.id === selected))}>
          Manage
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 6 }}>Also available from each employee in the Employees tab.</div>
    </div>
  );
}

// companyId: only passed for a superadmin (who picks a company); everyone
// else is pinned to their own company server-side.
export default function OfficeLocationsTab({ companyId, isPlatformAdmin = false }) {
  const { data: perms } = useGetMyGeoPermissionsQuery();
  const { data: policy } = useGetGeoPolicyQuery({ companyId: companyId || undefined });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('list');
  const { data, isLoading, isError, error } = useGetOfficeLocationsQuery({
    limit: 200,
    isActive: statusFilter || undefined,
    search: search.trim() || undefined,
    companyId: companyId || undefined,
  });
  const [setStatus, { isLoading: togglingStatus }] = useSetOfficeLocationStatusMutation();
  const toast = useToast();

  const [editing, setEditing] = useState(null); // office object, or 'new'
  const [statusTarget, setStatusTarget] = useState(null);
  const [assigning, setAssigning] = useState(null);

  const offices = data?.items || [];
  const canManage = Boolean(perms?.canManageOffices);
  const needsCompany = isPlatformAdmin && !companyId;

  async function handleToggleStatus() {
    try {
      await setStatus({ id: statusTarget._id, isActive: !statusTarget.isActive }).unwrap();
      toast(statusTarget.isActive ? 'Office deactivated' : 'Office activated');
      setStatusTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not change status.'), 'err');
    }
  }

  return (
    <div>
      <GeoPolicyCard companyId={companyId} canEdit={canManage && (perms?.canManagePermissions || false)} isPlatform={isPlatformAdmin && !companyId} />

      <div className="frow" style={{ alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <input className="fi" style={{ maxWidth: 240, fontSize: 12, padding: '9px 11px' }} placeholder="Search offices" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="fi" style={{ maxWidth: 150, fontSize: 12, padding: '9px 11px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <div className="atabs" style={{ maxWidth: 180, margin: 0 }}>
          <button className={`atab ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')}>Table</button>
          <button className={`atab ${view === 'map' ? 'on' : ''}`} onClick={() => setView('map')}>Map</button>
        </div>
        {canManage ? (
          <button
            className="btn btn-p btn-sm"
            disabled={needsCompany}
            title={needsCompany ? 'Select a company first' : undefined}
            onClick={() => setEditing('new')}
          >
            + Add office
          </button>
        ) : null}
      </div>
      {needsCompany && canManage ? (
        <div style={{ fontSize: 11, color: 'var(--g400)', marginBottom: 8 }}>Select a company above to add offices for it.</div>
      ) : null}

      <div className="card">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <EmptyState>{extractErrorMessage(error, 'Could not load offices.')}</EmptyState>
        ) : !offices.length ? (
          <EmptyState>No office locations yet{canManage ? ' - add your first office.' : ''}</EmptyState>
        ) : view === 'map' ? (
          <LocationMap
            height={380}
            circles={offices.map((o) => ({
              id: o._id,
              latitude: o.latitude,
              longitude: o.longitude,
              radiusMeters: o.radiusMeters,
              color: o.isActive ? MAP_COLORS.office : MAP_COLORS.officeInactive,
              label: [o.name, o.address, `Radius ${o.radiusMeters} m · ${o.assignedCount || 0} staff${o.isActive ? '' : ' · inactive'}`],
            }))}
          />
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Office</th>
                  <th>Address</th>
                  <th>Coordinates</th>
                  <th>Radius</th>
                  <th>Max acc.</th>
                  <th>Accepts</th>
                  <th>Staff</th>
                  <th>Status</th>
                  {isPlatformAdmin ? <th>Company</th> : null}
                  {canManage ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {offices.map((o) => (
                  <tr key={o._id}>
                    <td className="wrap">
                      <b>{o.name}</b>
                      {o.code ? <div className="geo-sub">{o.code}</div> : null}
                    </td>
                    <td className="wrap">{o.address}</td>
                    <td>{fmtCoords(o.latitude, o.longitude)}</td>
                    <td>{o.radiusMeters} m</td>
                    <td>{o.maxAccuracyMeters ? `${o.maxAccuracyMeters} m` : `Policy (${policy?.maxAccuracyMeters ?? '—'} m)`}</td>
                    <td>{[o.allowCheckIn !== false ? 'In' : null, o.allowCheckOut !== false ? 'Out' : null].filter(Boolean).join(' / ') || '—'}</td>
                    <td>{o.assignedCount || 0}</td>
                    <td>
                      <span className={`chip ${o.isActive ? 'chip-active' : 'chip-closed'}`}>{o.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    {isPlatformAdmin ? <td>{o.company?.name || '—'}</td> : null}
                    {canManage ? (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="ib" title="Edit" onClick={() => setEditing(o)}>
                            <EditIcon />
                          </button>
                          <button className="btn btn-g btn-sm" onClick={() => setStatusTarget(o)}>
                            {o.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {perms?.canManageAssignments ? <EmployeeAssignmentPicker companyId={companyId} onPick={setAssigning} /> : null}
      {perms?.canManagePermissions ? <OfficeAdminPermissions companyId={companyId} /> : null}

      <OfficeModal
        open={Boolean(editing)}
        office={editing === 'new' ? null : editing}
        defaultRadius={policy?.defaultRadiusMeters}
        companyId={companyId}
        onClose={() => setEditing(null)}
      />
      <OfficeAssignmentModal employee={assigning} companyId={companyId} onClose={() => setAssigning(null)} />
      <ConfirmModal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={togglingStatus}
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        title={statusTarget?.isActive ? 'Deactivate office?' : 'Activate office?'}
        subtitle={
          statusTarget?.isActive ? (
            <>
              <b>{statusTarget?.name}</b> will stop accepting check-in/check-out. Assignments are kept and work again if you reactivate it.
            </>
          ) : (
            <>
              <b>{statusTarget?.name}</b> will accept attendance again for employees assigned to it.
            </>
          )
        }
      />
    </div>
  );
}
