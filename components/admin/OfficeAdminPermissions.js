'use client';

import { useState } from 'react';
import {
  useGetAdminGeoPermissionsQuery,
  useSetAdminGeoPermissionMutation,
  useResetAdminGeoPermissionMutation,
  useGetOfficeLocationsQuery,
} from '@/lib/services/geoApi';
import { useToast, extractErrorMessage, useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/authSlice';
import { titleCase } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const FLAGS = [
  { key: 'canManageOffices', label: 'Manage offices & policy' },
  { key: 'canManageAssignments', label: 'Assign offices to employees' },
  { key: 'canViewLocations', label: 'View check-in/out locations' },
  { key: 'canReviewExceptions', label: 'Approve/reject location exceptions' },
];

function PermissionForm({ entry, offices, onClose }) {
  const [savePermission, { isLoading: saving }] = useSetAdminGeoPermissionMutation();
  const [resetPermission, { isLoading: resetting }] = useResetAdminGeoPermissionMutation();
  const toast = useToast();
  const [flags, setFlags] = useState(() => Object.fromEntries(FLAGS.map((f) => [f.key, Boolean(entry[f.key])])));
  const [officeIds, setOfficeIds] = useState(() => (entry.offices || []).map((o) => o._id || o));
  const [error, setError] = useState('');

  const toggleOffice = (id) => setOfficeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  async function handleSave() {
    try {
      await savePermission({ userId: entry.admin._id, ...flags, offices: officeIds }).unwrap();
      toast('Permissions saved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save permissions.'));
    }
  }

  async function handleReset() {
    try {
      await resetPermission(entry.admin._id).unwrap();
      toast('Reset to role defaults');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not reset permissions.'));
    }
  }

  return (
    <>
      {FLAGS.map((f) => (
        <label key={f.key} className="chk" style={{ marginBottom: 8 }}>
          <input type="checkbox" checked={flags[f.key]} onChange={(e) => setFlags((s) => ({ ...s, [f.key]: e.target.checked }))} />
          {f.label}
        </label>
      ))}
      <div className="fl" style={{ marginTop: 12 }}>Limit to offices (none selected = all offices in scope)</div>
      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
        {offices.length ? (
          offices.map((o) => (
            <label key={o._id} className="chk" style={{ marginBottom: 6 }}>
              <input type="checkbox" checked={officeIds.includes(o._id)} onChange={() => toggleOffice(o._id)} />
              {o.name}{o.isActive ? '' : ' (inactive)'}
            </label>
          ))
        ) : (
          <EmptyState>No offices yet</EmptyState>
        )}
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        {entry.isCustom ? (
          <button className="btn btn-g" style={{ flex: 1 }} disabled={resetting} onClick={handleReset}>
            Reset to defaults
          </button>
        ) : (
          <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
        )}
        <button className="btn btn-p" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  );
}

// Lets a superadmin / company admin narrow what other admins may do in the
// location module (and to which offices). Enforced server-side.
export default function OfficeAdminPermissions({ companyId }) {
  const me = useAppSelector(selectCurrentUser);
  const { data, isLoading, isError } = useGetAdminGeoPermissionsQuery({ companyId: companyId || undefined });
  const { data: officeData } = useGetOfficeLocationsQuery({ limit: 200, companyId: companyId || undefined });
  const [editing, setEditing] = useState(null);

  const entries = (data || []).filter((e) => e.admin._id !== (me?.id || me?._id));
  const offices = officeData?.items || [];
  // A company admin may only configure subcompany admins (server enforces this too).
  const canEditEntry = (e) => me?.role !== 'company_admin' || e.admin.role === 'subcompany_admin';

  return (
    <div className="card">
      <div className="card-label">Office admin permissions</div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState>Could not load admin permissions.</EmptyState>
      ) : entries.length ? (
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                {FLAGS.map((f) => <th key={f.key}>{f.label.split(' ')[0]}</th>)}
                <th>Offices</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.admin._id}>
                  <td className="wrap">
                    <b>{`${e.admin.firstName || ''} ${e.admin.lastName || ''}`.trim()}</b>
                    <div className="geo-sub">{e.admin.email}</div>
                  </td>
                  <td>{titleCase(e.admin.role)}{e.isCustom ? ' · custom' : ''}</td>
                  {FLAGS.map((f) => <td key={f.key}>{e[f.key] ? '✓' : '—'}</td>)}
                  <td className="wrap">{e.offices?.length ? e.offices.map((o) => o.name || o).join(', ') : 'All'}</td>
                  <td>
                    {canEditEntry(e) ? (
                      <button className="btn btn-g btn-sm" onClick={() => setEditing(e)}>Edit</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No other admins in this scope</EmptyState>
      )}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Location Permissions"
        subtitle={editing ? `${editing.admin.firstName || ''} ${editing.admin.lastName || ''} · ${titleCase(editing.admin.role)}` : ''}
      >
        {editing ? <PermissionForm key={editing.admin._id} entry={editing} offices={offices} onClose={() => setEditing(null)} /> : null}
      </Modal>
    </div>
  );
}
