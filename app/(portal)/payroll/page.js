'use client';

import { useState } from 'react';
import { useGetReimbursementsQuery } from '@/lib/services/reimbursementApi';
import { unwrapList } from '@/lib/utils/queryParams';
import PayrollTabs from '@/components/payroll/PayrollTabs';
import PayrollDashboardTab from '@/components/payroll/PayrollDashboardTab';
import SalaryStructureTab from '@/components/payroll/SalaryStructureTab';
import GeneratePayrollTab from '@/components/payroll/GeneratePayrollTab';
import SalarySlipsTab from '@/components/payroll/SalarySlipsTab';
import BonusesTab from '@/components/payroll/BonusesTab';
import ReimbursementsTab from '@/components/payroll/ReimbursementsTab';
import LoansTab from '@/components/payroll/LoansTab';
import PayrollReportsTab from '@/components/payroll/PayrollReportsTab';
import PayrollSettingsTab from '@/components/payroll/PayrollSettingsTab';
import SalaryReportTab from '@/components/payroll/SalaryReportTab';
import MonthlySummaryTab from '@/components/payroll/MonthlySummaryTab';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'structure', label: 'Salary Structure' },
  { key: 'generate', label: 'Generate' },
  { key: 'slips', label: 'Salary Slips' },
  { key: 'bonuses', label: 'Bonuses' },
  { key: 'reimbursements', label: 'Reimbursements' },
  { key: 'loans', label: 'Loans' },
  { key: 'salaryReport', label: 'Salary Report' },
  { key: 'monthlySummary', label: 'Monthly Summary' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

export default function PayrollPage() {
  const [active, setActive] = useState('dashboard');
  const { data } = useGetReimbursementsQuery({ status: 'pending', page: 1, limit: 100 });
  const { items, pagination } = unwrapList(data);
  const pendingCount = pagination?.total ?? items.length;

  return (
    <>
      <div className="ph">
        <h1>Payroll</h1>
        <p>Salaries, bonuses, reimbursements &amp; loans</p>
      </div>
      <PayrollTabs tabs={TABS} active={active} onChange={setActive} pendingCount={pendingCount} />

      {active === 'dashboard' ? <PayrollDashboardTab onNavigate={setActive} /> : null}
      {active === 'structure' ? <SalaryStructureTab /> : null}
      {active === 'generate' ? <GeneratePayrollTab /> : null}
      {active === 'slips' ? <SalarySlipsTab /> : null}
      {active === 'bonuses' ? <BonusesTab /> : null}
      {active === 'reimbursements' ? <ReimbursementsTab /> : null}
      {active === 'loans' ? <LoansTab /> : null}
      {active === 'salaryReport' ? <SalaryReportTab /> : null}
      {active === 'monthlySummary' ? <MonthlySummaryTab /> : null}
      {active === 'reports' ? <PayrollReportsTab /> : null}
      {active === 'settings' ? <PayrollSettingsTab /> : null}
    </>
  );
}
