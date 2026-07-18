'use client';

import { useGetAttendanceHistoryQuery } from '@/lib/services/attendanceApi';
import { normalizeAttendanceRecord } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { pad } from '@/lib/utils/format';

export default function StatsRow() {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const endDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
  const { data } = useGetAttendanceHistoryQuery({ startDate, endDate, limit: 100 });
  const { items } = unwrapList(data);
  const records = items.map(normalizeAttendanceRecord);

  const present = records.filter((r) => r.status === 'present').length;
  const halfDay = records.filter((r) => r.status === 'half_day').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const total = records.length || 1;
  const presentPct = Math.round((present / total) * 100);

  return (
    <div className="stats-row">
      <div className="stat">
        <div className="stat-v">{present}</div>
        <div className="stat-l">Present</div>
        <div className="stat-s">{records.length ? `${presentPct}%` : ''}</div>
      </div>
      <div className="stat">
        <div className="stat-v">{halfDay}</div>
        <div className="stat-l">Half day</div>
      </div>
      <div className="stat">
        <div className="stat-v">{absent}</div>
        <div className="stat-l">Absent</div>
      </div>
    </div>
  );
}
