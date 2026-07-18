'use client';

import { useState } from 'react';
import { useLazyGetPayrollReportQuery, useExportPayrollReportMutation } from '@/lib/services/payrollApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import PayrollTrendChart from './charts/PayrollTrendChart';
import DepartmentDistributionChart from './charts/DepartmentDistributionChart';
import SalaryExpenseChart from './charts/SalaryExpenseChart';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { DownloadIcon } from '../icons';

const REPORT_TYPES = [
  { key: 'salaryTrend', label: 'Salary Trend', Chart: PayrollTrendChart },
  { key: 'departmentExpense', label: 'Department Expense', Chart: DepartmentDistributionChart },
  { key: 'monthlyExpense', label: 'Monthly Expense', Chart: SalaryExpenseChart },
  { key: 'yearlyExpense', label: 'Yearly Expense', Chart: SalaryExpenseChart },
];

export default function PayrollReportsTab() {
  const now = new Date();
  const [reportKey, setReportKey] = useState(REPORT_TYPES[0].key);
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState(String(now.getFullYear()));

  const [triggerReport, { data, isFetching }] = useLazyGetPayrollReportQuery();
  const [exportReport, { isLoading: exporting }] = useExportPayrollReportMutation();
  const toast = useToast();

  const config = REPORT_TYPES.find((r) => r.key === reportKey);

  function handleGenerate() {
    triggerReport({ type: reportKey, department, year });
  }

  async function handleExport(format) {
    try {
      const blob = await exportReport({ type: reportKey, department, year, format }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${reportKey}-${year}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not export report.'), 'err');
    }
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-label">Payroll reports</div>
        <div className="filters-bar">
          <select className="fi" value={reportKey} onChange={(e) => setReportKey(e.target.value)}>
            {REPORT_TYPES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <input className="fi" placeholder="Department (optional)" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ width: 160 }} />
          <input className="fi" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 90 }} />
          <button className="btn btn-p btn-sm" onClick={handleGenerate}>
            Generate
          </button>
        </div>
        <div className="slip-toolbar">
          <button className="btn btn-g btn-sm" disabled={!data || exporting} onClick={() => handleExport('xlsx')}>
            <DownloadIcon style={{ width: 13, height: 13 }} /> Excel
          </button>
          <button className="btn btn-g btn-sm" disabled={!data || exporting} onClick={() => handleExport('pdf')}>
            <DownloadIcon style={{ width: 13, height: 13 }} /> PDF
          </button>
          <button className="btn btn-g btn-sm" disabled={!data || exporting} onClick={() => handleExport('csv')}>
            <DownloadIcon style={{ width: 13, height: 13 }} /> CSV
          </button>
        </div>
      </div>

      <div className="chart-card">
        <div className="sec-h"><div className="sec-t">{config.label}</div></div>
        {isFetching ? <Spinner /> : data ? <config.Chart data={data} /> : <EmptyState>Select filters and click Generate</EmptyState>}
      </div>
    </div>
  );
}
