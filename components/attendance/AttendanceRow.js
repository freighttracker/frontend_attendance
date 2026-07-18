import { fmtDayMonth, fmtTime, DAY_NAMES, fmtDurationSeconds, todayISO } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';

export default function AttendanceRow({ record, onRequestCorrection }) {

  const { mo, dd } = fmtDayMonth(record.date);
  const dayName = record.date ? DAY_NAMES[new Date(`${record.date}T00:00:00`).getDay()] : '';
  const hours = typeof record.workingHours === 'number' ? fmtDurationSeconds(record.workingHours * 3600) : '—';
  const dateOnly = record.date ? String(record.date).slice(0, 10) : null;
  const isMissingPunch = !record.checkIn || !record.checkOut;
  const canRequestCorrection = Boolean(onRequestCorrection) && isMissingPunch && dateOnly && dateOnly <= todayISO();

  return (
    <div className="arow">
      <div className="adate">
        <span className="mo">{mo}</span>
        <span className="dd">{dd}</span>
      </div>
      <div className="ainfo">
        <div className="atime">
          {fmtTime(record.checkIn)} — {fmtTime(record.checkOut)}
        </div>
        <div className="adur">
          {hours} · {dayName}
        </div>
      </div>
      <AttendanceStatusPill status={record.status} />
      {canRequestCorrection ? (
        <button
          className="btn btn-g btn-sm"
          style={{ marginLeft: 6, padding: '4px 8px', fontSize: 10 }}
          onClick={() => onRequestCorrection(dateOnly)}
        >
          Fix
        </button>
      ) : null}
    </div>
  );
}
