'use client';

import { useState } from 'react';
import { useCreateAttendanceRuleMutation, useUpdateAttendanceRuleMutation } from '@/lib/services/settingsApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

const emptyForm = {
  ruleName: '',
  checkInTime: '09:00',
  checkOutTime: '18:00',
  gracePeriodMinutes: 15,
  halfDayHours: 4,
  fullDayHours: 8,
  overtimeThreshold: 9,
  isDefault: false,
  isActive: true,
};

function AttendanceRuleForm({ onClose, rule }) {
  const isEdit = Boolean(rule);
  const [createRule, { isLoading: creating }] = useCreateAttendanceRuleMutation();
  const [updateRule, { isLoading: updating }] = useUpdateAttendanceRuleMutation();
  const toast = useToast();
  const [form, setForm] = useState(() => (rule ? { ...emptyForm, ...rule } : emptyForm));
  const [error, setError] = useState('');

  function set(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit() {
    setError('');
    if (!form.ruleName.trim()) {
      setError('Rule name is required.');
      return;
    }
    
    const payload = {
      ruleName: form.ruleName.trim(),
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      gracePeriodMinutes: Number(form.gracePeriodMinutes),
      halfDayHours: Number(form.halfDayHours),
      fullDayHours: Number(form.fullDayHours),
      overtimeThreshold: Number(form.overtimeThreshold),
      isDefault: Boolean(form.isDefault),
      isActive: Boolean(form.isActive),
    };

    try {
      if (isEdit) {
        await updateRule({ id: rule.id, ...payload }).unwrap();
        toast('Attendance rule updated');
      } else {
        await createRule(payload).unwrap();
        toast('Attendance rule created');
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save rule.'));
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Rule name</label>
        <input className="fi" value={form.ruleName} onChange={set('ruleName')} placeholder="e.g. Standard Shift" />
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Check-in time</label>
          <input className="fi" type="time" value={form.checkInTime} onChange={set('checkInTime')} />
        </div>
        <div className="ff">
          <label className="fl">Check-out time</label>
          <input className="fi" type="time" value={form.checkOutTime} onChange={set('checkOutTime')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Grace period (min)</label>
          <input className="fi" type="number" min="0" value={form.gracePeriodMinutes} onChange={set('gracePeriodMinutes')} />
        </div>
        <div className="ff">
          <label className="fl">Overtime after (hrs)</label>
          <input className="fi" type="number" min="0" value={form.overtimeThreshold} onChange={set('overtimeThreshold')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Half-day hours</label>
          <input className="fi" type="number" min="0" value={form.halfDayHours} onChange={set('halfDayHours')} />
        </div>
        <div className="ff">
          <label className="fl">Full-day hours</label>
          <input className="fi" type="number" min="0" value={form.fullDayHours} onChange={set('fullDayHours')} />
        </div>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Default rule</div>
          <div className="ts">Applies to employees without a custom rule</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={Boolean(form.isDefault)} onChange={set('isDefault')} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Active</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={Boolean(form.isActive)} onChange={set('isActive')} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  );
}

export default function AttendanceRuleModal({ open, onClose, rule }) {
  return (
    <Modal open={open} onClose={onClose} title={rule ? 'Edit Attendance Rule' : 'Add Attendance Rule'}>
      {open ? <AttendanceRuleForm key={rule?.id || 'new'} onClose={onClose} rule={rule} /> : null}
    </Modal>
  );
}
