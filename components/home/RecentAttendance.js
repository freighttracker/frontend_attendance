'use client';

import Link from 'next/link';
import { useGetAttendanceHistoryQuery } from '@/lib/services/attendanceApi';
import { normalizeAttendanceRecord } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import AttendanceRow from '../attendance/AttendanceRow';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

export default function RecentAttendance() {
  const { data, isLoading } = useGetAttendanceHistoryQuery({ page: 1, limit: 6 });
  const { items } = unwrapList(data);
  const records = items.map(normalizeAttendanceRecord);

  return (
    <>
      <div className="sec-h">
        <span className="sec-t">Recent attendance</span>
        <Link href="/history" className="sec-a">
          See all
        </Link>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : records.length ? (
          records.map((r) => <AttendanceRow key={r.id} record={r} />)
        ) : (
          <EmptyState>No records yet — check in to get started</EmptyState>
        )}
      </div>
    </>
  );
}
