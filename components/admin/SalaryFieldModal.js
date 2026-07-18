'use client';

import { useMemo, useState } from 'react';
import { useCreateSalaryFieldMutation, useUpdateSalaryFieldMutation } from '@/lib/services/salaryFieldsApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

const INPUT_TYPES = [
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'currency', label: 'Currency (₹)' },
  { value: 'percentage', label: 'Percentage (auto-calculated from Total Salary)' },
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown (single select)' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'boolean', label: 'Switch (yes/no)' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio group' },
  { value: 'date', label: 'Date' },
];

const OPTION_TYPES = ['select', 'multiselect', 'radio'];

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function emptyForm() {
  return {
    name: '',
    code: '',
    description: '',
    group: 'earning',
    inputType: 'number',
    defaultValue: '',
    calculationBase: 'total',
    placeholder: '',
    options: [],
    isRequired: false,
    isEditable: true,
    isVisible: true,
    isActive: true,
  };
}

function formFromField(field) {
  if (!field) return emptyForm();
  return {
    name: field.name || '',
    code: field.code || '',
    description: field.description || '',
    group: field.group || 'earning',
    inputType: field.inputType || 'number',
    defaultValue: field.defaultValue ?? '',
    calculationBase: field.calculationBase || 'total',
    placeholder: field.placeholder || '',
    options: (field.options || []).map((o) => ({ label: o.label ?? o, value: o.value ?? o })),
    isRequired: Boolean(field.isRequired),
    isEditable: field.isEditable !== false,
    isVisible: field.isVisible !== false,
    isActive: field.isActive !== false,
  };
}

function SalaryFieldForm({ onClose, field, existingFields }) {
  const isEdit = Boolean(field);
  const [createField, { isLoading: creating }] = useCreateSalaryFieldMutation();
  const [updateField, { isLoading: updating }] = useUpdateSalaryFieldMutation();
  const toast = useToast();
  const [form, setForm] = useState(() => formFromField(field));
  const [error, setError] = useState('');
  const [codeTouched, setCodeTouched] = useState(isEdit);

  const baseOptions = useMemo(
    () => existingFields.filter((f) => f.code && f.code !== form.code),
    [existingFields, form.code]
  );

  function set(key) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };
  }

  function setName(e) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, code: codeTouched ? f.code : slugify(name) }));
  }

  function updateOption(index, key, value) {
    setForm((f) => {
      const options = [...f.options];
      options[index] = { ...options[index], [key]: value };
      return { ...f, options };
    });
  }

  function addOption() {
    setForm((f) => ({ ...f, options: [...f.options, { label: '', value: '' }] }));
  }

  function removeOption(index) {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== index) }));
  }

  function moveOption(index, direction) {
    setForm((f) => {
      const options = [...f.options];
      const target = index + direction;
      if (target < 0 || target >= options.length) return f;
      [options[index], options[target]] = [options[target], options[index]];
      return { ...f, options };
    });
  }

  async function handleSubmit() {
    setError('');
    const name = form.name.trim();
    const code = (form.code || slugify(name)).trim();
    if (!name || !code) {
      setError('Name is required.');
      return;
    }
    const needsOptions = OPTION_TYPES.includes(form.inputType);
    const cleanOptions = form.options
      .map((o, i) => ({ label: String(o.label).trim(), value: o.value === '' ? o.label : o.value, sortOrder: i }))
      .filter((o) => o.label);
    if (needsOptions && !cleanOptions.length) {
      setError('Add at least one option for this input type.');
      return;
    }

    const payload = {
      name,
      code,
      description: form.description.trim() || undefined,
      group: form.group,
      inputType: form.inputType,
      placeholder: form.placeholder || undefined,
      isRequired: Boolean(form.isRequired),
      isEditable: Boolean(form.isEditable),
      isVisible: Boolean(form.isVisible),
      isActive: Boolean(form.isActive),
    };

    if (form.inputType === 'percentage') {
      payload.defaultValue = form.defaultValue === '' ? 0 : Number(form.defaultValue);
      payload.calculationBase = form.calculationBase === 'total' ? null : form.calculationBase;
    } else if (needsOptions) {
      payload.options = cleanOptions;
      payload.defaultValue = form.defaultValue || undefined;
    } else if (form.inputType === 'boolean' || form.inputType === 'checkbox') {
      payload.defaultValue = Boolean(form.defaultValue);
    } else {
      payload.defaultValue = form.defaultValue === '' ? undefined : form.defaultValue;
    }

    if (!isEdit) {
      const maxSort = existingFields.reduce((max, f) => Math.max(max, f.sortOrder ?? 0), 0);
      payload.sortOrder = maxSort + 10;
    }

    try {
      if (isEdit) {
        await updateField({ id: field.id, ...payload }).unwrap();
        toast('Salary field updated');
      } else {
        await createField(payload).unwrap();
        toast('Salary field added');
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save salary field.'));
    }
  }

  const needsOptions = OPTION_TYPES.includes(form.inputType);

  return (
    <div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Field name</label>
          <input className="fi" value={form.name} onChange={setName} placeholder="e.g. Provident Fund" />
        </div>
        <div className="ff">
          <label className="fl">Field key (code)</label>
          <input
            className="fi"
            value={form.code}
            disabled={isEdit}
            onChange={(e) => {
              setCodeTouched(true);
              setForm((f) => ({ ...f, code: slugify(e.target.value) }));
            }}
            placeholder="e.g. pf"
          />
        </div>
      </div>

      <div className="ff">
        <label className="fl">Description</label>
        <input className="fi" value={form.description} onChange={set('description')} placeholder="Optional helper text shown under the field" />
      </div>

      <div className="frow">
        <div className="ff">
          <label className="fl">Group</label>
          <select className="fi" value={form.group} onChange={set('group')}>
            <option value="earning">Earnings</option>
            <option value="deduction">Deductions</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="ff">
          <label className="fl">Input type</label>
          <select className="fi" value={form.inputType} onChange={set('inputType')}>
            {INPUT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {form.inputType === 'percentage' ? (
        <div className="frow">
          <div className="ff">
            <label className="fl">Percentage (%)</label>
            <input className="fi" type="number" step="0.01" value={form.defaultValue} onChange={set('defaultValue')} placeholder="e.g. 12" />
          </div>
          <div className="ff">
            <label className="fl">Calculate based on (formula)</label>
            <select className="fi" value={form.calculationBase} onChange={set('calculationBase')}>
              <option value="total">Total Salary</option>
              {baseOptions.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : needsOptions ? (
        <div className="ff">
          <label className="fl">Options</label>
          {form.options.map((opt, i) => (
            <div className="frow" key={i} style={{ marginBottom: 6, alignItems: 'center' }}>
              <input className="fi" placeholder="Label" value={opt.label} onChange={(e) => updateOption(i, 'label', e.target.value)} />
              <input className="fi" placeholder="Value (optional)" value={opt.value} onChange={(e) => updateOption(i, 'value', e.target.value)} />
              <button type="button" className="ib" disabled={i === 0} onClick={() => moveOption(i, -1)} style={{ flexShrink: 0 }} title="Move up">
                ↑
              </button>
              <button
                type="button"
                className="ib"
                disabled={i === form.options.length - 1}
                onClick={() => moveOption(i, 1)}
                style={{ flexShrink: 0 }}
                title="Move down"
              >
                ↓
              </button>
              <button type="button" className="ib del" onClick={() => removeOption(i)} style={{ flexShrink: 0 }} title="Remove">
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-g btn-sm" onClick={addOption}>
            + Add option
          </button>
        </div>
      ) : (
        <div className="frow">
          <div className="ff">
            <label className="fl">Default value</label>
            <input className="fi" value={form.defaultValue} onChange={set('defaultValue')} placeholder="Optional" />
          </div>
          <div className="ff">
            <label className="fl">Placeholder</label>
            <input className="fi" value={form.placeholder} onChange={set('placeholder')} placeholder="Optional" />
          </div>
        </div>
      )}

      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Required</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={form.isRequired} onChange={set('isRequired')} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Editable</div>
          <div className="ts">Off = read-only, always shows the computed/default value on the employee form</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={form.isEditable} onChange={set('isEditable')} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Visible</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={form.isVisible} onChange={set('isVisible')} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Active</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          <span className="tog-sl" />
        </label>
      </div>

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : isEdit ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default function SalaryFieldModal({ open, onClose, field, existingFields }) {
  return (
    <Modal open={open} onClose={onClose} title={field ? 'Edit Salary Field' : 'Add Custom Field'} wide>
      {open ? <SalaryFieldForm key={field?.id || 'new'} onClose={onClose} field={field} existingFields={existingFields || []} /> : null}
    </Modal>
  );
}
