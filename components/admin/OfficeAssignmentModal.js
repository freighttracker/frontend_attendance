'use client';

import { useState } from 'react';
import { useGetOfficeAssignmentsQuery, useGetOfficeLocationsQuery, useSetOfficeAssignmentsMutation } from '@/lib/services/geoApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { pad } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import LocationMap, { MAP_COLORS } from '../geo/LocationMap';
import { TrashIcon } from '../icons';

// Assignment bounds are stored as start/end of day in the business timezone;
// show them as the local calendar date.
function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function AssignmentEditor({ employee, assignments, offices, onClose }) {
  const [saveAssignments, { isLoading }] = useSetOfficeAssignmentsMutation();
  const toast = useToast();
  const [rows, setRows] = useState(() =>
    assignments.map((a) => ({
      officeId: a.office?._id,
      isPrimary: a.isPrimary,
      effectiveFrom: toDateInput(a.effectiveFrom),
      effectiveTo: toDateInput(a.effectiveTo),
    }))
  );
  const [adding, setAdding] = useState('');
  const [error, setError] = useState('');

  const officeById = new Map(offices.map((o) => [o._id, o]));
  // Offices from existing assignments may be inactive (not in the active list).
  assignments.forEach((a) => a.office && !officeById.has(a.office._id) && officeById.set(a.office._id, a.office));
  const available = offices.filter((o) => o.isActive && !rows.some((r) => r.officeId === o._id));

  const update = (index, patch) => setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const setPrimary = (index) => setRows((rs) => rs.map((r, i) => ({ ...r, isPrimary: i === index })));

  function addOffice() {
    if (!adding) return;
    setRows((rs) => [...rs, { officeId: adding, isPrimary: rs.length === 0, effectiveFrom: '', effectiveTo: '' }]);
    setAdding('');
  }

  async function handleSave() {
    const bad = rows.find((r) => r.effectiveFrom && r.effectiveTo && r.effectiveTo < r.effectiveFrom);
    if (bad) {
      setError(`"${officeById.get(bad.officeId)?.name}": the end date is before the start date.`);
      return;
    }
    const hasPrimary = rows.some((r) => r.isPrimary);
    try {
      await saveAssignments({
        userId: employee.id,
        assignments: rows.map((r, i) => ({
          officeId: r.officeId,
          isPrimary: hasPrimary ? r.isPrimary : i === 0,
          effectiveFrom: r.effectiveFrom || null,
          effectiveTo: r.effectiveTo || null,
        })),
      }).unwrap();
      toast('Office assignments saved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save assignments.'));
    }
  }

  const circles = rows
    .map((r) => officeById.get(r.officeId))
    .filter(Boolean)
    .map((o) => ({ id: o._id, latitude: o.latitude, longitude: o.longitude, radiusMeters: o.radiusMeters, color: o.isActive === false ? MAP_COLORS.officeInactive : MAP_COLORS.office, label: [o.name, o.address] }));

  return (
    <>
      {rows.length ? (
        <div className="tw" style={{ marginBottom: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Office</th>
                <th>Primary</th>
                <th>From</th>
                <th>To</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const office = officeById.get(r.officeId);
                return (
                  <tr key={r.officeId}>
                    <td className="wrap">
                      <b>{office?.name || 'Unknown office'}</b>
                      {office?.isActive === false ? <span className="chip chip-rejected" style={{ marginLeft: 6 }}>Inactive</span> : null}
                    </td>
                    <td>
                      <input type="radio" name="primary" checked={r.isPrimary} onChange={() => setPrimary(i)} aria-label="Primary office" />
                    </td>
                    <td>
                      <input className="fi" style={{ padding: '6px 8px', fontSize: 11 }} type="date" value={r.effectiveFrom} onChange={(e) => update(i, { effectiveFrom: e.target.value })} />
                    </td>
                    <td>
                      <input className="fi" style={{ padding: '6px 8px', fontSize: 11 }} type="date" value={r.effectiveTo} onChange={(e) => update(i, { effectiveTo: e.target.value })} />
                    </td>
                    <td>
                      <button className="ib del" title="Remove" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState>No offices assigned - this employee cannot check in while location is enforced.</EmptyState>
      )}

      <div className="frow" style={{ alignItems: 'center', marginBottom: 10 }}>
        <select className="fi" value={adding} onChange={(e) => setAdding(e.target.value)}>
          <option value="">Add an office…</option>
          {available.map((o) => (
            <option key={o._id} value={o._id}>{o.name}{o.code ? ` (${o.code})` : ''}</option>
          ))}
        </select>
        <button className="btn btn-g btn-sm" onClick={addOffice} disabled={!adding}>
          Add
        </button>
      </div>
      <div style={{ fontSize: 10, color: 'var(--g400)', marginBottom: 10 }}>
        Leave dates blank for an open-ended assignment. Removed offices are kept as history, not deleted.
      </div>

      {circles.length ? <LocationMap height={200} circles={circles} /> : null}

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSave}>
          {isLoading ? 'Saving…' : 'Save assignments'}
        </button>
      </div>
    </>
  );
}

function AssignmentLoader({ employee, companyId, onClose }) {
  const { data, isLoading, isError, error } = useGetOfficeAssignmentsQuery({ userId: employee.id });
  const { data: officeData, isLoading: officesLoading } = useGetOfficeLocationsQuery({ isActive: 'true', limit: 200, companyId: companyId || undefined });

  if (isLoading || officesLoading) return <Spinner />;
  if (isError) return <EmptyState>{extractErrorMessage(error, 'Could not load assignments.')}</EmptyState>;
  return <AssignmentEditor employee={employee} assignments={data?.assignments || []} offices={officeData?.items || []} onClose={onClose} />;
}

export default function OfficeAssignmentModal({ employee, companyId, onClose }) {
  return (
    <Modal open={Boolean(employee)} onClose={onClose} title="Office Assignments" subtitle={employee ? `${employee.name}${employee.employeeCode ? ` · ${employee.employeeCode}` : ''}` : ''} wide>
      {employee ? <AssignmentLoader key={employee.id} employee={employee} companyId={companyId} onClose={onClose} /> : null}
    </Modal>
  );
}
