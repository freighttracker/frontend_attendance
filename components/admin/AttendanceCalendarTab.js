'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import EmptyState from '../ui/EmptyState';

// Admin view of any one employee's attendance calendar - pick an employee,
// AttendanceCalendar handles the month navigation and data itself.
export default function AttendanceCalendarTab() {
  const { data: usersData, isLoading } = useGetUsersQuery({ page: 1, limit: 300, role: 'employee' });
  const { items } = unwrapList(usersData);
  const employees = items.map(normalizeUser);
  const [selectedId, setSelectedId] = useState('');

  const selected = employees.find((e) => e.id === selectedId);

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <select className="fi" style={{ minWidth: 240 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select an employee…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.employeeCode} · {e.department || 'No dept'}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        {isLoading ? null : selectedId ? (
          <AttendanceCalendar userId={selectedId} employeeLabel={selected ? `${selected.name} (${selected.employeeCode})` : ''} />
        ) : (
          <EmptyState>Select an employee above to view their attendance calendar</EmptyState>
        )}
      </div>
    </div>
  );
}
