'use client';

import { useState } from 'react';
import { useUpdateEmployeeMutation } from '@/lib/services/usersApi';
import { useToast } from '@/lib/hooks';
import Modal from '../ui/Modal';

function BulkSalaryForm({ onClose, employees }) {
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();
  const toast = useToast();
  const [values, setValues] = useState(() => {
    const initial = {};
    employees.forEach((u) => {
      initial[u.id] = u.baseSalary ?? 0;
    });
    return initial;
  });
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    for (const id of Object.keys(values)) {
      const val = Number(values[id]);
      if (Number.isNaN(val) || val < 0) {
        setError('All salaries must be valid non-negative numbers.');
        return;
      }
    }
    try {
      await Promise.all(Object.entries(values).map(([id, baseSalary]) => updateEmployee({ id, baseSalary: Number(baseSalary) }).unwrap()));
      toast(`Updated ${Object.keys(values).length} salaries`);
      onClose();
    } catch {
      setError('Some updates failed. Please try again.');
    }
  }

  return (
    <>
      {employees.map((u) => (
        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{u.name}</div>
          <input
            type="number"
            min="0"
            style={{ width: 100, padding: '7px 9px', border: '1.5px solid var(--g200)', borderRadius: 8, fontFamily: 'var(--f)', fontSize: 12 }}
            value={values[u.id] ?? 0}
            onChange={(e) => setValues((v) => ({ ...v, [u.id]: e.target.value }))}
          />
        </div>
      ))}
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Save all'}
        </button>
      </div>
    </>
  );
}

export default function BulkSalaryModal({ open, onClose, employees }) {
  return (
    <Modal open={open} onClose={onClose} title="Bulk Edit Salaries" subtitle="Change any salary then tap Save all.">
      {open ? <BulkSalaryForm onClose={onClose} employees={employees} /> : null}
    </Modal>
  );
}
