'use client';

import { Fragment, useMemo, useState } from 'react';
import { useGetAllSalarySlipsQuery, useDownloadSalarySlipMutation } from '@/lib/services/salaryApi';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency, pad, MONTH_NAMES } from '@/lib/utils/format';
import { SalaryStatusPill } from '../ui/StatusPill';
import KpiCard from './KpiCard';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { DownloadIcon, UsersIcon, MoneyIcon, XIcon, TrendUpIcon } from '../icons';

// Flattens a raw SalarySlip document into the fields the report shows. Every
// figure comes from the slip itself (what payroll actually calculated and
// saved), never re-derived from the current salary structure.
export function toRow(slip) {
  const att = slip.attendanceSummary || {};
  const emp = slip.employeeSnapshot || {};
  const user = slip.user && typeof slip.user === 'object' ? slip.user : {};
  const salaryDays =
    (att.presentDays || 0) + (att.halfDays || 0) * 0.5 + (att.paidLeaveDays || 0) + (att.holidays || 0) + (att.weeklyOffs || 0);
  return {
    id: slip._id || slip.id,
    employeeCode: emp.employeeCode || user.employeeCode || '—',
    name: emp.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || '—',
    department: emp.department || user.department || '',
    designation: emp.designation || '',
    daysInMonth: att.daysInMonth ?? 0,
    workingDays: att.workingDays ?? 0,
    presentDays: att.presentDays ?? 0,
    halfDays: att.halfDays ?? 0,
    absentDays: att.absentDays ?? 0,
    paidLeaveDays: att.paidLeaveDays ?? 0,
    unpaidLeaveDays: att.unpaidLeaveDays ?? 0,
    weeklyOffs: att.weeklyOffs ?? 0,
    holidays: att.holidays ?? 0,
    lateCount: att.lateCount ?? 0,
    overtimeHours: att.overtimeHours ?? 0,
    salaryDays: Math.round(salaryDays * 100) / 100,
    perDaySalary: slip.perDaySalary ?? 0,
    grossSalary: slip.grossSalary ?? 0,
    totalEarnings: slip.totalEarnings ?? 0,
    totalDeductions: slip.totalDeductions ?? 0,
    netSalary: slip.netSalary ?? 0,
    earnings: (slip.earnings || []).filter((e) => e.amount),
    deductions: (slip.deductions || []).filter((d) => d.amount),
    status: slip.status,
    month: slip.month,
    year: slip.year,
  };
}

export function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Breakdown({ row }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, padding: '6px 4px' }}>
      <div>
        <div className="card-label">Attendance</div>
        <div className="slip-row"><span>Days in month</span><span>{row.daysInMonth}</span></div>
        <div className="slip-row"><span>Working days</span><span>{row.workingDays}</span></div>
        <div className="slip-row"><span>Present</span><span>{row.presentDays}</span></div>
        <div className="slip-row"><span>Half days</span><span>{row.halfDays}</span></div>
        <div className="slip-row"><span>Absent</span><span>{row.absentDays}</span></div>
        <div className="slip-row"><span>Paid / unpaid leave</span><span>{row.paidLeaveDays} / {row.unpaidLeaveDays}</span></div>
        <div className="slip-row"><span>Week offs / holidays</span><span>{row.weeklyOffs} / {row.holidays}</span></div>
        <div className="slip-row"><span>Late marks</span><span>{row.lateCount}</span></div>
        <div className="slip-row"><span>Overtime</span><span>{row.overtimeHours}h</span></div>
        <div className="slip-row" style={{ fontWeight: 800 }}><span>Payable days</span><span>{row.salaryDays}</span></div>
      </div>
      <div>
        <div className="card-label">Earnings</div>
        {row.earnings.length ? (
          row.earnings.map((e) => (
            <div className="slip-row" key={e.key || e.name}><span>{e.name}</span><span>{fmtCurrency(e.amount)}</span></div>
          ))
        ) : (
          <div className="slip-row"><span>—</span><span /></div>
        )}
        <div className="slip-row" style={{ fontWeight: 800 }}><span>Total earnings</span><span>{fmtCurrency(row.totalEarnings)}</span></div>
      </div>
      <div>
        <div className="card-label">Deductions</div>
        {row.deductions.length ? (
          row.deductions.map((d) => (
            <div className="slip-row ded" key={d.key || d.name}><span>{d.name}</span><span>−{fmtCurrency(d.amount)}</span></div>
          ))
        ) : (
          <div className="slip-row"><span>No deductions</span><span /></div>
        )}
        <div className="slip-row ded" style={{ fontWeight: 800 }}><span>Total deductions</span><span>−{fmtCurrency(row.totalDeductions)}</span></div>
        <div className="slip-row"><span>Per-day salary</span><span>{fmtCurrency(row.perDaySalary)}</span></div>
        <div className="slip-row ttl"><span>Net salary</span><span>{fmtCurrency(row.netSalary)}</span></div>
      </div>
    </div>
  );
}

export default function SalaryReportTab() {
  // Default to last month - the current month rarely has a finished slip yet.
  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [period, setPeriod] = useState(`${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}`);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  const [year, month] = period.split('-').map(Number);
  const { data, isFetching } = useGetAllSalarySlipsQuery({ month, year, page: 1, limit: 1000 }, { skip: !month || !year });
  const [downloadSlip] = useDownloadSalarySlipMutation();

  const { items } = unwrapList(data);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .map(toRow)
      .filter((r) => !q || `${r.name} ${r.employeeCode} ${r.department}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          gross: acc.gross + r.grossSalary,
          deductions: acc.deductions + r.totalDeductions,
          net: acc.net + r.netSalary,
        }),
        { gross: 0, deductions: 0, net: 0 }
      ),
    [rows]
  );

  async function handleDownload(row) {
    setDownloadingId(row.id);
    try {
      const blob = await downloadSlip(row.id).unwrap();
      saveBlob(blob, `Salary-Slip-${row.employeeCode}-${MONTH_NAMES[row.month - 1]}-${row.year}.pdf`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not download salary slip.'), 'err');
    } finally {
      setDownloadingId(null);
    }
  }

  function handleExportCsv() {
    const header = [
      'Employee ID', 'Name', 'Department', 'Designation', 'Working Days', 'Present', 'Half Day', 'Absent',
      'Paid Leave', 'Unpaid Leave', 'Week Off', 'Holiday', 'Late', 'Overtime Hrs', 'Payable Days',
      'Per Day', 'Gross', 'Total Earnings', 'Total Deductions', 'Net Salary', 'Status',
    ];
    const lines = rows.map((r) => [
      r.employeeCode, r.name, r.department, r.designation, r.workingDays, r.presentDays, r.halfDays, r.absentDays,
      r.paidLeaveDays, r.unpaidLeaveDays, r.weeklyOffs, r.holidays, r.lateCount, r.overtimeHours, r.salaryDays,
      r.perDaySalary, r.grossSalary, r.totalEarnings, r.totalDeductions, r.netSalary, r.status,
    ]);
    const csv = [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\n');
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `salary-report-${period}.csv`);
  }

  return (
    <div className="fade-in">
      <div className="card">
        <div className="card-label">Salary report — {MONTH_NAMES[month - 1]} {year}</div>
        <div className="filters-bar">
          <input type="month" className="fi" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <input
            className="fi"
            placeholder="Search name, ID or department"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <button className="btn btn-g btn-sm" disabled={!rows.length} onClick={handleExportCsv}>
            <DownloadIcon style={{ width: 13, height: 13 }} /> Export CSV
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={UsersIcon} tone="ind" label="Employees" value={rows.length} />
        <KpiCard icon={TrendUpIcon} tone="blu" label="Total Gross" value={totals.gross} format={fmtCurrency} />
        <KpiCard icon={XIcon} tone="red" label="Total Deductions" value={totals.deductions} format={fmtCurrency} />
        <KpiCard icon={MoneyIcon} tone="grn" label="Total Net Payable" value={totals.net} format={fmtCurrency} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isFetching ? (
          <Spinner />
        ) : rows.length ? (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Working</th>
                  <th>P</th>
                  <th>HD</th>
                  <th>A</th>
                  <th>Leave (paid/unpaid)</th>
                  <th>Payable Days</th>
                  <th>Gross</th>
                  <th>Earnings</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr>
                      <td>{r.employeeCode}</td>
                      <td style={{ fontWeight: 700 }}>{r.name}</td>
                      <td>{r.department || '—'}</td>
                      <td>{r.workingDays}</td>
                      <td>{r.presentDays}</td>
                      <td>{r.halfDays}</td>
                      <td>{r.absentDays}</td>
                      <td>{r.paidLeaveDays} / {r.unpaidLeaveDays}</td>
                      <td>{r.salaryDays}</td>
                      <td>{fmtCurrency(r.grossSalary)}</td>
                      <td>{fmtCurrency(r.totalEarnings)}</td>
                      <td style={{ color: 'var(--red)' }}>−{fmtCurrency(r.totalDeductions)}</td>
                      <td style={{ fontWeight: 800 }}>{fmtCurrency(r.netSalary)}</td>
                      <td><SalaryStatusPill status={r.status} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn btn-g btn-sm" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                          {expanded === r.id ? 'Hide' : 'Details'}
                        </button>{' '}
                        <button className="btn btn-p btn-sm" disabled={downloadingId === r.id} onClick={() => handleDownload(r)}>
                          <DownloadIcon style={{ width: 13, height: 13 }} /> {downloadingId === r.id ? '…' : 'PDF'}
                        </button>
                      </td>
                    </tr>
                    {expanded === r.id ? (
                      <tr>
                        <td colSpan={15}>
                          <Breakdown row={r} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>No salary slips generated for {MONTH_NAMES[month - 1]} {year}. Generate payroll first.</EmptyState>
        )}
      </div>
    </div>
  );
}
