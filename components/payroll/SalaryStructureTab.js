'use client';

import { useMemo, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetSalaryStructuresQuery, useGeneratePayrollMutation } from '@/lib/services/payrollApi';
import { normalizeUser, normalizeSalaryStructure } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage, useAppSelector } from '@/lib/hooks';
import { selectIsSuperAdmin } from '@/lib/features/authSlice';
import SalaryStructureRow from './SalaryStructureRow';
import SalaryStructureModal from './SalaryStructureModal';
import SalaryStructureViewModal from './SalaryStructureViewModal';
import SalaryHistoryModal from './SalaryHistoryModal';
import CompanyHierarchySelector from '../admin/CompanyHierarchySelector';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function SalaryStructureTab() {
  const isSuperAdmin = useAppSelector(selectIsSuperAdmin);
  const now = new Date();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [scope, setScope] = useState({ companyId: '', subCompanyId: '' });

  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

  const scopeParams = isSuperAdmin
    ? { companyId: scope.companyId || undefined, subCompanyId: scope.subCompanyId || undefined }
    : {};
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee', ...scopeParams });
  const { data: structuresData, isLoading: structuresLoading } = useGetSalaryStructuresQuery(scopeParams);
  const [generatePayroll] = useGeneratePayrollMutation();
  const toast = useToast();

  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const { items: structureItems } = unwrapList(structuresData);
  const structures = structureItems.map(normalizeSalaryStructure);

  function structureFor(userId) {
    return structures.find((s) => s.userId === userId);
  }

  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);
  const designations = useMemo(() => [...new Set(employees.map((e) => e.designation).filter(Boolean))], [employees]);

  const filtered = employees.filter((e) => {
    const structure = structureFor(e.id);
    if (search && !`${e.name} ${e.employeeCode}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (department && e.department !== department) return false;
    if (designation && e.designation !== designation) return false;
    if (status === 'active' && !structure) return false;
    if (status === 'unset' && structure) return false;
    const salary = structure?.grossSalary ?? e.baseSalary ?? 0;
    if (minSalary && salary < Number(minSalary)) return false;
    if (maxSalary && salary > Number(maxSalary)) return false;
    return true;
  });

  async function handleGenerate(employee) {
    setGeneratingId(employee.id);
    try {
      await generatePayroll({ scope: 'single', userId: employee.id, month: now.getMonth() + 1, year: now.getFullYear() }).unwrap();
      toast(`Salary generated for ${employee.name}`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not generate salary.'), 'err');
    } finally {
      setGeneratingId(null);
    }
  }

  const isLoading = usersLoading || structuresLoading;

  return (
    <div className="fade-in">
      <div className="filters-bar">
        {isSuperAdmin ? <CompanyHierarchySelector value={scope} onChange={setScope} /> : null}
        <input className="fi" style={{ flex: 1, minWidth: 160 }} placeholder="Search employee or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="fi" value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="fi" value={designation} onChange={(e) => setDesignation(e.target.value)}>
          <option value="">All designations</option>
          {designations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="fi" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Structure set</option>
          <option value="unset">Not configured</option>
        </select>
        <input className="fi" type="number" style={{ width: 100 }} placeholder="Min ₹" value={minSalary} onChange={(e) => setMinSalary(e.target.value)} />
        <input className="fi" type="number" style={{ width: 100 }} placeholder="Max ₹" value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} />
      </div>

      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : filtered.length ? (
          filtered.map((employee) => (
            <SalaryStructureRow
              key={employee.id}
              employee={employee}
              structure={structureFor(employee.id)}
              isBusy={generatingId === employee.id}
              onView={(emp, structure) => setViewTarget({ employee: emp, structure })}
              onEdit={(emp, structure) => setEditTarget({ employee: emp, structure })}
              onHistory={(emp) => setHistoryTarget(emp)}
              onGenerate={handleGenerate}
            />
          ))
        ) : (
          <EmptyState>No employees match these filters</EmptyState>
        )}
      </div>

      <SalaryStructureViewModal
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        employee={viewTarget?.employee}
        structure={viewTarget?.structure}
      />
      <SalaryStructureModal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        employee={editTarget?.employee}
        structure={editTarget?.structure}
      />
      <SalaryHistoryModal open={Boolean(historyTarget)} onClose={() => setHistoryTarget(null)} employee={historyTarget} />
    </div>
  );
}
