'use client';

import { Fragment, useMemo, useState } from 'react';
import { useGetAllSalarySlipsQuery } from '@/lib/services/salaryApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtCurrency, MONTH_NAMES } from '@/lib/utils/format';
import { SalaryStatusPill } from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { DownloadIcon } from '../icons';
import { toRow, csvCell, saveBlob } from './SalaryReportTab';

const SUM_KEYS = [
  'daysInMonth', 'workingDays', 'presentDays', 'halfDays', 'absentDays', 'paidLeaveDays', 'unpaidLeaveDays',
  'weeklyOffs', 'holidays', 'salaryDays', 'grossSalary', 'totalDeductions', 'netSalary',
];

const round2 = (n) => Math.round(n * 100) / 100;

// Month-by-month view of every generated slip in a year: days and salary
// side by side in one table, optionally narrowed to a single employee.
export default function MonthlySummaryTab() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);
  const [employee, setEmployee] = useState('');
  const [view, setView] = useState('columns');

  const { data, isFetching } = useGetAllSalarySlipsQuery({ year, page: 1, limit: 5000 }, { skip: !year });
  const { items } = unwrapList(data);

  const allRows = useMemo(() => items.map(toRow), [items]);

  const employees = useMemo(() => {
    const map = new Map();
    allRows.forEach((r) => map.set(r.employeeCode, r.name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [allRows]);

  const rows = useMemo(
    () =>
      allRows
        .filter((r) => r.month >= fromMonth && r.month <= toMonth && (!employee || r.employeeCode === employee))
        .sort((a, b) => a.month - b.month || a.name.localeCompare(b.name)),
    [allRows, fromMonth, toMonth, employee]
  );

  const totals = useMemo(() => {
    const t = Object.fromEntries(SUM_KEYS.map((k) => [k, 0]));
    rows.forEach((r) => SUM_KEYS.forEach((k) => { t[k] += Number(r[k]) || 0; }));
    SUM_KEYS.forEach((k) => { t[k] = round2(t[k]); });
    return t;
  }, [rows]);

  // Pivot: one row per employee, one column group (days / present / salary)
  // per month in the selected range.
  const months = useMemo(
    () => Array.from({ length: Math.max(0, toMonth - fromMonth + 1) }, (_, i) => fromMonth + i),
    [fromMonth, toMonth]
  );

  const pivot = useMemo(() => {
    const byEmp = new Map();
    rows.forEach((r) => {
      if (!byEmp.has(r.employeeCode)) {
        byEmp.set(r.employeeCode, {
          employeeCode: r.employeeCode,
          name: r.name,
          department: r.department,
          months: {},
          total: { daysInMonth: 0, presentDays: 0, netSalary: 0 },
        });
      }
      const e = byEmp.get(r.employeeCode);
      e.months[r.month] = r;
      e.total.daysInMonth += r.daysInMonth;
      e.total.presentDays += r.presentDays;
      e.total.netSalary = round2(e.total.netSalary + r.netSalary);
    });
    return [...byEmp.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const monthTotals = useMemo(() => {
    const t = {};
    months.forEach((m) => {
      const inMonth = rows.filter((r) => r.month === m);
      t[m] = {
        daysInMonth: inMonth.reduce((s, r) => s + r.daysInMonth, 0),
        presentDays: inMonth.reduce((s, r) => s + r.presentDays, 0),
        netSalary: round2(inMonth.reduce((s, r) => s + r.netSalary, 0)),
      };
    });
    return t;
  }, [rows, months]);

  function handleDownloadColumns() {
    const header = ['Employee ID', 'Name', 'Department'];
    months.forEach((m) => {
      const label = MONTH_NAMES[m - 1];
      header.push(`${label} Total Days`, `${label} Present`, `${label} Salary`);
    });
    header.push('Total Days', 'Total Present', 'Total Salary');

    const lines = pivot.map((e) => {
      const line = [e.employeeCode, e.name, e.department];
      months.forEach((m) => {
        const r = e.months[m];
        line.push(r ? r.daysInMonth : '', r ? r.presentDays : '', r ? r.netSalary : '');
      });
      line.push(e.total.daysInMonth, e.total.presentDays, e.total.netSalary);
      return line;
    });

    const totalLine = ['TOTAL', '', ''];
    months.forEach((m) => totalLine.push(monthTotals[m].daysInMonth, monthTotals[m].presentDays, monthTotals[m].netSalary));
    totalLine.push(totals.daysInMonth, totals.presentDays, totals.netSalary);

    const csv = [header, ...lines, totalLine].map((line) => line.map(csvCell).join(',')).join('\n');
    const who = employee || 'all';
    saveBlob(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }), `monthly-salary-${who}-${year}-${fromMonth}-${toMonth}.csv`);
  }

  function handleDownload() {
    if (view === 'columns') {
      handleDownloadColumns();
      return;
    }
    const header = [
      'Month', 'Employee ID', 'Name', 'Department', 'Total Days', 'Working Days', 'Present', 'Half Day', 'Absent',
      'Paid Leave', 'Unpaid Leave', 'Week Off', 'Holiday', 'Payable Days', 'Gross Salary', 'Deductions', 'Net Salary', 'Status',
    ];
    const lines = rows.map((r) => [
      `${MONTH_NAMES[r.month - 1]} ${r.year}`, r.employeeCode, r.name, r.department, r.daysInMonth, r.workingDays,
      r.presentDays, r.halfDays, r.absentDays, r.paidLeaveDays, r.unpaidLeaveDays, r.weeklyOffs, r.holidays,
      r.salaryDays, r.grossSalary, r.totalDeductions, r.netSalary, r.status,
    ]);
    const totalLine = [
      'TOTAL', '', '', '', totals.daysInMonth, totals.workingDays, totals.presentDays, totals.halfDays, totals.absentDays,
      totals.paidLeaveDays, totals.unpaidLeaveDays, totals.weeklyOffs, totals.holidays, totals.salaryDays,
      totals.grossSalary, totals.totalDeductions, totals.netSalary, '',
    ];
    const csv = [header, ...lines, totalLine].map((line) => line.map(csvCell).join(',')).join('\n');
    const who = employee || 'all';
    // BOM so Excel reads the file as UTF-8.
    saveBlob(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }), `monthly-summary-${who}-${year}-${fromMonth}-${toMonth}.csv`);
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-label">Monthly summary — days &amp; salary</div>
        <div className="filters-bar">
          <input className="fi" type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 90 }} />
          <select className="fi" value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>From {m}</option>)}
          </select>
          <select className="fi" value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>To {m}</option>)}
          </select>
          <select className="fi" style={{ flex: 1, minWidth: 160 }} value={employee} onChange={(e) => setEmployee(e.target.value)}>
            <option value="">All employees</option>
            {employees.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
          </select>
          <select className="fi" value={view} onChange={(e) => setView(e.target.value)}>
            <option value="columns">Months as columns</option>
            <option value="list">Row per month</option>
          </select>
          <button className="btn btn-p btn-sm" disabled={!rows.length} onClick={handleDownload}>
            <DownloadIcon style={{ width: 13, height: 13 }} /> Download report
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isFetching ? (
          <Spinner />
        ) : rows.length && view === 'columns' ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th rowSpan={2}>Employee ID</th>
                  <th rowSpan={2}>Name</th>
                  {months.map((m) => (
                    <th key={m} colSpan={3} style={{ textAlign: 'center', borderLeft: '1px solid var(--g200)' }}>
                      {MONTH_NAMES[m - 1]}
                    </th>
                  ))}
                  <th colSpan={3} style={{ textAlign: 'center', borderLeft: '1px solid var(--g200)' }}>Total</th>
                </tr>
                <tr>
                  {[...months, 'total'].map((m) => (
                    <Fragment key={m}>
                      <th style={{ borderLeft: '1px solid var(--g200)' }}>Days</th>
                      <th>Present</th>
                      <th>Salary</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivot.map((e) => (
                  <tr key={e.employeeCode}>
                    <td>{e.employeeCode}</td>
                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{e.name}</td>
                    {months.map((m) => {
                      const r = e.months[m];
                      return (
                        <Fragment key={m}>
                          <td style={{ borderLeft: '1px solid var(--g200)' }}>{r ? r.daysInMonth : '—'}</td>
                          <td>{r ? r.presentDays : '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{r ? fmtCurrency(r.netSalary) : '—'}</td>
                        </Fragment>
                      );
                    })}
                    <td style={{ borderLeft: '1px solid var(--g200)', fontWeight: 700 }}>{e.total.daysInMonth}</td>
                    <td style={{ fontWeight: 700 }}>{e.total.presentDays}</td>
                    <td style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtCurrency(e.total.netSalary)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 800 }}>
                  <td colSpan={2}>Total ({pivot.length})</td>
                  {months.map((m) => (
                    <Fragment key={m}>
                      <td style={{ borderLeft: '1px solid var(--g200)' }}>{monthTotals[m].daysInMonth}</td>
                      <td>{monthTotals[m].presentDays}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtCurrency(monthTotals[m].netSalary)}</td>
                    </Fragment>
                  ))}
                  <td style={{ borderLeft: '1px solid var(--g200)' }}>{totals.daysInMonth}</td>
                  <td>{totals.presentDays}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtCurrency(totals.netSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : rows.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Total Days</th>
                  <th>Working Days</th>
                  <th>Present</th>
                  <th>Half Day</th>
                  <th>Absent</th>
                  <th>Leave (paid/unpaid)</th>
                  <th>Week Off</th>
                  <th>Holiday</th>
                  <th>Payable Days</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{MONTH_NAMES[r.month - 1]} {r.year}</td>
                    <td>{r.employeeCode}</td>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td>{r.daysInMonth}</td>
                    <td>{r.workingDays}</td>
                    <td>{r.presentDays}</td>
                    <td>{r.halfDays}</td>
                    <td>{r.absentDays}</td>
                    <td>{r.paidLeaveDays} / {r.unpaidLeaveDays}</td>
                    <td>{r.weeklyOffs}</td>
                    <td>{r.holidays}</td>
                    <td>{r.salaryDays}</td>
                    <td>{fmtCurrency(r.grossSalary)}</td>
                    <td style={{ color: 'var(--red)' }}>−{fmtCurrency(r.totalDeductions)}</td>
                    <td style={{ fontWeight: 800 }}>{fmtCurrency(r.netSalary)}</td>
                    <td><SalaryStatusPill status={r.status} /></td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 800 }}>
                  <td colSpan={3}>Total ({rows.length})</td>
                  <td>{totals.daysInMonth}</td>
                  <td>{totals.workingDays}</td>
                  <td>{totals.presentDays}</td>
                  <td>{totals.halfDays}</td>
                  <td>{totals.absentDays}</td>
                  <td>{totals.paidLeaveDays} / {totals.unpaidLeaveDays}</td>
                  <td>{totals.weeklyOffs}</td>
                  <td>{totals.holidays}</td>
                  <td>{totals.salaryDays}</td>
                  <td>{fmtCurrency(totals.grossSalary)}</td>
                  <td style={{ color: 'var(--red)' }}>−{fmtCurrency(totals.totalDeductions)}</td>
                  <td>{fmtCurrency(totals.netSalary)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No salary slips generated for the selected period.</EmptyState>
        )}
      </div>
    </div>
  );
}
