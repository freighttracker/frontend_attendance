'use client';

import { useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/authSlice';
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
import AttendanceCalendarTab from '@/components/admin/AttendanceCalendarTab';
import CompanyManagementTab from '@/components/admin/CompanyManagementTab';
import SettingsTab from '@/components/admin/SettingsTab';

const TABS = [
  { key: 'employees', label: 'Employees' },
  { key: 'leave', label: 'Leave' },
  { key: 'salary', label: 'Salary' },
  { key: 'salaryFields', label: 'Salary Fields' },
  { key: 'corrections', label: 'Correct' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'attendanceReport', label: 'Attendance Report' },
  { key: 'attendanceCalendar', label: 'Calendar' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

// A platform Super Admin's entire job is creating/managing companies - they
// don't touch any single company's day-to-day HR data. They get a
// dedicated, minimal screen instead of the full operational admin panel,
// which stays completely unchanged for 'admin' and company/subcompany admins.
function SuperAdminHome() {
  return (
    <>
      <div className="ph">
        <h1>Super Admin</h1>
        <p>Create and manage companies across the platform</p>
      </div>
      <CompanyManagementTab />
    </>
  );
}

export default function AdminPage() {
  const user = useAppSelector(selectCurrentUser);
  const isPlatformSuperAdmin = user?.role === 'superadmin';

  const [active, setActive] = useState('employees');
  const { data } = useGetAllLeavesQuery({ status: 'pending', page: 1, limit: 100 }, { skip: isPlatformSuperAdmin });
  const { items, pagination } = unwrapList(data);
  const pendingCount = pagination?.total ?? items.length;

  if (isPlatformSuperAdmin) {
    return <SuperAdminHome />;
  }

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
      {active === 'corrections' ? <CorrectionsTab /> : null}
      {active === 'attendanceCalendar' ? <AttendanceCalendarTab /> : null}
      {active === 'salaryFields' ? <SalaryFieldsTab /> : null}
      {active === 'holidays' ? <HolidaysTab /> : null}
      {active === 'attendanceReport' ? <AttendanceReportTab /> : null}
      {active === 'reports' ? <ReportsTab /> : null}
      {active === 'settings' ? <SettingsTab /> : null}
    </>
  );
}
