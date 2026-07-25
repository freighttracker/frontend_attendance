import { fmtTime, DAY_NAMES } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';

const DAY_HEAD = DAY_NAMES.map((d) => d.slice(0, 3));

// Pure grid renderer - given a month's worth of day entries (as returned by
// GET /attendance/calendar/:id), lays them out as an actual calendar month
// rather than a chronological list.
export default function AttendanceCalendarGrid({ days, month, year, todayISO }) {
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

        return (
          <div className={`cal-cell ${d.date === todayISO ? 'is-today' : ''}`} key={d.date}>
            <div className="cal-daynum">{d.day}</div>
            <AttendanceStatusPill status={d.status} />
            {subLabel ? <div className="cal-times">{subLabel}</div> : null}
            {d.checkIn ? (
              <div className="cal-times">
                {fmtTime(d.checkIn)} – {d.checkOut ? fmtTime(d.checkOut) : '—'}
              </div>
            ) : null}
            {d.checkOut ? <div className="cal-times">{d.workingHours}h worked</div> : null}
            {flags ? <div className="cal-flags">{flags}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
