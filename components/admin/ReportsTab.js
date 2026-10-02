'use client';

import { useState } from 'react';
import {
  useLazyGetAttendanceReportQuery,
  useLazyGetLeaveReportQuery,
  useLazyGetSalaryReportQuery,
  useLazyGetLateComersReportQuery,
} from '@/lib/services/reportsApi';
import { pad } from '@/lib/utils/format';
import { extractErrorMessage } from '@/lib/hooks';
import { useLazyGetMonthlyAttendanceReportQuery } from '@/lib/services/attendanceApi';
import MonthlySummaryReport from './MonthlySummaryReport';
import DynamicResult from '../ui/DynamicResult';
import Spinner from '../ui/Spinner';

const REPORT_TYPES = [
  { key: 'attendance', label: 'Attendance', period: 'range' },
  { key: 'lateComers', label: 'Late Comers', period: 'range' },
  { key: 'monthlySummary', label: 'Monthly Summary', period: 'month' },
  { key: 'salary', label: 'Salary', period: 'month' },
  { key: 'leaves', label: 'Leaves', period: 'year' },
];

export default function ReportsTab() {
  const now = new Date();
  const [reportKey, setReportKey] = useState('attendance');
  const [month, setMonth] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
  const [startDate, setStartDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`);
  const [endDate, setEndDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`);
  const [year, setYear] = useState(String(now.getFullYear()));

  const [triggerAttendance, attendanceState] = useLazyGetAttendanceReportQuery();
  const [triggerLeaves, leavesState] = useLazyGetLeaveReportQuery();
  const [triggerSalary, salaryState] = useLazyGetSalaryReportQuery();
  const [triggerMonthly, monthlyState] = useLazyGetMonthlyAttendanceReportQuery();
  const [triggerLateComers, lateComersState] = useLazyGetLateComersReportQuery();

  const config = REPORT_TYPES.find((r) => r.key === reportKey);
  const stateMap = {
    attendance: attendanceState,
    lateComers: lateComersState,
    monthlySummary: monthlyState,
    salary: salaryState,
    leaves: leavesState,
  };
  const activeState = stateMap[reportKey];

  function handleGenerate() {
    const [y, m] = month.split('-').map(Number);
    if (reportKey === 'attendance') triggerAttendance({ startDate, endDate });
    if (reportKey === 'lateComers') triggerLateComers({ startDate, endDate });
    if (reportKey === 'monthlySummary') triggerMonthly({ month: m, year: y, page: 1, limit: 1000 });
    if (reportKey === 'salary') triggerSalary({ month: m, year: y });
    if (reportKey === 'leaves') triggerLeaves({ year: Number(year) });
  }

  return (
    <div className="card">
      <div className="card-label">Reports</div>
      <div className="frow" style={{ marginBottom: 12 }}>
        <div className="ff" style={{ margin: 0 }}>
          <select className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={reportKey} onChange={(e) => setReportKey(e.target.value)}>
            {REPORT_TYPES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="frow" style={{ marginBottom: 12 }}>
        {config.period === 'range' ? (
          <>
            <div className="ff" style={{ margin: 0 }}>
              <input type="date" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="ff" style={{ margin: 0 }}>
              <input type="date" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </>
        ) : config.period === 'month' ? (
          <div className="ff" style={{ margin: 0 }}>
            <input type="month" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        ) : (
          <div className="ff" style={{ margin: 0 }}>
            <input type="number" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        )}
        <button className="btn btn-p btn-sm" onClick={handleGenerate}>
          Generate
        </button>
      </div>
      <div>
        {activeState.isFetching ? (
          <Spinner />
        ) : activeState.isError ? (
          <div className="ferr">{extractErrorMessage(activeState.error, 'Could not load report.')}</div>
        ) : reportKey === 'monthlySummary' && activeState.data ? (
          <MonthlySummaryReport data={activeState.data} month={activeState.data.month} year={activeState.data.year} />
        ) : (
          <DynamicResult data={activeState.data} />
        )}
      </div>
    </div>
  );
}
