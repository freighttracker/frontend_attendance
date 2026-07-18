'use client';

import { useState } from 'react';
import { useGetUsersQuery, useDeleteEmployeeMutation } from '@/lib/services/usersApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import EmployeeRow from './EmployeeRow';
import EmployeeModal from './EmployeeModal';
import BulkSalaryModal from './BulkSalaryModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function EmployeesTab() {
  const { data, isLoading } = useGetUsersQuery({ page: 1, limit: 200 });
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { items } = unwrapList(data);
  const users = items.map(normalizeUser);
  const employees = users.filter((u) => u.role === 'employee');

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id).unwrap();
      toast('Employee removed');
      setDeleteTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not remove employee.'), 'err');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 7, marginBottom: 11, flexWrap: 'wrap' }}>
        <button
          className="btn btn-p btn-sm"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          + Add employee
        </button>
        <button className="btn btn-g btn-sm" onClick={() => setBulkOpen(true)}>
          Bulk salaries
        </button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : users.length ? (
          users.map((u) => (
            <EmployeeRow
              key={u.id}
              user={u}
              onEdit={(user) => {
                setEditingUser(user);
                setModalOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ))
        ) : (
          <EmptyState>No employees yet</EmptyState>
        )}
      </div>

      <EmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} employee={editingUser} />
      <BulkSalaryModal open={bulkOpen} onClose={() => setBulkOpen(false)} employees={employees} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Remove Employee?"
        subtitle={
          <>
            Permanently deletes <b>{deleteTarget?.name}</b> and all their attendance, leave records. Cannot be undone.
          </>
        }
      />
    </div>
  );
}
