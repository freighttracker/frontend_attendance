'use client';

import { useExportMonthlyAttendanceReportPdfMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency, MONTH_NAMES } from '@/lib/utils/format';
import EmptyState from '../ui/EmptyState';
import { DownloadIcon } from '../icons';

const round2 = (n) => Math.round(n * 100) / 100;

// Every employee's month at a glance: total / working / present days and the
// salary those days earn. "Salary" is the generated slip's net when payroll
// has been run, otherwise gross / days-in-month x payable days (marked *).
export default function MonthlySummaryReport({ data, month, year }) {
  const [exportPdf, { isLoading: exporting }] = useExportMonthlyAttendanceReportPdfMutation();
  const toast = useToast();

  const rows = data?.employees || [];
  const totals = rows.reduce(
    (t, r) => ({
      presentDays: t.presentDays + (r.presentDays || 0),
      halfDays: t.halfDays + (r.halfDays || 0),
      absentDays: t.absentDays + (r.absentDays || 0),
      salaryDays: round2(t.salaryDays + (r.salaryDays || 0)),
      grossSalary: t.grossSalary + (r.grossSalary || 0),
      netSalary: round2(t.netSalary + (r.netSalary || 0)),
    }),
    { presentDays: 0, halfDays: 0, absentDays: 0, salaryDays: 0, grossSalary: 0, netSalary: 0 }
  );
  const hasEstimate = rows.some((r) => r.salarySource === 'estimated');

  async function handleDownload() {
    try {
      const blob = await exportPdf({ month, year }).unwrap();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Monthly-Summary-${MONTH_NAMES[month - 1]}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not download PDF.'), 'err');
    }
  }

  if (!rows.length) return <EmptyState>No employee records for {MONTH_NAMES[month - 1]} {year}</EmptyState>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '4px 0 10px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>
          {MONTH_NAMES[month - 1]} {year} · {rows.length} employees · {rows[0]?.daysInMonth ?? '—'} days · {rows[0]?.workingDays ?? '—'} working days
        </div>
        <button className="btn btn-p btn-sm" disabled={exporting} onClick={handleDownload}>
          <DownloadIcon style={{ width: 13, height: 13 }} /> {exporting ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Total Days</th>
              <th>Working Days</th>
              <th>Present</th>
              <th>Half Day</th>
              <th>Absent</th>
              <th>Leave (P/U)</th>
              <th>Payable Days</th>
              <th>Gross</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.employeeCode}</td>
                <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{r.name}</td>
                <td>{r.department || '—'}</td>
                <td>{r.daysInMonth}</td>
                <td>{r.workingDays}</td>
                <td>{r.presentDays}</td>
                <td>{r.halfDays}</td>
                <td>{r.absentDays}</td>
                <td>{r.paidLeaveDays} / {r.unpaidLeaveDays}</td>
                <td>{r.salaryDays}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.grossSalary == null ? '—' : fmtCurrency(r.grossSalary)}</td>
                <td style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {r.netSalary == null ? 'No structure' : fmtCurrency(r.netSalary)}
                  {r.salarySource === 'estimated' ? ' *' : ''}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 800 }}>
              <td colSpan={5}>Total</td>
              <td>{totals.presentDays}</td>
              <td>{totals.halfDays}</td>
              <td>{totals.absentDays}</td>
              <td />
              <td>{totals.salaryDays}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtCurrency(totals.grossSalary)}</td>
              <td style={{ whiteSpace: 'nowrap' }}>{fmtCurrency(totals.netSalary)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 8 }}>
        Salary = gross ÷ days in month × payable days (present + ½ half days + paid leave + week offs + holidays).
        {hasEstimate ? ' * Estimated — payroll not generated yet for this month; final slip may include other deductions.' : ''}
      </div>
    </div>
  );
}
