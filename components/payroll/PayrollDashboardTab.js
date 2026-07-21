'use client';

import { useGetPayrollDashboardQuery } from '@/lib/services/payrollApi';
import { fmtCurrency, fmtDate, MONTH_NAMES } from '@/lib/utils/format';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import KpiCard from './KpiCard';
import PayrollTrendChart from './charts/PayrollTrendChart';
import DepartmentDistributionChart from './charts/DepartmentDistributionChart';
import AttendanceVsPayrollChart from './charts/AttendanceVsPayrollChart';
import SalaryExpenseChart from './charts/SalaryExpenseChart';
import BonusDistributionChart from './charts/BonusDistributionChart';
import {
  UsersIcon,
  UserIcon,
  CheckSquareIcon,
  ClockIcon,
  MoneyIcon,
  GiftIcon,
  TrendUpIcon,
  CheckIcon,
  CalendarIcon,
  PlusIcon,
  DownloadIcon,
  ReceiptIcon,
} from '../icons';

export default function PayrollDashboardTab({ onNavigate }) {
  const now = new Date();
  const { data, isLoading } = useGetPayrollDashboardQuery({ month: now.getMonth() + 1, year: now.getFullYear() });

  if (isLoading) return <Spinner />;
  if (!data) return <EmptyState>Payroll dashboard data isn&apos;t available yet</EmptyState>;

  const s = data.summary || {};
  const recent = data.recentActivities || {};

  return (
    <div className="fade-in">
      <div className="kpi-grid">
        <KpiCard icon={UsersIcon} tone="ind" label="Total Employees" value={s.totalEmployees ?? 0} />
        <KpiCard icon={UserIcon} tone="grn" label="Active Employees" value={s.activeEmployees ?? 0} />
        <KpiCard icon={UserIcon} tone="red" label="Inactive Employees" value={s.inactiveEmployees ?? 0} />
        <KpiCard icon={CheckIcon} tone="grn" label="Salary Generated" value={s.salaryGenerated ?? 0} />
        <KpiCard icon={ClockIcon} tone="amb" label="Pending Payroll" value={s.pendingPayroll ?? 0} />
        <KpiCard icon={MoneyIcon} tone="ind" label="Payroll Amount" value={s.payrollAmount ?? 0} format={fmtCurrency} />
        <KpiCard icon={GiftIcon} tone="blu" label="Total Bonus" value={s.totalBonus ?? 0} format={fmtCurrency} />
        <KpiCard icon={TrendUpIcon} tone="red" label="Total Deductions" value={s.totalDeductions ?? 0} format={fmtCurrency} />
        <KpiCard icon={CheckSquareIcon} tone="amb" label="Pending Approvals" value={s.pendingApprovals ?? 0} />
        <KpiCard icon={CalendarIcon} tone="ind" label={`${MONTH_NAMES[now.getMonth()]} Status`} value={s.todayStatusPct ?? 0} format={(v) => `${v}%`} />
      </div>

      <div className="sec-h">
        <div className="sec-t">Quick actions</div>
      </div>
      <div className="pqa-grid">
        <button className="qa-btn" onClick={() => onNavigate('generate')}>
          <div className="qa-icon"><PlusIcon /></div>
          <span className="qa-lbl">Generate Payroll</span>
        </button>
        <button className="qa-btn" onClick={() => onNavigate('bonuses')}>
          <div className="qa-icon"><GiftIcon /></div>
          <span className="qa-lbl">Add Bonus</span>
        </button>
        <button className="qa-btn" onClick={() => onNavigate('reimbursements')}>
          <div className="qa-icon"><ReceiptIcon /></div>
          <span className="qa-lbl">Add Reimbursement</span>
        </button>
        <button className="qa-btn" onClick={() => onNavigate('reports')}>
          <div className="qa-icon"><DownloadIcon /></div>
          <span className="qa-lbl">Download Payroll</span>
        </button>
        <button className="qa-btn" onClick={() => onNavigate('slips')}>
          <div className="qa-icon"><MoneyIcon /></div>
          <span className="qa-lbl">Salary Slips</span>
        </button>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Monthly Payroll Trend</div></div>
          <PayrollTrendChart data={data.trend} />
        </div>
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Department Salary Distribution</div></div>
          <DepartmentDistributionChart data={data.departmentDistribution} />
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Attendance vs Payroll</div></div>
          <AttendanceVsPayrollChart data={data.attendanceVsPayroll} />
        </div>
        <div className="chart-card">
          <div className="sec-h"><div className="sec-t">Salary Expense</div></div>
          <SalaryExpenseChart data={data.salaryExpense} />
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: 12 }}>
        <div className="sec-h"><div className="sec-t">Bonus Distribution</div></div>
        <BonusDistributionChart data={data.bonusDistribution} />
      </div>

      <div className="card">
        <div className="card-label">Latest salary generated</div>
        {recent.salaries?.length ? (
          recent.salaries.map((item) => (
            <div className="drow" key={item.id || item._id}>
              <div className="drow-info">
                <div className="drow-title">{item.employeeName || item.name}</div>
                <div className="drow-sub">{fmtDate(item.date || item.createdAt)}</div>
              </div>
              <div className="drow-amt">{fmtCurrency(item.netSalary || item.amount)}</div>
            </div>
          ))
        ) : (
          <EmptyState>No salary slips generated recently</EmptyState>
        )}
      </div>

      <div className="card">
        <div className="card-label">Latest reimbursements</div>
        {recent.reimbursements?.length ? (
          recent.reimbursements.map((item) => (
            <div className="drow" key={item.id || item._id}>
              <div className="drow-info">
                <div className="drow-title">{item.employeeName || item.name}</div>
                <div className="drow-sub">{item.category} · {fmtDate(item.date || item.createdAt)}</div>
              </div>
              <div className="drow-amt">{fmtCurrency(item.amount)}</div>
            </div>
          ))
        ) : (
          <EmptyState>No reimbursements submitted recently</EmptyState>
        )}
      </div>

      <div className="card">
        <div className="card-label">Pending approvals</div>
        {recent.approvals?.length ? (
          recent.approvals.map((item) => (
            <div className="drow" key={item.id || item._id}>
              <div className="drow-info">
                <div className="drow-title">{item.employeeName || item.name}</div>
                <div className="drow-sub">{item.type}</div>
              </div>
              <span className="chip chip-pending">Pending</span>
            </div>
          ))
        ) : (
          <EmptyState>Nothing waiting on approval</EmptyState>
        )}
      </div>
    </div>
  );
}
