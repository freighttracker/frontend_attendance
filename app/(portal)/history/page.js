'use client';

import { useState } from 'react';
import { useGetAttendanceHistoryQuery } from '@/lib/services/attendanceApi';
import { useAppSelector } from '@/lib/hooks';
import { selectCurrentUser } from '@/lib/features/authSlice';
import { normalizeAttendanceRecord } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { todayISO } from '@/lib/utils/format';
import AttendanceRow from '@/components/attendance/AttendanceRow';
import RequestCorrectionModal from '@/components/attendance/RequestCorrectionModal';
import MyCorrections from '@/components/attendance/MyCorrections';
import MyAttendanceSummary from '@/components/attendance/MyAttendanceSummary';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';

export default function HistoryPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [filterMonth, setFilterMonth] = useState(month);
  const [correctionDate, setCorrectionDate] = useState(null);
  const [view, setView] = useState('list');
  const user = useAppSelector(selectCurrentUser);

  const [year, mo] = filterMonth ? filterMonth.split('-') : [null, null];
  const startDate = filterMonth ? `${year}-${mo}-01` : undefined;
  const endDate = filterMonth ? `${year}-${mo}-${String(new Date(Number(year), Number(mo), 0).getDate()).padStart(2, '0')}` : undefined;

  const { data, isLoading } = useGetAttendanceHistoryQuery({ page: 1, limit: 100, startDate, endDate });
  const { items } = unwrapList(data);
  const records = items.map(normalizeAttendanceRecord).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <>
      <div className="ph">
        <h1>Attendance History</h1>
        <p>Your complete check-in / check-out log</p>
      </div>
      <MyAttendanceSummary
        userId={user?.id}
        month={mo ? Number(mo) : now.getMonth() + 1}
        year={year ? Number(year) : now.getFullYear()}
      />

      <div className="atabs" style={{ maxWidth: 220, marginBottom: 12 }}>
        <button className={`atab ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')}>
          List
        </button>
        <button className={`atab ${view === 'calendar' ? 'on' : ''}`} onClick={() => setView('calendar')}>
          Calendar
        </button>
      </div>

      {view === 'calendar' ? (
        <div className="card">
          <AttendanceCalendar userId={user?.id} />
        </div>
      ) : (
        <>
          <div className="frow" style={{ marginBottom: 12 }}>
            <div className="ff" style={{ margin: 0 }}>
              <input type="month" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <button className="btn btn-g btn-sm" onClick={() => setFilterMonth(month)}>
              Filter
            </button>
            <button
              className="btn btn-g btn-sm"
              onClick={() => {
                setMonth('');
                setFilterMonth('');
              }}
            >
              Clear
            </button>
            <button className="btn btn-p btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setCorrectionDate(todayISO())}>
              Request Correction
            </button>
          </div>
          <div className="card" style={{ padding: '0 16px' }}>
            {isLoading ? (
              <Spinner />
            ) : records.length ? (
              records.map((r) => <AttendanceRow key={r.id} record={r} onRequestCorrection={setCorrectionDate} />)
            ) : (
              <EmptyState>No records for this period</EmptyState>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <MyCorrections />
      </div>
      <RequestCorrectionModal open={Boolean(correctionDate)} onClose={() => setCorrectionDate(null)} defaultDate={correctionDate} />
    </>
  );
}
