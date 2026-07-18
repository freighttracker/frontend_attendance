'use client';

import { useMemo, useState } from 'react';
import { useSaveSalaryStructureMutation, useGetPayrollSettingsQuery } from '@/lib/services/payrollApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency, fmtDate } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import { PlusIcon, TrashIcon, TrendUpIcon } from '../icons';
import { SALARY_COMPONENT_MASTER } from './PayrollSettingsTab';

const EARNING_TYPES = ['Basic', 'HRA', 'Medical', 'Food', 'Internet', 'Conveyance', 'Bonus', 'Special Allowance', 'Custom'];
const DEDUCTION_TYPES = ['PF', 'Professional Tax', 'TDS', 'ESIC', 'Advance', 'Loan', 'Leave Deduction', 'Custom Deduction'];

let uid = 0;
function nextId() {
  uid += 1;
  return `new-${Date.now()}-${uid}`;
}

function componentAmount(component, gross) {
  const value = Number(component.value) || 0;
  return component.calcType === 'percentage' ? (value / 100) * gross : value;
}

function ComponentRow({ component, onChange, onRemove, showToggle }) {
  return (
    <div className="comp-row">
      <input
        className="fi comp-name"
        style={{ fontSize: 12, padding: '8px 10px' }}
        value={component.name}
        onChange={(e) => onChange({ ...component, name: e.target.value })}
      />
      <div className="comp-type">
        <button type="button" className={component.calcType === 'fixed' ? 'on' : ''} onClick={() => onChange({ ...component, calcType: 'fixed' })}>
          Fixed
        </button>
        <button type="button" className={component.calcType === 'percentage' ? 'on' : ''} onClick={() => onChange({ ...component, calcType: 'percentage' })}>
          %
        </button>
      </div>
      <input
        type="number"
        min="0"
        className="fi comp-val"
        style={{ fontSize: 12, padding: '8px 10px' }}
        value={component.value}
        onChange={(e) => onChange({ ...component, value: e.target.value })}
      />
      {showToggle ? (
        <label className="tog comp-toggle">
          <input type="checkbox" checked={component.enabled !== false} onChange={(e) => onChange({ ...component, enabled: e.target.checked })} />
          <span className="tog-sl" />
        </label>
      ) : null}
      <button type="button" className="ib del" onClick={onRemove}>
        <TrashIcon />
      </button>
    </div>
  );
}

function ComponentBuilder({ title, types, components, setComponents, showToggle }) {
  const [pickType, setPickType] = useState(types[0]);

  function addComponent() {
    setComponents((list) => [
      ...list,
      { id: nextId(), name: pickType, type: pickType.toLowerCase().replace(/\s+/g, '_'), calcType: 'fixed', value: 0, enabled: true },
    ]);
  }

  return (
    <div className="ff">
      <label className="fl">{title}</label>
      {components.length ? (
        components.map((c) => (
          <ComponentRow
            key={c.id}
            component={c}
            showToggle={showToggle}
            onChange={(updated) => setComponents((list) => list.map((item) => (item.id === c.id ? updated : item)))}
            onRemove={() => setComponents((list) => list.filter((item) => item.id !== c.id))}
          />
        ))
      ) : (
        <div className="empty" style={{ padding: '10px 0' }}>No components added</div>
      )}
      <div className="comp-add">
        <select className="fi" value={pickType} onChange={(e) => setPickType(e.target.value)}>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="button" className="btn btn-g btn-sm" onClick={addComponent}>
          <PlusIcon style={{ width: 12, height: 12 }} /> Add Component
        </button>
      </div>
    </div>
  );
}

function buildFromFormula(gross, componentDefaults) {
  const source = SALARY_COMPONENT_MASTER.map((c) => ({ ...c, ...(componentDefaults?.[c.key] || {}) })).filter((c) => c.enabled !== false);
  const toComponents = (group) =>
    source
      .filter((c) => c.group === group)
      .map((c) => ({ id: nextId(), name: c.label, type: c.key, calcType: c.calcType, value: c.value, enabled: true }));
  return { earnings: toComponents('earning'), deductions: toComponents('deduction') };
}

function SalaryStructureForm({ onClose, employee, structure }) {
  const [saveStructure, { isLoading }] = useSaveSalaryStructureMutation();
  const { data: payrollSettings } = useGetPayrollSettingsQuery();
  const toast = useToast();
  const [grossSalary, setGrossSalary] = useState(structure?.grossSalary ?? employee?.baseSalary ?? 0);
  const [earnings, setEarnings] = useState(() =>
    structure?.earnings?.length ? structure.earnings.map((e) => ({ ...e, id: e.id || nextId() })) : [{ id: nextId(), name: 'Basic', type: 'basic', calcType: 'percentage', value: 50, enabled: true }]
  );
  const [deductions, setDeductions] = useState(() =>
    structure?.deductions?.map((d) => ({ ...d, id: d.id || nextId() })) || []
  );
  const [error, setError] = useState('');

  function handleAutoFill() {
    const { earnings: autoEarnings, deductions: autoDeductions } = buildFromFormula(grossSalary, payrollSettings?.salaryComponentDefaults);
    setEarnings(autoEarnings);
    setDeductions(autoDeductions);
    toast('Earnings and deductions filled from formula');
  }

  const totals = useMemo(() => {
    const gross = Number(grossSalary) || 0;
    const totalEarnings = earnings.reduce((sum, c) => sum + componentAmount(c, gross), 0);
    const totalDeductions = deductions.filter((d) => d.enabled !== false).reduce((sum, c) => sum + componentAmount(c, gross), 0);
    return { gross, totalEarnings, totalDeductions, net: totalEarnings - totalDeductions };
  }, [grossSalary, earnings, deductions]);

  async function handleSubmit() {
    setError('');
    if (!grossSalary || Number(grossSalary) <= 0) {
      setError('Gross salary must be greater than zero.');
      return;
    }
    try {
      await saveStructure({
        userId: employee.id,
        grossSalary: Number(grossSalary),
        earnings: earnings.map(({ id, ...rest }) => ({ ...rest, value: Number(rest.value) || 0 })),
        deductions: deductions.map(({ id, ...rest }) => ({ ...rest, value: Number(rest.value) || 0 })),
      }).unwrap();
      toast('Salary structure saved');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save salary structure.'));
    }
  }

  return (
    <div className="modal-cols">
      <div>
        <div className="ff">
          <label className="fl">Employee</label>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{employee?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--g400)' }}>
            {employee?.employeeCode} · {employee?.department || '—'} · {employee?.designation || '—'}
          </div>
        </div>
        <div className="ff">
          <label className="fl">Gross salary (₹ / month)</label>
          <div className="frow" style={{ alignItems: 'flex-start' }}>
            <input type="number" min="0" className="fi" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} />
            <button
              type="button"
              className="btn btn-g btn-sm"
              style={{ flexShrink: 0 }}
              disabled={!grossSalary || Number(grossSalary) <= 0}
              onClick={handleAutoFill}
              title="Fill earnings and deductions using the formula configured in Payroll Settings"
            >
              <TrendUpIcon style={{ width: 12, height: 12 }} /> Auto-fill from formula
            </button>
          </div>
        </div>

        <ComponentBuilder title="Earnings" types={EARNING_TYPES} components={earnings} setComponents={setEarnings} showToggle={false} />
        <ComponentBuilder title="Deductions" types={DEDUCTION_TYPES} components={deductions} setComponents={setDeductions} showToggle />

        <div className="ferr">{error}</div>
      </div>

      <div>
        <div className="calc-panel">
          <div className="calc-title">Live calculation</div>
          <div className="calc-row">
            <span>Gross salary</span>
            <span>{fmtCurrency(totals.gross)}</span>
          </div>
          <div className="calc-row">
            <span>Total earnings</span>
            <span>{fmtCurrency(totals.totalEarnings)}</span>
          </div>
          <div className="calc-row ded">
            <span>Total deductions</span>
            <span>−{fmtCurrency(totals.totalDeductions)}</span>
          </div>
          <div className="calc-row net">
            <span>Estimated net salary</span>
            <span>{fmtCurrency(totals.net)}</span>
          </div>
        </div>
      </div>

      <div className="macts" style={{ gridColumn: '1 / -1' }}>
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Save structure'}
        </button>
      </div>
    </div>
  );
}

export default function SalaryStructureModal({ open, onClose, employee, structure }) {
  return (
    <Modal open={open} onClose={onClose} title="Salary Structure" subtitle={structure?.updatedAt ? `Last updated ${fmtDate(structure.updatedAt)}` : 'New structure'} wide>
      {open ? <SalaryStructureForm key={employee?.id} onClose={onClose} employee={employee} structure={structure} /> : null}
    </Modal>
  );
}
