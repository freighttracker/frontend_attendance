'use client';

import { useState } from 'react';
import {
  useGetSalaryFieldsQuery,
  useDeleteSalaryFieldMutation,
  useReorderSalaryFieldsMutation,
} from '@/lib/services/salaryFieldsApi';
import { normalizeSalaryField } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import SalaryFieldModal from './SalaryFieldModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { EditIcon, TrashIcon } from '../icons';

const GROUP_LABELS = { earning: 'Earnings', deduction: 'Deductions', other: 'Other' };
const GROUP_ORDER = ['earning', 'deduction', 'other'];

function baseLabel(field, allFields) {
  if (field.inputType !== 'percentage') return null;
  if (!field.calculationBase) return 'Total Salary';
  const ref = allFields.find((f) => f.code === field.calculationBase);
  return ref ? ref.name : field.calculationBase;
}

function FieldGroup({ groupKey, label, fields, allFields, collapsed, onToggle, onEdit, onDelete, onMove, onDrop }) {
  if (!fields.length) return null;
  return (
    <div className="card">
      <button type="button" className="dsf-group-head" onClick={() => onToggle(groupKey)}>
        <span className="card-label" style={{ marginBottom: 0 }}>
          {label} <span style={{ color: 'var(--g400)', fontWeight: 600 }}>({fields.length})</span>
        </span>
        <span className={`dsf-chevron ${collapsed ? '' : 'open'}`}>⌄</span>
      </button>
      {!collapsed
        ? fields.map((field, i) => (
            <div
              className="togrow dsf-draggable"
              key={field.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', field.id);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(fields, e.dataTransfer.getData('text/plain'), field);
              }}
            >
              <span className="dsf-drag-handle" title="Drag to reorder">
                ⠿
              </span>
              <div className="togtxt">
                <div className="tl">
                  {field.name}
                  {field.isRequired ? <span style={{ color: 'var(--red)' }}> *</span> : null}
                  {!field.isActive ? (
                    <span className="chip chip-closed" style={{ marginLeft: 6 }}>
                      inactive
                    </span>
                  ) : null}
                  {!field.isVisible ? (
                    <span className="chip chip-closed" style={{ marginLeft: 6 }}>
                      hidden
                    </span>
                  ) : null}
                </div>
                <div className="ts">
                  {field.code} · {field.inputType}
                  {field.inputType === 'percentage' ? ` · ${field.defaultValue ?? 0}% of ${baseLabel(field, allFields)}` : ''}
                  {!field.isEditable ? ' · read-only' : ''}
                </div>
                {field.description ? <div className="ts">{field.description}</div> : null}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="ib" disabled={i === 0} onClick={() => onMove(fields, field, -1)} title="Move up">
                  ↑
                </button>
                <button className="ib" disabled={i === fields.length - 1} onClick={() => onMove(fields, field, 1)} title="Move down">
                  ↓
                </button>
                <button className="ib" onClick={() => onEdit(field)} title="Edit">
                  <EditIcon />
                </button>
                <button className="ib del" onClick={() => onDelete(field)} title="Delete">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        : null}
    </div>
  );
}

export default function SalaryFieldsTab() {
  const { data, isLoading } = useGetSalaryFieldsQuery({ includeInactive: true });
  const [deleteField, { isLoading: deleting }] = useDeleteSalaryFieldMutation();
  const [reorderFields] = useReorderSalaryFieldsMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');

  const { items } = unwrapList(data);
  const allFields = items.map(normalizeSalaryField).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const term = search.trim().toLowerCase();
  const fields = term ? allFields.filter((f) => f.name.toLowerCase().includes(term) || f.code.toLowerCase().includes(term)) : allFields;

  const groupedFields = GROUP_ORDER.map((key) => ({ key, items: fields.filter((f) => f.group === key) }));

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteField(deleteTarget.id).unwrap();
      toast('Salary field removed');
      setDeleteTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not remove salary field.'), 'err');
    }
  }

  async function handleMove(groupFields, field, direction) {
    const idx = groupFields.findIndex((f) => f.id === field.id);
    const swapWith = groupFields[idx + direction];
    if (!swapWith) return;
    try {
      await reorderFields([
        { id: field.id, sortOrder: swapWith.sortOrder },
        { id: swapWith.id, sortOrder: field.sortOrder },
      ]).unwrap();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not reorder fields.'), 'err');
    }
  }

  async function handleDrop(groupFields, draggedId, targetField) {
    if (!draggedId || draggedId === targetField.id) return;
    const fromIndex = groupFields.findIndex((f) => f.id === draggedId);
    const toIndex = groupFields.findIndex((f) => f.id === targetField.id);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...groupFields];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const order = reordered.map((f, i) => ({ id: f.id, sortOrder: (i + 1) * 10 }));
    try {
      await reorderFields(order).unwrap();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not reorder fields.'), 'err');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 11, flexWrap: 'wrap' }}>
        <button
          className="btn btn-p btn-sm"
          onClick={() => {
            setEditingField(null);
            setModalOpen(true);
          }}
        >
          + Add Custom Field
        </button>
      </div>

      {allFields.length > 6 ? (
        <input
          className="fi"
          style={{ marginBottom: 12 }}
          placeholder="Search salary fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      ) : null}

      {isLoading ? (
        <div className="card">
          <Spinner />
        </div>
      ) : allFields.length ? (
        groupedFields.map((g) => (
          <FieldGroup
            key={g.key}
            groupKey={g.key}
            label={GROUP_LABELS[g.key]}
            fields={g.items}
            allFields={allFields}
            collapsed={Boolean(collapsed[g.key])}
            onToggle={(key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
            onEdit={(f) => {
              setEditingField(f);
              setModalOpen(true);
            }}
            onDelete={setDeleteTarget}
            onMove={handleMove}
            onDrop={handleDrop}
          />
        ))
      ) : (
        <div className="card">
          <EmptyState>No salary fields configured yet. Add one to build the dynamic salary form.</EmptyState>
        </div>
      )}

      <SalaryFieldModal open={modalOpen} onClose={() => setModalOpen(false)} field={editingField} existingFields={allFields} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Remove Salary Field?"
        subtitle={
          <>
            Permanently deletes <b>{deleteTarget?.name}</b>. Existing employee salary values for this field are kept but will no longer be editable here.
          </>
        }
      />
    </div>
  );
}
