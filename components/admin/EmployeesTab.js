'use client';

import { useState } from 'react';
import { useGetUsersQuery, useRejoinEmployeeMutation } from '@/lib/services/usersApi';
import { useGetSalaryStructureQuery } from '@/lib/services/payrollApi';
import { normalizeUser, normalizeSalaryStructure } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage, useAppSelector } from '@/lib/hooks';
import { selectIsSuperAdmin } from '@/lib/features/authSlice';
import EmployeeRow from './EmployeeRow';
import EmployeeModal from './EmployeeModal';
import BulkSalaryModal from './BulkSalaryModal';
import MarkLeftModal from './MarkLeftModal';
import ExitSummaryModal from './ExitSummary';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';
import SalaryStructureModal from '../payroll/SalaryStructureModal';
import CompanyHierarchySelector from './CompanyHierarchySelector';
import OfficeAssignmentModal from './OfficeAssignmentModal';
import { useGetMyGeoPermissionsQuery } from '@/lib/services/geoApi';

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
  // Employees who have left are only deactivated, never erased - they drop
  // out of salary/payroll/attendance from the month after their leaving
  // date, but stay reachable here under "Left" so they can be brought back.
  const [statusFilter, setStatusFilter] = useState('active');
  const { data, isLoading } = useGetUsersQuery({
    page: 1,
    limit: 200,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    companyId: isSuperAdmin ? scope.companyId || undefined : undefined,
    subCompanyId: isSuperAdmin ? scope.subCompanyId || undefined : undefined,
  });

  const [rejoinEmployee, { isLoading: rejoining }] = useRejoinEmployeeMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [leavingEmployee, setLeavingEmployee] = useState(null);
  const [exitEmployee, setExitEmployee] = useState(null);
  const [newEmployeeForSalary, setNewEmployeeForSalary] = useState(null);
  const [officeEmployee, setOfficeEmployee] = useState(null);
  const { data: geoPerms } = useGetMyGeoPermissionsQuery();

  const { items } = unwrapList(data);
  const users = items.map(normalizeUser);
  const employees = users.filter((u) => u.role === 'employee' && u.isActive !== false);


  async function handleRejoin(user) {
    try {
      await rejoinEmployee(user.id).unwrap();
      toast('Employee is active again');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not reactivate employee.'), 'err');
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
        <select
          className="fi"
          style={{ width: 'auto', fontSize: 12, padding: '7px 10px', marginLeft: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="left">Left</option>
          <option value="all">All</option>
        </select>
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
              onMarkLeft={setLeavingEmployee}
              onRejoin={handleRejoin}
              onViewExit={setExitEmployee}
              onOffices={geoPerms?.canManageAssignments ? setOfficeEmployee : undefined}
              isBusy={rejoining}
            />
          ))
        ) : (
          <EmptyState>{statusFilter === 'left' ? 'No employees have left' : 'No employees yet'}</EmptyState>
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
      <MarkLeftModal employee={leavingEmployee} onClose={() => setLeavingEmployee(null)} />
      <ExitSummaryModal employee={exitEmployee} onClose={() => setExitEmployee(null)} />
      <OfficeAssignmentModal
        employee={officeEmployee}
        companyId={isSuperAdmin ? scope.companyId || undefined : undefined}
        onClose={() => setOfficeEmployee(null)}
      />
    </div>
  );
}
