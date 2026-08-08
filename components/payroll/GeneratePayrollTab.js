'use client';

import { useMemo, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGeneratePayrollMutation } from '@/lib/services/payrollApi';
import { normalizeUser } from '@/lib/utils/normalize';
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

  const { data: usersData, isLoading } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const [generatePayroll, { isLoading: generating }] = useGeneratePayrollMutation();
  const toast = useToast();

  const { items } = unwrapList(usersData);
  const employees = items.map(normalizeUser).filter((u) => u.role === 'employee');
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
    setConfirmScope({ scope, count });
  }

  async function handleConfirm() {
    const scope = confirmScope.scope;
    try {
      const body = { month, year };
      if (scope === 'single' || scope === 'multiple') body.userIds = [...selected];
      if (scope === 'department') body.department = department;
      if (scope === 'company') body.company = true;
      await generatePayroll({ scope, ...body }).unwrap();
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not generate payroll.'), 'err');
      setConfirmScope(null);
    }
  }

  const scopeLabels = {
    single: 'Generate for 1 employee',
    multiple: `Generate for ${confirmScope?.count} selected employees`,
    department: `Generate for department${department ? ` "${department}"` : ''}`,
    company: 'Generate for entire company',
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
            {filtered.map((e) => (
              <div className="gen-row" key={e.id}>
                <input type="checkbox" className="gen-check" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--g400)' }}>{e.department || '—'} · {e.designation || '—'}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{fmtCurrency(e.baseSalary)}</div>
              </div>
            ))}
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
        isLoading={generating}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
