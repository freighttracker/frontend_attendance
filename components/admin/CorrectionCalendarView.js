'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetCorrectionRequestsQuery } from '@/lib/services/attendanceApi';
import { normalizeUser } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtTime, pad, titleCase } from '@/lib/utils/format';
import AttendanceCalendar from '@/components/attendance/AttendanceCalendar';
import DirectCorrectionModal from './DirectCorrectionModal';
import ApproveCorrectionModal from './ApproveCorrectionModal';
import RejectCorrectionModal from './RejectCorrectionModal';
import EmptyState from '../ui/EmptyState';

function toTimeInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Correct tab's calendar view - pick an employee, click any past/today cell
// to fix that day. A day with a pending request opens the approve/reject
// flow for that request instead of a blank direct correction.
export default function CorrectionCalendarView() {
  const { data: usersData, isLoading } = useGetUsersQuery({ page: 1, limit: 300, role: 'employee' });
  const { items } = unwrapList(usersData);
  const employees = items.map(normalizeUser);
  const [selectedId, setSelectedId] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [approvingFromList, setApprovingFromList] = useState(null);

  // All pending requests, grouped per employee - drives the picker's counts
  // and the strip above the calendar (which covers every month, not just
  // the one on screen).
  const { data: pendingData } = useGetCorrectionRequestsQuery({ status: 'pending', page: 1, limit: 500 });
  const pendingItems = unwrapList(pendingData).items;
  const pendingByUser = new Map();
  pendingItems.forEach((c) => {
    const uid = typeof c.user === 'object' ? c.user?._id : c.user;
    if (!uid) return;
    if (!pendingByUser.has(uid)) pendingByUser.set(uid, []);
    pendingByUser.get(uid).push(c);
  });
  const selectedPending = (pendingByUser.get(selectedId) || [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const selected = employees.find((e) => e.id === selectedId);
  const pendingRequest = selectedDay?.correctionRequest?.status === 'pending' ? selectedDay.correctionRequest : null;

  // Shape the calendar day into what ApproveCorrectionModal expects from a
  // GET /attendance/corrections row.
  const approving = approvingFromList || (pendingRequest
    ? {
        _id: pendingRequest.id,
        date: selectedDay.date,
        requestedCheckIn: pendingRequest.requestedCheckIn,
        requestedCheckOut: pendingRequest.requestedCheckOut,
        reason: pendingRequest.reason,
        user: { firstName: selected?.name || 'Employee', lastName: '' },
        attendanceRecord: selectedDay.checkIn || selectedDay.checkOut
          ? { checkIn: { time: selectedDay.checkIn }, checkOut: { time: selectedDay.checkOut } }
          : null,
      }
    : null);

  function closeApprove() {
    setSelectedDay(null);
    setApprovingFromList(null);
  }

  const direct = selectedDay && !pendingRequest ? selectedDay : null;
  const currentSummary = direct
    ? `${selected?.name || 'Employee'} · ${fmtDate(direct.date)} · now ${titleCase(direct.status)}${
        direct.checkIn ? ` (${fmtTime(direct.checkIn)} – ${direct.checkOut ? fmtTime(direct.checkOut) : '—'})` : ''
      }`
    : '';

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <select className="fi" style={{ minWidth: 240 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select an employee…</option>
          {employees.map((e) => {
            const count = pendingByUser.get(e.id)?.length || 0;
            return (
              <option key={e.id} value={e.id}>
                {e.name} · {e.employeeCode} · {e.department || 'No dept'}
                {count ? ` · ${count} pending` : ''}
              </option>
            );
          })}
        </select>
        {pendingItems.length ? (
          <span className="chip chip-pending">{pendingItems.length} pending request{pendingItems.length === 1 ? '' : 's'} in total</span>
        ) : null}
      </div>

      <div className="card">
        {isLoading ? null : selectedId ? (
          <>
            {selectedPending.length ? (
              <div className="req-strip">
                {selectedPending.map((c) => (
                  <div className="req-item" key={c._id}>
                    <div className="cinfo">
                      <div className="cday">{fmtDate(c.date)} · correction requested</div>
                      <div className="ctimes">
                        Requested: {c.requestedCheckIn ? fmtTime(c.requestedCheckIn) : '—'} – {c.requestedCheckOut ? fmtTime(c.requestedCheckOut) : '—'}
                      </div>
                      <div className="ctimes">{c.reason}</div>
                    </div>
                    <button className="btn btn-p btn-sm" onClick={() => setApprovingFromList(c)}>
                      Approve
                    </button>
                    <button className="btn btn-r btn-sm" onClick={() => setRejectingId(c._id)}>
                      Reject
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="ctimes" style={{ marginBottom: 10 }}>
              Click any day up to today to correct it. Days marked “Request pending” open the employee’s request.
            </div>
            <AttendanceCalendar
              userId={selectedId}
              employeeLabel={selected ? `${selected.name} (${selected.employeeCode})` : ''}
              onDayClick={setSelectedDay}
            />
          </>
        ) : (
          <EmptyState>Select an employee above to correct their attendance from the calendar</EmptyState>
        )}
      </div>

      <DirectCorrectionModal
        key={direct ? `${selectedId}-${direct.date}` : 'none'}
        open={Boolean(direct)}
        onClose={() => setSelectedDay(null)}
        lockTarget
        currentSummary={currentSummary}
        initial={
          direct
            ? {
                userId: selectedId,
                date: direct.date,
                checkInTime: toTimeInputValue(direct.checkIn),
                checkOutTime: toTimeInputValue(direct.checkOut),
              }
            : undefined
        }
      />
      <ApproveCorrectionModal
        key={approving?._id || 'none'}
        correction={approving}
        onClose={closeApprove}
        onReject={() => {
          setRejectingId(approving._id);
          closeApprove();
        }}
      />
      <RejectCorrectionModal correctionId={rejectingId} onClose={() => setRejectingId(null)} />
    </div>
  );
}
