import { fmtTime, DAY_NAMES } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';

const DAY_HEAD = DAY_NAMES.map((d) => d.slice(0, 3));

// Pure grid renderer - given a month's worth of day entries (as returned by
// GET /attendance/calendar/:id), lays them out as an actual calendar month
// rather than a chronological list. When onDayClick is given (admin Correct
// tab), every non-future, unlocked day becomes clickable to open a correction.
export default function AttendanceCalendarGrid({ days, month, year, todayISO, onDayClick }) {

  if (!days?.length) return null;

  const leadingBlanks = new Date(year, month - 1, 1).getDay();

  return (
    <div className="cal-grid">
      {DAY_HEAD.map((d) => (
        <div className="cal-head" key={d}>{d}</div>
      ))}
      {Array.from({ length: leadingBlanks }).map((_, i) => (
        <div className="cal-cell empty" key={`b${i}`} />
      ))}
      {days.map((d) => {
        const flags = [
          
          d.isEarlyCheckin ? `Early in ${d.earlyCheckinMinutes}m` : '',
          d.isLate ? `Late ${d.lateMinutes}m` : '',
          d.isEarlyLeave ? `Early out ${d.earlyLeaveMinutes}m` : '',
          d.isOvertime ? `OT ${d.overtimeHours}h` : '',

        ].filter(Boolean).join(' · ');
        const subLabel = d.holidayName || d.leaveType?.name || '';
        // A past day with check-in but no check-out counts as a half day.
        const missedCheckout = d.checkIn && !d.checkOut && todayISO && d.date < todayISO
          && ['present', 'wfh'].includes(d.status) && !d.isStatusOverridden;
        const status = missedCheckout ? 'half_day' : d.status;
        const isFuture = d.isFuture ?? (todayISO ? d.date > todayISO : false);
        const clickable = Boolean(onDayClick) && !isFuture && !d.isLocked;
        const request = d.correctionRequest;
        const isPending = request?.status === 'pending';
        const open = () => onDayClick({ ...d, status });

        return (
          <div
            className={`cal-cell ${d.date === todayISO ? 'is-today' : ''} ${clickable ? 'is-clickable' : ''} ${onDayClick && isPending ? 'is-pending' : ''}`}
            key={d.date}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            title={clickable ? (request?.status === 'pending' ? 'Review correction request' : 'Correct this day') : undefined}
            onClick={clickable ? open : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined}
          >
            <div className="cal-daynum">{d.day}</div>
            <AttendanceStatusPill status={status} />
            {isPending ? <span className="chip chip-pending cal-tag">Request pending</span> : null}
            {request?.status === 'rejected' ? <span className="chip chip-rejected cal-tag">Request rejected</span> : null}
            {d.isCorrected ? <span className="chip chip-approved cal-tag">Corrected</span> : null}
            {d.isLocked ? <span className="chip chip-closed cal-tag">Locked</span> : null}
            {subLabel ? <div className="cal-times">{subLabel}</div> : null}
            {d.checkIn ? (
              <div className="cal-times">
                {fmtTime(d.checkIn)} – {d.checkOut ? fmtTime(d.checkOut) : '—'}
              </div>
            ) : null}
            {d.checkOut ? <div className="cal-times">{d.workingHours}h worked</div> : null}
            {flags ? <div className="cal-flags">{flags}</div> : null}
            {isPending ? (
              <div className="cal-req">
                Req: {request.requestedCheckIn ? fmtTime(request.requestedCheckIn) : '—'} – {request.requestedCheckOut ? fmtTime(request.requestedCheckOut) : '—'}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
