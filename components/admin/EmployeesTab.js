'use client';

import { useState } from 'react';
import { useGetUsersQuery, useDeleteEmployeeMutation } from '@/lib/services/usersApi';
import { useGetSalaryStructureQuery } from '@/lib/services/payrollApi';
import { normalizeUser, normalizeSalaryStructure } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage, useAppSelector } from '@/lib/hooks';
import { selectIsSuperAdmin } from '@/lib/features/authSlice';
import EmployeeRow from './EmployeeRow';
import EmployeeModal from './EmployeeModal';
import BulkSalaryModal from './BulkSalaryModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import SalaryStructureModal from '../payroll/SalaryStructureModal';
import CompanyHierarchySelector from './CompanyHierarchySelector';

// After an employee is created, skip the extra "go configure their salary"
// step admins used to have to remember - jump straight into the Salary
// Structure form for the new hire, auto-fetching whatever (if anything)
// already exists for them.
function NewEmployeeSalarySetup({ employee, onClose }) {
  const { data, isLoading } = useGetSalaryStructureQuery(employee.id);

  if (isLoading) {
    return (
      <Modal open onClose={onClose} title="Salary Structure" subtitle={employee.name}>
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--g400)' }}>
          <Spinner />
          <div style={{ marginTop: 12, fontSize: 13 }}>Initializing Salary Structure…</div>
        </div>
      </Modal>
    );
  }

  return <SalaryStructureModal open onClose={onClose} employee={employee} structure={data ? normalizeSalaryStructure(data) : null} />;
}

export default function EmployeesTab() {
  // Only a true superadmin can browse across companies - everyone else
  // (admin/company_admin/subcompany_admin) is pinned server-side to their
  // own company, so the picker would be misleading noise for them.
  const isSuperAdmin = useAppSelector(selectIsSuperAdmin);
  const [scope, setScope] = useState({ companyId: '', subCompanyId: '' });
  const { data, isLoading } = useGetUsersQuery({
    page: 1,
    limit: 200,
    companyId: isSuperAdmin ? scope.companyId || undefined : undefined,
    subCompanyId: isSuperAdmin ? scope.subCompanyId || undefined : undefined,
  });
  
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newEmployeeForSalary, setNewEmployeeForSalary] = useState(null);

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
      {isSuperAdmin ? (
        <div className="filters-bar">
          <CompanyHierarchySelector value={scope} onChange={setScope} />
        </div>
      ) : null}
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

      <EmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editingUser}
        onCreated={(created) => setNewEmployeeForSalary(created)}
      />
      <BulkSalaryModal open={bulkOpen} onClose={() => setBulkOpen(false)} employees={employees} />
      {newEmployeeForSalary ? (
        <NewEmployeeSalarySetup employee={newEmployeeForSalary} onClose={() => setNewEmployeeForSalary(null)} />
      ) : null}
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
