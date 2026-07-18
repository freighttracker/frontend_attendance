'use client';

import { useState } from 'react';
import { useGetPayrollSettingsQuery, useUpdatePayrollSettingsMutation } from '@/lib/services/payrollApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Spinner from '../ui/Spinner';
import { UploadIcon, BuildingIcon } from '../icons';

export const SALARY_COMPONENT_MASTER = [
  { key: 'basic', label: 'Basic', group: 'earning', calcType: 'percentage', value: 40 },
  { key: 'hra', label: 'HRA', group: 'earning', calcType: 'percentage', value: 20 },
  { key: 'medical', label: 'Medical', group: 'earning', calcType: 'fixed', value: 1250 },
  { key: 'food', label: 'Food', group: 'earning', calcType: 'fixed', value: 0 },
  { key: 'internet', label: 'Internet', group: 'earning', calcType: 'fixed', value: 0 },
  { key: 'conveyance', label: 'Conveyance', group: 'earning', calcType: 'fixed', value: 1600 },
  { key: 'special_allowance', label: 'Special Allowance', group: 'earning', calcType: 'percentage', value: 0 },
  { key: 'pf', label: 'PF', group: 'deduction', calcType: 'percentage', value: 12 },
  { key: 'professional_tax', label: 'Professional Tax', group: 'deduction', calcType: 'fixed', value: 200 },
  { key: 'tds', label: 'TDS', group: 'deduction', calcType: 'percentage', value: 0 },
  { key: 'esic', label: 'ESIC', group: 'deduction', calcType: 'percentage', value: 0.75 },
];

function CompanyCard({ settings, onSave, saving }) {
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [logo, setLogo] = useState(settings.companyLogo || '');

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="card">
      <div className="card-label">Company</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--g100)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {logo ? <img src={logo} alt="Company logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <BuildingIcon style={{ color: 'var(--g400)' }} />}
        </div>
        <label className="btn btn-g btn-sm" style={{ cursor: 'pointer' }}>
          <UploadIcon style={{ width: 12, height: 12 }} /> Upload logo
          <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
        </label>
      </div>
      <div className="ff">
        <label className="fl">Company name</label>
        <input className="fi" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
      </div>
      <button className="btn btn-p btn-sm" disabled={saving} onClick={() => onSave({ companyName, companyLogo: logo })}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function SalaryRulesCard({ settings, onSave, saving }) {
  const [lateGraceMinutes, setLateGraceMinutes] = useState(settings.lateComingRule?.graceMinutes ?? 10);
  const [lateDeduction, setLateDeduction] = useState(settings.lateComingRule?.deductionPerOccurrence ?? 0);
  const [halfDayThreshold, setHalfDayThreshold] = useState(settings.halfDayRule?.thresholdHours ?? 4);
  const [workingHours, setWorkingHours] = useState(settings.workingHours?.perDay ?? 8);
  const [overtimeEnabled, setOvertimeEnabled] = useState(settings.overtimeRule?.enabled ?? false);
  const [overtimeRate, setOvertimeRate] = useState(settings.overtimeRule?.ratePerHour ?? 0);

  function handleSave() {
    onSave({
      lateComingRule: { graceMinutes: Number(lateGraceMinutes), deductionPerOccurrence: Number(lateDeduction) },
      halfDayRule: { thresholdHours: Number(halfDayThreshold) },
      workingHours: { perDay: Number(workingHours) },
      overtimeRule: { enabled: overtimeEnabled, ratePerHour: Number(overtimeRate) },
    });
  }

  return (
    <div className="card">
      <div className="card-label">Salary rules</div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Late grace (minutes)</label>
          <input type="number" min="0" className="fi" value={lateGraceMinutes} onChange={(e) => setLateGraceMinutes(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Deduction per late (₹)</label>
          <input type="number" min="0" className="fi" value={lateDeduction} onChange={(e) => setLateDeduction(e.target.value)} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Half day threshold (hrs)</label>
          <input type="number" min="0" className="fi" value={halfDayThreshold} onChange={(e) => setHalfDayThreshold(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Working hours / day</label>
          <input type="number" min="0" className="fi" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
        </div>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Overtime pay</div>
          <div className="ts">Pay extra for hours worked beyond the working day</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={overtimeEnabled} onChange={(e) => setOvertimeEnabled(e.target.checked)} />
          <span className="tog-sl" />
        </label>
      </div>
      {overtimeEnabled ? (
        <div className="ff" style={{ marginTop: 8 }}>
          <label className="fl">Overtime rate (₹ / hour)</label>
          <input type="number" min="0" className="fi" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} />
        </div>
      ) : null}
      <button className="btn btn-p btn-sm" style={{ marginTop: 8 }} disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function StatutoryCard({ settings, onSave, saving }) {
  const [pf, setPf] = useState(settings.pf || { enabled: true, employeePct: 12, employerPct: 12 });
  const [pt, setPt] = useState(settings.professionalTax || { enabled: true, amount: 200 });
  const [esic, setEsic] = useState(settings.esic || { enabled: false, employeePct: 0.75 });
  const [tds, setTds] = useState(settings.tds || { enabled: false, defaultPct: 0 });

  function row(label, state, setState, fields) {
    return (
      <div className="togrow" key={label}>
        <div className="togtxt" style={{ flex: 1 }}>
          <div className="tl">{label}</div>
          {state.enabled ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {fields.map((f) => (
                <input
                  key={f.key}
                  type="number"
                  min="0"
                  className="fi"
                  style={{ width: 90, fontSize: 11, padding: '6px 9px' }}
                  placeholder={f.label}
                  value={state[f.key]}
                  onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              ))}
            </div>
          ) : null}
        </div>
        <label className="tog">
          <input type="checkbox" checked={state.enabled} onChange={(e) => setState((s) => ({ ...s, enabled: e.target.checked }))} />
          <span className="tog-sl" />
        </label>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-label">Statutory rules</div>
      {row('PF', pf, setPf, [{ key: 'employeePct', label: 'Employee %' }, { key: 'employerPct', label: 'Employer %' }])}
      {row('Professional Tax', pt, setPt, [{ key: 'amount', label: 'Amount ₹' }])}
      {row('ESIC', esic, setEsic, [{ key: 'employeePct', label: 'Employee %' }])}
      {row('TDS', tds, setTds, [{ key: 'defaultPct', label: 'Default %' }])}
      <button
        className="btn btn-p btn-sm"
        style={{ marginTop: 8 }}
        disabled={saving}
        onClick={() =>
          onSave({
            pf: { ...pf, employeePct: Number(pf.employeePct), employerPct: Number(pf.employerPct) },
            professionalTax: { ...pt, amount: Number(pt.amount) },
            esic: { ...esic, employeePct: Number(esic.employeePct) },
            tds: { ...tds, defaultPct: Number(tds.defaultPct) },
          })
        }
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function ComponentsMasterCard({ settings, onSave, saving }) {
  const [defaults, setDefaults] = useState(() => {
    const initial = {};
    SALARY_COMPONENT_MASTER.forEach((c) => {
      const saved = settings.salaryComponentDefaults?.[c.key];
      initial[c.key] = {
        enabled: saved?.enabled ?? true,
        calcType: saved?.calcType ?? c.calcType,
        value: saved?.value ?? c.value,
      };
    });
    return initial;
  });

  function patch(key, changes) {
    setDefaults((m) => ({ ...m, [key]: { ...m[key], ...changes } }));
  }

  return (
    <div className="card">
      <div className="card-label">Salary components master</div>
      <div style={{ fontSize: 10, color: 'var(--g400)', marginBottom: 8 }}>
        This formula auto-fills the earnings and deductions when a salary structure is generated for an employee.
      </div>
      {SALARY_COMPONENT_MASTER.map((c) => {
        const d = defaults[c.key];
        return (
          <div className="comp-row" key={c.key}>
            <div className="comp-name">
              <div style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 9, color: 'var(--g400)' }}>{c.group === 'earning' ? 'Earning' : 'Deduction'}</div>
            </div>
            <div className="comp-type">
              <button type="button" className={d.calcType === 'fixed' ? 'on' : ''} onClick={() => patch(c.key, { calcType: 'fixed' })}>
                Fixed
              </button>
              <button type="button" className={d.calcType === 'percentage' ? 'on' : ''} onClick={() => patch(c.key, { calcType: 'percentage' })}>
                %
              </button>
            </div>
            <input
              type="number"
              min="0"
              className="fi comp-val"
              style={{ fontSize: 12, padding: '8px 10px' }}
              value={d.value}
              onChange={(e) => patch(c.key, { value: e.target.value })}
            />
            <label className="tog comp-toggle">
              <input type="checkbox" checked={d.enabled} onChange={(e) => patch(c.key, { enabled: e.target.checked })} />
              <span className="tog-sl" />
            </label>
          </div>
        );
      })}
      <button
        className="btn btn-p btn-sm"
        style={{ marginTop: 10 }}
        disabled={saving}
        onClick={() => {
          const cleaned = {};
          Object.entries(defaults).forEach(([key, d]) => {
            cleaned[key] = { ...d, value: Number(d.value) || 0 };
          });
          onSave({ salaryComponentDefaults: cleaned });
        }}
      >
        {saving ? 'Saving…' : 'Save formula'}
      </button>
    </div>
  );
}

function CalendarRulesCard({ settings, onSave, saving }) {
  const [paidHolidays, setPaidHolidays] = useState(settings.holidayRule?.paid ?? true);
  const [paidWeekends, setPaidWeekends] = useState(settings.weekendRule?.paid ?? true);

  return (
    <div className="card">
      <div className="card-label">Holiday &amp; weekend pay</div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Paid holidays</div>
          <div className="ts">Company holidays count as paid days in salary calculation</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={paidHolidays} onChange={(e) => setPaidHolidays(e.target.checked)} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Paid weekends</div>
          <div className="ts">Weekly offs count as paid days in salary calculation</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={paidWeekends} onChange={(e) => setPaidWeekends(e.target.checked)} />
          <span className="tog-sl" />
        </label>
      </div>
      <button
        className="btn btn-p btn-sm"
        style={{ marginTop: 8 }}
        disabled={saving}
        onClick={() => onSave({ holidayRule: { paid: paidHolidays }, weekendRule: { paid: paidWeekends } })}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

export default function PayrollSettingsTab() {
  const { data, isLoading } = useGetPayrollSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdatePayrollSettingsMutation();
  const toast = useToast();

  if (isLoading) return <Spinner />;
  const settings = data || {};

  async function handleSave(patch) {
    try {
      await updateSettings({ ...settings, ...patch }).unwrap();
      toast('Payroll settings saved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save settings.'), 'err');
    }
  }

  return (
    <div className="fade-in">
      <CompanyCard settings={settings} onSave={handleSave} saving={saving} />
      <SalaryRulesCard settings={settings} onSave={handleSave} saving={saving} />
      <StatutoryCard settings={settings} onSave={handleSave} saving={saving} />
      <ComponentsMasterCard settings={settings} onSave={handleSave} saving={saving} />
      <CalendarRulesCard settings={settings} onSave={handleSave} saving={saving} />
    </div>
  );
}
