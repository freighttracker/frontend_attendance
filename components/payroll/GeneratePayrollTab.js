'use client';

import { useMemo, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGeneratePayrollMutation, useRegeneratePayrollMutation, useGetSalaryStructuresQuery } from '@/lib/services/payrollApi';
import { normalizeUser, normalizeSalaryStructure } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency, pad } from '@/lib/utils/format';
import GenerateConfirmModal from './GenerateConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function GeneratePayrollTab() {
  // Default to last month - a month still in progress has no way to know its
  // final attendance yet, so generating against it always undercounts absences.
  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [period, setPeriod] = useState(`${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}`);
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [confirmScope, setConfirmScope] = useState(null);
  const [doneCount, setDoneCount] = useState(null);

  const { data: usersData, isLoading } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee', activeFrom: `${period}-01` });
  const { data: structuresData } = useGetSalaryStructuresQuery({ page: 1, limit: 200 });
  const [generatePayroll, { isLoading: generating }] = useGeneratePayrollMutation();
  const [regeneratePayroll, { isLoading: regenerating }] = useRegeneratePayrollMutation();
  const toast = useToast();

  const { items } = unwrapList(usersData);
  const employees = items.map(normalizeUser).filter((u) => u.role === 'employee');

  // Payroll is calculated from the salary structure, not the profile's
  // baseSalary - show the amount payroll will actually use.
  const { items: structureItems } = unwrapList(structuresData);
  const structureByUser = new Map(structureItems.map(normalizeSalaryStructure).map((s) => [String(s.userId), s]));
  const departments = useMemo(() => [...new Set(employees.map((e) => e.department).filter(Boolean))], [employees]);
  const designations = useMemo(() => [...new Set(employees.map((e) => e.designation).filter(Boolean))], [employees]);

  const filtered = employees.filter((e) => (!department || e.department === department) && (!designation || e.designation === designation));
  const allSelected = filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(filtered.map((e) => e.id));
    });
  }

  const [year, month] = period.split('-').map(Number);

  function startConfirm(scope) {
    let count = selected.size;
    if (scope === 'department') count = filtered.length;
    if (scope === 'company') count = employees.length;
    if (count === 0) {
      toast('Select at least one employee', 'err');
      return;
    }
    setDoneCount(null);
    setConfirmScope({ scope, count });
  }

  // Bulk generation answers 201 even when some employees failed (locked,
  // published, no structure...), so surface those instead of reporting success.
  function reportResult(response) {
    const failed = response?.data?.results?.failed || [];
    const succeeded = response?.data?.results ? response.data.results.success.length : 1;
    setDoneCount(succeeded);
    if (failed.length) {
      const names = new Map(employees.map((e) => [String(e.id), e.name]));
      const lines = failed.map((f) => `${names.get(String(f.user)) || f.employeeCode}: ${f.reason}`);
      toast(`${failed.length} failed - ${lines.join('; ')}`, 'err');
    }
    if (succeeded === 0) setConfirmScope(null);
  }

  async function handleConfirm() {
    const scope = confirmScope.scope;
    try {
      if (scope === 'regenerate') {
        reportResult(await regeneratePayroll({ userIds: [...selected], month, year }).unwrap());
        return;
      }
      const body = { month, year };
      if (scope === 'single' || scope === 'multiple') body.userIds = [...selected];
      if (scope === 'department') body.department = department;
      if (scope === 'company') body.company = true;
      reportResult(await generatePayroll({ scope, ...body }).unwrap());
    } catch (err) {
      // A 404 here means the API server is older than this frontend and has no
      // /payroll/regenerate endpoint yet - say so instead of "Route not found".
      if (scope === 'regenerate' && err?.status === 404 && err?.data?.message === 'Route not found') {
        toast('Regenerate is not available on the server yet. Please deploy the latest backend.', 'err');
      } else {
        toast(extractErrorMessage(err, scope === 'regenerate' ? 'Could not regenerate payroll.' : 'Could not generate payroll.'), 'err');
      }
      setConfirmScope(null);
    }
  }

  const scopeLabels = {
    single: 'Generate for 1 employee',
    multiple: `Generate for ${confirmScope?.count} selected employees`,
    department: `Generate for department${department ? ` "${department}"` : ''}`,
    company: 'Generate for entire company',
    regenerate: `Regenerate ${confirmScope?.count} selected with latest salary`,
  };

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <input type="month" className="fi" value={period} onChange={(e) => setPeriod(e.target.value)} />
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
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 11, flexWrap: 'wrap' }}>
        <button className="btn btn-p btn-sm" onClick={() => startConfirm(selected.size === 1 ? 'single' : 'multiple')} disabled={!selected.size}>
          Generate selected ({selected.size})
        </button>
        <button
          className="btn btn-g btn-sm"
          onClick={() => startConfirm('regenerate')}
          disabled={!selected.size}
          title="Recalculate already generated slips using each employee's latest salary structure"
        >
          Regenerate with latest salary ({selected.size})
        </button>
        <button className="btn btn-g btn-sm" onClick={() => startConfirm('department')} disabled={!department}>
          Generate for department
        </button>
        <button className="btn btn-g btn-sm" onClick={() => startConfirm('company')}>
          Generate for entire company
        </button>
      </div>

      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : filtered.length ? (
          <>
            <div className="gen-row" style={{ fontWeight: 800, fontSize: 10, color: 'var(--g400)', textTransform: 'uppercase' }}>
              <input type="checkbox" className="gen-check" checked={allSelected} onChange={toggleAll} />
              <span style={{ flex: 1 }}>Employee</span>
              <span>Salary</span>
            </div>
            {filtered.map((e) => {
              const structure = structureByUser.get(String(e.id));
              const profileDiffers = structure && Number(e.baseSalary) > 0 && Number(e.baseSalary) !== Number(structure.grossSalary);
              return (
                <div className="gen-row" key={e.id}>
                  <input type="checkbox" className="gen-check" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--g400)' }}>{e.department || '—'} · {e.designation || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {structure ? (
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{fmtCurrency(structure.grossSalary)}</div>
                    ) : (
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red, #d33)' }}>No salary structure</div>
                    )}
                    {profileDiffers ? (
                      <div style={{ fontSize: 10, color: 'var(--red, #d33)' }} title="Payroll uses the salary structure. Update it in Salary Structure to change pay.">
                        Profile: {fmtCurrency(e.baseSalary)}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <EmptyState>No employees match these filters</EmptyState>
        )}
      </div>

      <GenerateConfirmModal
        open={Boolean(confirmScope)}
        onClose={() => setConfirmScope(null)}
        count={confirmScope?.count || 0}
        month={month}
        year={year}
        scopeLabel={confirmScope ? scopeLabels[confirmScope.scope] : ''}
        isLoading={generating || regenerating}
        onConfirm={handleConfirm}
        isRegenerate={confirmScope?.scope === 'regenerate'}
        doneCount={doneCount}
      />
    </div>
  );
}
