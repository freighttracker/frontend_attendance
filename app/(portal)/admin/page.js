'use client';

import { useState } from 'react';
import { useGetAllLeavesQuery } from '@/lib/services/leavesApi';
import { unwrapList } from '@/lib/utils/queryParams';
import AdminTabs from '@/components/admin/AdminTabs';
import EmployeesTab from '@/components/admin/EmployeesTab';
import LeaveTab from '@/components/admin/LeaveTab';
import SalaryTab from '@/components/admin/SalaryTab';
import SalaryFieldsTab from '@/components/admin/SalaryFieldsTab';
import CorrectionsTab from '@/components/admin/CorrectionsTab';
import HolidaysTab from '@/components/admin/HolidaysTab';
import ReportsTab from '@/components/admin/ReportsTab';
import AttendanceReportTab from '@/components/admin/AttendanceReportTab';
import SettingsTab from '@/components/admin/SettingsTab';

const TABS = [
  { key: 'employees', label: 'Employees' },
  { key: 'leave', label: 'Leave' },
  { key: 'salary', label: 'Salary' },
  { key: 'salaryFields', label: 'Salary Fields' },
  { key: 'corrections', label: 'Correct' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'attendanceReport', label: 'Attendance Report' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

export default function AdminPage() {
  const [active, setActive] = useState('employees');
  const { data } = useGetAllLeavesQuery({ status: 'pending', page: 1, limit: 100 });
  const { items, pagination } = unwrapList(data);
  const pendingCount = pagination?.total ?? items.length;

  return (
    <>
      <div className="ph">
        <h1>Admin Panel</h1>
        <p>Manage team, attendance &amp; payroll</p>
      </div>
      <AdminTabs tabs={TABS} active={active} onChange={setActive} pendingCount={pendingCount} />

      {active === 'employees' ? <EmployeesTab /> : null}
      {active === 'leave' ? <LeaveTab /> : null}
      {active === 'salary' ? <SalaryTab /> : null}
      {active === 'salaryFields' ? <SalaryFieldsTab /> : null}
      {active === 'corrections' ? <CorrectionsTab /> : null}
      {active === 'holidays' ? <HolidaysTab /> : null}
      {active === 'attendanceReport' ? <AttendanceReportTab /> : null}
      {active === 'reports' ? <ReportsTab /> : null}
      {active === 'settings' ? <SettingsTab /> : null}
    </>
  );
}
