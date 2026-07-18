'use client';

import { useState } from 'react';
import { useGetHolidaysQuery, useDeleteHolidayMutation } from '@/lib/services/holidaysApi';
import { normalizeHoliday } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDayMonth, fmtDate, DAY_NAMES } from '@/lib/utils/format';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import AddHolidayModal from './AddHolidayModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { TrashIcon } from '../icons';

export default function HolidaysTab() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useGetHolidaysQuery({ year });
  const [deleteHoliday, { isLoading: deleting }] = useDeleteHolidayMutation();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { items } = unwrapList(data);
  const holidays = items.map(normalizeHoliday).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  async function handleDelete() {
    try {
      await deleteHoliday(deleteTarget.id).unwrap();
      toast('Holiday removed');
      setDeleteTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not remove holiday.'), 'err');
    }
  }

  return (
    <div>
      <button className="btn btn-p btn-sm" style={{ marginBottom: 11 }} onClick={() => setAddOpen(true)}>
        + Add holiday
      </button>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : holidays.length ? (
          holidays.map((h) => {
            const { mo, dd } = fmtDayMonth(h.date);
            const dayName = h.date ? DAY_NAMES[new Date(`${h.date}T00:00:00`).getDay()] : '';
            return (
              <div className="hrow" key={h.id}>
                <div className="hdate">
                  <span className="mo">{mo}</span>
                  <span className="dd">{dd}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="hname">{h.name}</div>
                  <div className="hday">
                    {dayName} · {fmtDate(h.date)}
                  </div>
                </div>
                <span className="htag">{h.type}</span>
                <button className="ib del" onClick={() => setDeleteTarget(h)} title="Remove">
                  <TrashIcon />
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState>No holidays added yet</EmptyState>
        )}
      </div>
      <AddHolidayModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Remove Holiday?"
        subtitle={<>Remove <b>{deleteTarget?.name}</b> from the holiday calendar?</>}
      />
    </div>
  );
}
