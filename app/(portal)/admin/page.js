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
import OvertimeTab from '@/components/admin/OvertimeTab';
import LateArrivalsTab from '@/components/admin/LateArrivalsTab';
import HalfDaysTab from '@/components/admin/HalfDaysTab';
import HolidaysTab from '@/components/admin/HolidaysTab';
import ReportsTab from '@/components/admin/ReportsTab';
import AttendanceReportTab from '@/components/admin/AttendanceReportTab';
import AttendanceCalendarTab from '@/components/admin/AttendanceCalendarTab';
import CompanyManagementTab from '@/components/admin/CompanyManagementTab';
import SettingsTab from '@/components/admin/SettingsTab';
import DashboardTab from '@/components/admin/DashboardTab';
import OfficeLocationsTab from '@/components/admin/OfficeLocationsTab';
import AttendanceLocationsTab from '@/components/admin/AttendanceLocationsTab';
import GeoAuditTab from '@/components/admin/GeoAuditTab';
import CompanyHierarchySelector from '@/components/admin/CompanyHierarchySelector';
import { useGetMyGeoPermissionsQuery } from '@/lib/services/geoApi';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employees', label: 'Employees' },
  { key: 'leave', label: 'Leave' },
  { key: 'corrections', label: 'Corrections' },
  { key: 'salary', label: 'Salary' },
  { key: 'salaryFields', label: 'Salary Fields' },
  { key: 'overtime', label: 'Overtime' },
  { key: 'late', label: 'Late Arrivals' },
  { key: 'halfDays', label: 'Half Days' },
  { key: 'attendanceCalendar', label: 'Calendar' },
  { key: 'reports', label: 'Reports' },
  { key: 'attendanceReport', label: 'Attendance Report' },
  { key: 'holidays', label: 'Holidays' },
  { key: 'settings', label: 'Settings' },
];

// Single source of truth for the admin tab order.
const TAB_ORDER = [
  'dashboard',
  'corrections',
  'attendanceCalendar',
  'offices',               // not in your list, kept next to Attendance Locations
  'attendanceLocations',
  'attendanceReport',
  'employees',
  'leave',
  'salary',
  'salaryFields',
  'overtime',
  'late',
  'halfDays',
  'reports',
  'holidays',              // not in your list, kept just before Settings
  'settings',
  'geoAudit',
];

function orderTabs(list) {
  const rank = (key) => {
    const i = TAB_ORDER.indexOf(key);
    return i === -1 ? TAB_ORDER.length : i; // unknown tabs go last
  };
  return [...list].sort((a, b) => rank(a.key) - rank(b.key));
}

// A platform Super Admin's entire job is creating/managing companies - they
// don't touch any single company's day-to-day HR data. They get a
// dedicated, minimal screen instead of the full operational admin panel,
// which stays completely unchanged for 'admin' and company/subcompany admins.
const SUPER_ADMIN_TABS = [
  { key: 'companies', label: 'Companies' },
  { key: 'offices', label: 'Office Locations' },
  { key: 'attendanceLocations', label: 'Attendance Locations' },
  { key: 'geoAudit', label: 'Location Audit' },
];

// Location tabs a company-level admin sees, gated by their (server-checked)
// location permissions so nobody is shown a tab that would only 403.
function geoTabsFor(perms, role) {
  if (!perms) return [];
  const tabs = [];
  if (perms.canManageOffices || perms.canManageAssignments || perms.canViewLocations || perms.canReviewExceptions) {
    tabs.push({ key: 'offices', label: 'Office Locations' });
  }
  if (perms.canViewLocations) tabs.push({ key: 'attendanceLocations', label: 'Attendance Locations' });
  if (role === 'admin') tabs.push({ key: 'geoAudit', label: 'Location Audit' });
  return tabs;
}

function SuperAdminHome() {
  const [active, setActive] = useState('companies');
  const [scope, setScope] = useState({ companyId: '', subCompanyId: '' });
  const companyId = scope.companyId || undefined;

  return (
    <>
      <div className="ph">
        <h1>Super Admin</h1>
        <p>Create and manage companies across the platform</p>
      </div>
      <AdminTabs tabs={SUPER_ADMIN_TABS} active={active} onChange={setActive} />
      {active !== 'companies' ? (
        <div className="card">
          <CompanyHierarchySelector value={scope} onChange={(v) => setScope({ companyId: v.companyId, subCompanyId: '' })} />
          <div className="geo-sub" style={{ marginTop: 6 }}>
            {companyId ? 'Showing the selected company.' : 'All companies. The policy shown is the platform default.'}
          </div>
        </div>
      ) : null}
      {active === 'companies' ? <CompanyManagementTab /> : null}
      {active === 'offices' ? <OfficeLocationsTab key={companyId || 'all'} companyId={companyId} isPlatformAdmin /> : null}
      {active === 'attendanceLocations' ? <AttendanceLocationsTab key={companyId || 'all'} companyId={companyId} /> : null}
      {active === 'geoAudit' ? <GeoAuditTab key={companyId || 'all'} companyId={companyId} /> : null}
    </>
  );
}

export default function AdminPage() {

  const user = useAppSelector(selectCurrentUser);
  const isPlatformSuperAdmin = user?.role === 'superadmin';

  const [active, setActive] = useState('dashboard');
  const { data } = useGetAllLeavesQuery({ status: 'pending', page: 1, limit: 100 }, { skip: isPlatformSuperAdmin });
  const { items, pagination } = unwrapList(data);
  const pendingCount = pagination?.total ?? items.length;
  const { data: geoPerms } = useGetMyGeoPermissionsQuery(undefined, { skip: isPlatformSuperAdmin });
  const tabs = orderTabs([...TABS, ...geoTabsFor(geoPerms, user?.role)]);

  if (isPlatformSuperAdmin) {
    return <SuperAdminHome />;
  }

  return (
    <>
      <div className="ph">
        <h1>Admin Panel</h1>
        <p>Manage team, attendance &amp; payroll</p>
      </div>
      <AdminTabs tabs={tabs} active={active} onChange={setActive} pendingCount={pendingCount} />

        {active === 'dashboard' ? <DashboardTab onNavigate={setActive} /> : null}
        {active === 'employees' ? <EmployeesTab /> : null}
        {active === 'leave' ? <LeaveTab /> : null}
        {active === 'salary' ? <SalaryTab /> : null}
        {active === 'corrections' ? <CorrectionsTab /> : null}
        {active === 'overtime' ? <OvertimeTab /> : null}
        {active === 'late' ? <LateArrivalsTab /> : null}
        {active === 'halfDays' ? <HalfDaysTab /> : null}
        {active === 'attendanceCalendar' ? <AttendanceCalendarTab /> : null}
        {active === 'salaryFields' ? <SalaryFieldsTab /> : null}
        {active === 'holidays' ? <HolidaysTab /> : null}
        {active === 'attendanceReport' ? <AttendanceReportTab /> : null}
        {active === 'reports' ? <ReportsTab /> : null}
        {active === 'settings' ? <SettingsTab /> : null}
        {active === 'offices' ? <OfficeLocationsTab /> : null}
        {active === 'attendanceLocations' ? <AttendanceLocationsTab /> : null}
        {active === 'geoAudit' ? <GeoAuditTab /> : null}

    </>
  );
}
