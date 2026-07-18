'use client';

import { useGetHolidaysQuery } from '@/lib/services/holidaysApi';
import { normalizeHoliday } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDayMonth, todayISO, DAY_NAMES } from '@/lib/utils/format';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateStr}T00:00:00`) - today) / 86400000);
}

export default function UpcomingHolidays() {
  const year = new Date().getFullYear();
  const { data, isLoading } = useGetHolidaysQuery({ year, isActive: true });
  const { items } = unwrapList(data);
  const today = todayISO();
  const upcoming = items
    .map(normalizeHoliday)
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 14 }}>
        <span className="sec-t">Upcoming holidays</span>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : upcoming.length ? (
          upcoming.map((h) => {
            const { mo, dd } = fmtDayMonth(h.date);
            const dl = daysUntil(h.date);
            const dayName = DAY_NAMES[new Date(`${h.date}T00:00:00`).getDay()];
            return (
              <div className="hrow" key={h.id}>
                <div className="hdate">
                  <span className="mo">{mo}</span>
                  <span className="dd">{dd}</span>
                </div>
                <div>
                  <div className="hname">{h.name}</div>
                  <div className="hday">
                    {dayName} · {dl === 0 ? 'Today' : dl === 1 ? 'Tomorrow' : `In ${dl}d`}
                  </div>
                </div>
                <span className="htag">{h.type}</span>
              </div>
            );
          })
        ) : (
          <EmptyState>No upcoming holidays</EmptyState>
        )}
      </div>
    </>
  );
}
