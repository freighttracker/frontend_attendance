'use client';

import { useState } from 'react';
import {
  useGetSettingQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useGetAttendanceRulesQuery,
  useDeleteAttendanceRuleMutation,
  useGetSandwichPolicyQuery,
  useUpdateSandwichPolicyMutation,
} from '@/lib/services/settingsApi';
import { useGetWeekendConfigsQuery, useBulkUpdateWeekendConfigsMutation } from '@/lib/services/weekendsApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import AttendanceRuleModal from './AttendanceRuleModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { EditIcon, TrashIcon } from '../icons';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function CompanyNameForm({ initialValue }) {

  const [createSetting] = useCreateSettingMutation();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();
  const toast = useToast();
  const [value, setValue] = useState(initialValue);

  async function handleSave() {
    try {
      await updateSetting({ key: 'company_name', settingValue: value }).unwrap();
      toast('Company name saved');
    } catch {
      try {
        await createSetting({ settingKey: 'company_name', settingValue: value, description: 'Company display name' }).unwrap();
        toast('Company name saved');
      } catch (err) {
        toast(extractErrorMessage(err, 'Could not save setting.'), 'err');
      }
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Company name</label>
        <input className="fi" placeholder="AttendanceHR" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="btn btn-p btn-sm" disabled={saving} onClick={handleSave}>
         {saving ? 'Saving…' : 'Save'}
      </button>
    </>
  );
}

function CompanySettingCard() {

  const { data, isLoading } = useGetSettingQuery('company_name');
  return (
    <div className="card">
      <div className="card-label">Company</div>
      {isLoading ? <Spinner /> : <CompanyNameForm initialValue={data?.settingValue ?? ''} />}
    </div>
  );
}

function AttendanceRulesCard() {
  
  const { data, isLoading } = useGetAttendanceRulesQuery();
  const [deleteRule, { isLoading: deleting }] = useDeleteAttendanceRuleMutation();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { items } = unwrapList(data);

  async function handleDelete() {
    try {
      await deleteRule(deleteTarget.id).unwrap();
      toast('Attendance rule removed');
      setDeleteTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not remove rule.'), 'err');
    }
  }

  return (
    <div className="card">
      <div className="card-label">Attendance rules</div>
      {isLoading ? (
        <Spinner />
      ) : items.length ? (
        items.map((rule) => (
          <div className="togrow" key={rule._id}>
            <div className="togtxt">
              <div className="tl">
                {rule.ruleName} {rule.isDefault ? '· Default' : ''}
              </div>
              <div className="ts">
                {rule.checkInTime}–{rule.checkOutTime} · grace {rule.gracePeriodMinutes}m
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="ib"
                onClick={() => {
                  setEditingRule({ id: rule._id, ...rule });
                  setModalOpen(true);
                }}
              >
                <EditIcon />
              </button>
              <button className="ib del" onClick={() => setDeleteTarget({ id: rule._id, name: rule.name })}>
                <TrashIcon />
              </button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState>No attendance rules configured</EmptyState>
      )}
      <button
        className="btn btn-p btn-sm"
        style={{ marginTop: 12 }}
        onClick={() => {
          setEditingRule(null);
          setModalOpen(true);
        }}
      >
        + Add rule
      </button>

      <AttendanceRuleModal open={modalOpen} onClose={() => setModalOpen(false)} rule={editingRule} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Remove Rule?"
        subtitle={
          <>
            Remove attendance rule <b>{deleteTarget?.name}</b>?
          </>
        }
      />
    </div>
  );
}

function SandwichPolicyForm({ initialEnabled, initialMinDays }) {
  const [updatePolicy, { isLoading: saving }] = useUpdateSandwichPolicyMutation();
  const toast = useToast();
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [minLeaveDays, setMinLeaveDays] = useState(initialMinDays);

  async function handleSave() {
    try {
      await updatePolicy({ isEnabled, minLeaveDays: Number(minLeaveDays) }).unwrap();
      toast('Sandwich policy saved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save policy.'), 'err');
    }
  }

  return (
    <>
      <div className="togrow">
        <div className="togtxt">
          <div className="tl">Enable sandwich policy</div>
          <div className="ts">Weekends between leave days also count as leave</div>
        </div>
        <label className="tog">
          <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
          <span className="tog-sl" />
        </label>
      </div>
      <div className="ff" style={{ marginTop: 8 }}>
        <label className="fl">Minimum leave days to trigger</label>
        <input className="fi" type="number" min="1" value={minLeaveDays} onChange={(e) => setMinLeaveDays(e.target.value)} />
      </div>
      <button className="btn btn-p btn-sm" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </>
  );
}

function SandwichPolicyCard() {
  const { data, isLoading } = useGetSandwichPolicyQuery();
  return (
    <div className="card">
      <div className="card-label">Sandwich leave policy</div>
      {isLoading ? <Spinner /> : <SandwichPolicyForm initialEnabled={Boolean(data?.isEnabled)} initialMinDays={data?.minLeaveDays ?? 3} />}
    </div>
  );
}

function WeekendConfigForm({ initialConfigs }) {
  const [bulkUpdate, { isLoading: saving }] = useBulkUpdateWeekendConfigsMutation();
  const toast = useToast();
  const [configs, setConfigs] = useState(initialConfigs);

  async function handleSave() {
    try {
      await bulkUpdate({ configs: WEEKDAYS.map((day) => ({ dayOfWeek: day, isWeekend: Boolean(configs[day]) })) }).unwrap();
      toast('Weekend configuration saved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not save weekend configuration.'), 'err');
    }
  }

  return (
    <>
      {WEEKDAYS.map((day) => (
        <div className="togrow" key={day}>
          <div className="togtxt">
            <div className="tl" style={{ textTransform: 'capitalize' }}>
              {day}
            </div>
          </div>
          <label className="tog">
            <input type="checkbox" checked={Boolean(configs[day])} onChange={(e) => setConfigs((c) => ({ ...c, [day]: e.target.checked }))} />
            <span className="tog-sl" />
          </label>
        </div>
      ))}
      <button className="btn btn-p btn-sm" style={{ marginTop: 12 }} disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save weekend configuration'}
      </button>
    </>
  );
}

function WeekendConfigCard() {
  const { data, isLoading } = useGetWeekendConfigsQuery();
  const { items } = unwrapList(data);
  const initialConfigs = {};
  items.forEach((c) => {
    initialConfigs[c.dayOfWeek] = c.isWeekend;
  });

  return (
    <div className="card">
      <div className="card-label">Weekend configuration</div>
      {isLoading ? <Spinner /> : <WeekendConfigForm key={items.length} initialConfigs={initialConfigs} />}
    </div>
  );
}

export default function SettingsTab() {
  return (
    <div>
      <CompanySettingCard />
      <AttendanceRulesCard />
      <SandwichPolicyCard />
      <WeekendConfigCard />
    </div>
  );
}
