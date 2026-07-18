'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useGetSalaryFieldsQuery } from '@/lib/services/salaryFieldsApi';
import { normalizeSalaryField } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import SalaryFieldInput from './SalaryFieldInput';

const GROUP_LABELS = { earning: 'Earnings', deduction: 'Deductions', other: 'Other' };
const GROUP_ORDER = ['earning', 'deduction', 'other'];
const SALARY_GROUPS = ['earning', 'deduction'];

function isMultiValue(inputType) {
  return inputType === 'multiselect';
}

function isBoolValue(inputType) {
  return inputType === 'boolean' || inputType === 'checkbox';
}

function isNumericInput(inputType) {
  return inputType === 'number' || inputType === 'decimal' || inputType === 'currency' || inputType === 'percentage';
}

function round2(n) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

function coerceValue(field, raw) {
  if (isBoolValue(field.inputType)) return Boolean(raw);
  if (isMultiValue(field.inputType)) return Array.isArray(raw) ? raw : [];
  if (isNumericInput(field.inputType)) {
    return raw === '' || raw === undefined || raw === null ? '' : Number(raw);
  }
  return raw ?? '';
}

function initialValueFor(field, existing) {
  if (existing !== undefined) return coerceValue(field, existing);
  if (field.inputType === 'percentage') return 0;
  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '') {
    return coerceValue(field, field.defaultValue);
  }
  if (isBoolValue(field.inputType)) return false;
  if (isMultiValue(field.inputType)) return [];
  return '';
}

function isEmptyValue(field, value) {
  if (isBoolValue(field.inputType)) return false;
  if (isMultiValue(field.inputType)) return !value || value.length === 0;
  return value === '' || value === null || value === undefined;
}

function baseLabelFor(field, fields) {
  if (!field.calculationBase) return 'Total Salary';
  const ref = fields.find((f) => f.code === field.calculationBase);
  return ref ? ref.name : 'Total Salary';
}

const DynamicSalaryFields = forwardRef(function DynamicSalaryFields({ initialSalary, baseAmount }, ref) {
  const { data, isLoading, isFetching, isError, refetch } = useGetSalaryFieldsQuery();

  const fields = useMemo(() => {
    const { items } = unwrapList(data);
    return items
      .map(normalizeSalaryField)
      .filter((f) => f && f.isVisible && f.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [data]);

  const existingByKey = useMemo(() => {
    const map = {};
    (initialSalary || []).forEach((item) => {
      if (!item) return;
      if (item.code !== undefined) map[item.code] = item.value;
      if (item.fieldId !== undefined) map[item.fieldId] = item.value;
    });
    return map;
  }, [initialSalary]);

  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');

  const fieldKey = fields.map((f) => f.id).join(',');
  useEffect(() => {
    if (!fields.length) return;
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      fields.forEach((field) => {
        if (next[field.id] === undefined) {
          const existing = existingByKey[field.code] ?? existingByKey[field.id];
          next[field.id] = initialValueFor(field, existing);
          if (existing !== undefined && field.inputType === 'percentage') {
            setTouched((t) => ({ ...t, [field.id]: true }));
          }
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey]);

  // Auto-distribute Total Salary across percentage fields (admin-configured %),
  // in field order so a field can be computed as a % of an earlier field.
  useEffect(() => {
    if (!fields.length) return;
    setValues((prev) => {
      const next = { ...prev };
      const computedByCode = {};
      let changed = false;
      fields.forEach((field) => {
        if (field.inputType === 'percentage') {
          const base = field.calculationBase ? computedByCode[field.calculationBase] ?? baseAmount : baseAmount;
          const computed = round2(((Number(field.defaultValue) || 0) / 100) * (Number(base) || 0));
          if (field.isEditable === false || !touched[field.id]) {
            if (next[field.id] !== computed) {
              next[field.id] = computed;
              changed = true;
            }
          }
          computedByCode[field.code] = Number(next[field.id]) || 0;
        } else {
          computedByCode[field.code] = Number(next[field.id]) || 0;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseAmount, fieldKey, touched]);

  function setValue(field, raw) {
    setValues((prev) => ({ ...prev, [field.id]: coerceValue(field, raw) }));
    if (field.inputType === 'percentage') {
      setTouched((prev) => ({ ...prev, [field.id]: true }));
    }
    setErrors((prev) => (prev[field.id] ? { ...prev, [field.id]: '' } : prev));
  }

  function validate() {
    const nextErrors = {};
    fields.forEach((field) => {
      if (field.isRequired && isEmptyValue(field, values[field.id])) {
        nextErrors[field.id] = `${field.name} is required.`;
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function getPayload() {
    const salaryComponents = [];
    const customFields = [];
    fields.forEach((field) => {
      const entry = { fieldId: field.id, code: field.code, value: values[field.id] };
      if (SALARY_GROUPS.includes(field.group)) salaryComponents.push(entry);
      else customFields.push(entry);
    });
    return { totalSalary: Number(baseAmount) || 0, salaryComponents, customFields };
  }

  useImperativeHandle(ref, () => ({ validate, getPayload, isLoading: isLoading || isFetching, hasFields: fields.length > 0 }));

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-label">Salary details</div>
        <div className="skel-field" />
        <div className="skel-field" />
        <div className="skel-field" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card">
        <div className="card-label">Salary details</div>
        <div className="ferr" style={{ marginBottom: 8 }}>
          Could not load salary fields.
        </div>
        <button type="button" className="btn btn-g btn-sm" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (!fields.length) return null;

  const term = search.trim().toLowerCase();
  const visibleFields = term ? fields.filter((f) => f.name.toLowerCase().includes(term) || f.code.toLowerCase().includes(term)) : fields;

  const groups = GROUP_ORDER.map((key) => ({ key, label: GROUP_LABELS[key], items: visibleFields.filter((f) => f.group === key) })).filter(
    (g) => g.items.length
  );

  return (
    <>
      {fields.length > 6 ? (
        <input
          className="fi"
          style={{ marginBottom: 12 }}
          placeholder="Search salary fields…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      ) : null}
      {groups.map((group) => {
        const isCollapsed = Boolean(collapsed[group.key]);
        return (
          <div className="card" key={group.key}>
            <button
              type="button"
              className="dsf-group-head"
              onClick={() => setCollapsed((c) => ({ ...c, [group.key]: !c[group.key] }))}
            >
              <span className="card-label" style={{ marginBottom: 0 }}>
                {group.label} <span style={{ color: 'var(--g400)', fontWeight: 600 }}>({group.items.length})</span>
              </span>
              <span className={`dsf-chevron ${isCollapsed ? '' : 'open'}`}>⌄</span>
            </button>
            {!isCollapsed ? (
              <div className="dsf-grid" style={{ marginTop: 12 }}>
                {group.items.map((field) => (
                  <SalaryFieldInput
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    hint={field.inputType === 'percentage' ? `${field.defaultValue ?? 0}% of ${baseLabelFor(field, fields)}` : null}
                    onChange={(v) => setValue(field, v)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
});

export default DynamicSalaryFields;
