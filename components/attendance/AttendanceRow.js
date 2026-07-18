import { fmtDayMonth, fmtTime, DAY_NAMES, fmtDurationSeconds } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';

export default function AttendanceRow({ record }) {

  const { mo, dd } = fmtDayMonth(record.date);
  const dayName = record.date ? DAY_NAMES[new Date(`${record.date}T00:00:00`).getDay()] : '';
  const hours = typeof record.workingHours === 'number' ? fmtDurationSeconds(record.workingHours * 3600) : '—';
  
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
    </div>
  );
}
