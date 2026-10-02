'use client';

import { useMemo, useState } from 'react';
import { useSaveSalaryStructureMutation, useGetPayrollSettingsQuery } from '@/lib/services/payrollApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency, fmtDate, pad } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import { PlusIcon, TrashIcon, TrendUpIcon } from '../icons';
import { SALARY_COMPONENT_MASTER } from './PayrollSettingsTab';

// Must mirror the fixed component keys on the backend's SalaryStructure
// model (src/models/SalaryStructure.js) — these are real schema fields,
// not free-form entries, so they can be toggled/edited but not renamed or
// removed. Anything else is a custom line item (otherAllowances/otherDeductions).
const EARNING_COMPONENTS = [
  { key: 'basicSalary', label: 'Basic Salary', defaultCalcType: 'percentage', defaultValue: 40 },
  { key: 'hra', label: 'HRA', defaultCalcType: 'percentage', defaultValue: 20 },
  { key: 'specialAllowance', label: 'Special Allowance' },
  { key: 'conveyanceAllowance', label: 'Conveyance Allowance' },
  { key: 'medicalAllowance', label: 'Medical Allowance' },
  { key: 'foodAllowance', label: 'Food Allowance' },
  { key: 'internetAllowance', label: 'Internet/Mobile Allowance' },
  { key: 'performanceIncentive', label: 'Performance Incentive' },
  { key: 'bonus', label: 'Bonus' },
];

const DEDUCTION_COMPONENTS = [
  { key: 'pf', label: 'Provident Fund (PF)' },
  { key: 'professionalTax', label: 'Professional Tax' },
  { key: 'tds', label: 'Income Tax (TDS)' },
  { key: 'esic', label: 'ESIC' },
];

// Maps the payroll-settings "formula" keys (used for auto-fill) onto the
// backend's actual component keys, since the two lists were named differently.
const MASTER_KEY_TO_COMPONENT_KEY = {
  basic: 'basicSalary',
  hra: 'hra',
  medical: 'medicalAllowance',
  food: 'foodAllowance',
  internet: 'internetAllowance',
  conveyance: 'conveyanceAllowance',
  special_allowance: 'specialAllowance',
  pf: 'pf',
  professional_tax: 'professionalTax',
  tds: 'tds',
  esic: 'esic',
};

let uid = 0;
function nextId() {
  uid += 1;
  return `new-${Date.now()}-${uid}`;
}

// Payroll is usually run for the month that just ended, so a change made
// today is normally meant to apply to last month's salary as well.
function defaultEffectiveMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function componentAmount(component, gross) {
  const value = Number(component.value) || 0;
  return component.calcType === 'percentage' ? (value / 100) * gross : value;
}

// Seeds one row per fixed backend key, pulling saved values out of the raw
// { key: { calculationType, value, isEnabled } } map when present.
function seedFixedComponents(defs, sourceMap) {
  return defs.map((d) => {
    const comp = sourceMap?.[d.key];
    return {
      id: nextId(),
      name: d.label,
      type: d.key,
      calcType: comp?.calculationType || d.defaultCalcType || 'fixed',
      value: comp?.value ?? d.defaultValue ?? 0,
      enabled: comp ? comp.isEnabled !== false : true,
    };
  });
}

function seedCustomComponents(sourceMap, customKey) {
  const list = sourceMap?.[customKey];
  if (!Array.isArray(list)) return [];
  return list.map((item, idx) => ({
    id: item._id || item.id || `${customKey}-${idx}-${nextId()}`,
    name: item.name || 'Custom',
    type: 'custom',
    calcType: item.calculationType || 'fixed',
    value: item.value ?? 0,
    enabled: item.isEnabled !== false,
  }));
}

function toComponentMap(fixedRows, customRows, customKey) {
  const map = {};
  fixedRows.forEach((c) => {
    map[c.type] = {
      calculationType: c.calcType === 'percentage' ? 'percentage' : 'fixed',
      value: Number(c.value) || 0,
      isEnabled: c.enabled !== false,
    };
  });
  map[customKey] = customRows.map((c) => ({
    name: c.name?.trim() || 'Custom',
    calculationType: c.calcType === 'percentage' ? 'percentage' : 'fixed',
    value: Number(c.value) || 0,
    isEnabled: c.enabled !== false,
  }));
  return map;
}

// A single field card in the grid — mirrors DynamicSalaryFields/SalaryFieldInput
// (the employee salary-fields screen) so both salary UIs look and feel the same.
function ComponentCard({ component, gross, onChange, onRemove, showToggle, editableName, required }) {
  const amount = componentAmount(component, gross);
  const pct = gross > 0 ? (amount / gross) * 100 : 0;
  const disabled = showToggle && component.enabled === false;

  return (
    <div className="ff">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        {editableName ? (
          <input
            className="fl"
            style={{ border: 'none', padding: 0, background: 'transparent', flex: 1, minWidth: 0 }}
            value={component.name}
            onChange={(e) => onChange({ ...component, name: e.target.value })}
          />
        ) : (
          <label className="fl" style={{ marginBottom: 0 }}>
            {component.name}
            {required ? <span style={{ color: 'var(--red)' }}> *</span> : null}
          </label>
        )}
        {showToggle ? (
          <label className="tog" style={{ width: 32, height: 18, flexShrink: 0 }}>
            <input type="checkbox" checked={component.enabled !== false} onChange={(e) => onChange({ ...component, enabled: e.target.checked })} />
            <span className="tog-sl" />
          </label>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="comp-type" style={{ flexShrink: 0 }}>
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
          className="fi"
          value={component.value}
          disabled={disabled}
          onChange={(e) => onChange({ ...component, value: e.target.value })}
        />
        {onRemove ? (
          <button type="button" className="ib del" style={{ flexShrink: 0 }} onClick={onRemove}>
            <TrashIcon />
          </button>
        ) : null}
      </div>
      <div className="dsf-hint">{amount > 0 ? `${pct.toFixed(2)}% of Total Salary` : 'Not configured'}</div>
    </div>
  );
}

// Combines the fixed (schema) rows and the free-form custom rows into one
// grid, and routes updates back to whichever state array actually owns the row.
function ComponentSection({ title, gross, fixedRows, setFixedRows, customRows, setCustomRows, showToggle, requiredKeys, addLabel }) {
  const [collapsed, setCollapsed] = useState(false);
  const all = [...fixedRows, ...customRows];

  function handleChange(row, updated) {
    if (row.type === 'custom') {
      setCustomRows((list) => list.map((item) => (item.id === row.id ? updated : item)));
    } else {
      setFixedRows((list) => list.map((item) => (item.id === row.id ? updated : item)));
    }
  }

  function addCustom() {
    setCustomRows((list) => [...list, { id: nextId(), name: 'Custom', type: 'custom', calcType: 'fixed', value: 0, enabled: true }]);
  }

  return (
    <div className="card">
      <button type="button" className="dsf-group-head" onClick={() => setCollapsed((c) => !c)}>
        <span className="card-label" style={{ marginBottom: 0 }}>
          {title} <span style={{ color: 'var(--g400)', fontWeight: 600 }}>({all.length})</span>
        </span>
        <span className={`dsf-chevron ${collapsed ? '' : 'open'}`}>⌄</span>
      </button>
      {!collapsed ? (
        <>
          <div className="dsf-grid" style={{ marginTop: 12 }}>
            {all.map((row) => (
              <ComponentCard
                key={row.id}
                component={row}
                gross={gross}
                showToggle={showToggle}
                editableName={row.type === 'custom'}
                required={requiredKeys?.includes(row.type)}
                onChange={(updated) => handleChange(row, updated)}
                onRemove={row.type === 'custom' ? () => setCustomRows((list) => list.filter((item) => item.id !== row.id)) : null}
              />
            ))}
          </div>
          <button type="button" className="btn btn-g btn-sm" style={{ marginTop: 12 }} onClick={addCustom}>
            <PlusIcon style={{ width: 12, height: 12 }} /> {addLabel}
          </button>
        </>
      ) : null}
    </div>
  );
}

function SalaryStructureForm({ onClose, employee, structure }) {
  const [saveStructure, { isLoading }] = useSaveSalaryStructureMutation();
  const { data: payrollSettings } = useGetPayrollSettingsQuery();
  const toast = useToast();
  const rawEarnings = structure?.raw?.earnings;
  const rawDeductions = structure?.raw?.deductions;

  const [grossSalary, setGrossSalary] = useState(structure?.grossSalary ?? employee?.baseSalary ?? 0);
  const [annualCTC, setAnnualCTC] = useState(structure?.annualCTC ?? Number(structure?.grossSalary ?? employee?.baseSalary ?? 0) * 12);
  const [earnings, setEarnings] = useState(() => seedFixedComponents(EARNING_COMPONENTS, rawEarnings));
  const [customEarnings, setCustomEarnings] = useState(() => seedCustomComponents(rawEarnings, 'otherAllowances'));
  const [deductions, setDeductions] = useState(() => seedFixedComponents(DEDUCTION_COMPONENTS, rawDeductions));
  const [customDeductions, setCustomDeductions] = useState(() => seedCustomComponents(rawDeductions, 'otherDeductions'));
  const [effectiveMonth, setEffectiveMonth] = useState(defaultEffectiveMonth);
  const [error, setError] = useState('');

  function handleAutoFill() {
    const componentDefaults = payrollSettings?.salaryComponentDefaults || {};

    function applyFormula(list, setList) {
      setList((rows) =>
        rows.map((row) => {
          const masterKey = Object.keys(MASTER_KEY_TO_COMPONENT_KEY).find((k) => MASTER_KEY_TO_COMPONENT_KEY[k] === row.type);
          const master = masterKey && SALARY_COMPONENT_MASTER.find((c) => c.key === masterKey);
          if (!master) return row;
          const override = componentDefaults[masterKey] || {};
          return {
            ...row,
            calcType: override.calcType ?? master.calcType,
            value: override.value ?? master.value,
            enabled: override.enabled ?? true,
          };
        })
      );
    }

    applyFormula(earnings, setEarnings);
    applyFormula(deductions, setDeductions);
    toast('Earnings and deductions filled from formula');
  }

  const totals = useMemo(() => {
    const gross = Number(grossSalary) || 0;
    const allEarnings = [...earnings, ...customEarnings];
    const allDeductions = [...deductions, ...customDeductions];
    const totalEarnings = allEarnings.filter((c) => c.enabled !== false).reduce((sum, c) => sum + componentAmount(c, gross), 0);
    const totalDeductions = allDeductions.filter((c) => c.enabled !== false).reduce((sum, c) => sum + componentAmount(c, gross), 0);
    return { gross, totalEarnings, totalDeductions, net: totalEarnings - totalDeductions };
  }, [grossSalary, earnings, customEarnings, deductions, customDeductions]);

  async function handleSubmit() {
    setError('');
    if (!grossSalary || Number(grossSalary) <= 0) {
      setError('Gross salary must be greater than zero.');
      return;
    }
    if (!annualCTC || Number(annualCTC) <= 0) {
      setError('Annual CTC must be greater than zero.');
      return;
    }
    if (!effectiveMonth) {
      setError('Choose the month this structure applies from.');
      return;
    }
    const basic = earnings.find((c) => c.type === 'basicSalary');
    if (basic?.enabled === false || !Number(basic?.value)) {
      setError('Basic Salary is required and cannot be disabled.');
      return;
    }
    const hraComponent = earnings.find((c) => c.type === 'hra');
    if (hraComponent?.enabled === false || !Number(hraComponent?.value)) {
      setError('HRA is required and cannot be disabled.');
      return;
    }
    try {
      await saveStructure({
        userId: employee.id,
        monthlyGrossSalary: Number(grossSalary),
        annualCTC: Number(annualCTC),
        effectiveFrom: `${effectiveMonth}-01`,
        earnings: toComponentMap(earnings, customEarnings, 'otherAllowances'),
        deductions: toComponentMap(deductions, customDeductions, 'otherDeductions'),
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
        <div className="frow">
          <div className="ff">
            <label className="fl">Gross salary (₹ / month)</label>
            <input type="number" min="0" className="fi" value={grossSalary} onChange={(e) => setGrossSalary(e.target.value)} />
          </div>
          <div className="ff">
            <label className="fl">Annual CTC (₹)</label>
            <input type="number" min="0" className="fi" value={annualCTC} onChange={(e) => setAnnualCTC(e.target.value)} />
          </div>
        </div>
        <div className="ff">
          <label className="fl">Effective from (month)</label>
          <input type="month" className="fi" value={effectiveMonth} onChange={(e) => setEffectiveMonth(e.target.value)} />
          <div className="dsf-hint">Payroll for this month onward uses this structure. Regenerate slips already generated for those months.</div>
        </div>
        <div className="ff">
          <button
            type="button"
            className="btn btn-g btn-sm"
            disabled={!grossSalary || Number(grossSalary) <= 0}
            onClick={handleAutoFill}
            title="Fill earnings and deductions using the formula configured in Payroll Settings"
          >
            <TrendUpIcon style={{ width: 12, height: 12 }} /> Auto-fill from formula
          </button>
        </div>

        <ComponentSection
          title="Earnings"
          gross={Number(grossSalary) || 0}
          fixedRows={earnings}
          setFixedRows={setEarnings}
          customRows={customEarnings}
          setCustomRows={setCustomEarnings}
          showToggle
          requiredKeys={['basicSalary', 'hra']}
          addLabel="Add allowance"
        />

        <ComponentSection
          title="Deductions"
          gross={Number(grossSalary) || 0}
          fixedRows={deductions}
          setFixedRows={setDeductions}
          customRows={customDeductions}
          setCustomRows={setCustomDeductions}
          showToggle
          addLabel="Add deduction"
        />

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
