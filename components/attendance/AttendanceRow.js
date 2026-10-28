import { fmtDayMonth, fmtTime, DAY_NAMES, fmtDurationSeconds, todayISO } from '@/lib/utils/format';
import { AttendanceStatusPill } from '../ui/StatusPill';
import { fmtDistance } from '@/lib/utils/geolocation';
import LocationBadge from '../geo/LocationBadge';

// Recorded check-in/out location, if the punch carried any (legacy records
// and companies without geofencing show nothing).
function punchLocationText(punch) {
  if (!punch?.time || (!punch.officeName && (!punch.validationStatus || punch.validationStatus === 'not_required'))) return null;
  return punch.officeName ? `${punch.officeName} (${fmtDistance(punch.distanceMeters)})` : 'no office';
}

export default function AttendanceRow({ record, onRequestCorrection }) {

  const { mo, dd } = fmtDayMonth(record.date);
  const dayName = record.date ? DAY_NAMES[new Date(`${record.date}T00:00:00`).getDay()] : '';
  const hours = typeof record.workingHours === 'number' ? fmtDurationSeconds(record.workingHours * 3600) : '—';
  const dateOnly = record.date ? String(record.date).slice(0, 10) : null;
  const isMissingPunch = !record.checkIn || !record.checkOut;
  const canRequestCorrection = Boolean(onRequestCorrection) && isMissingPunch && dateOnly && dateOnly <= todayISO();
  const rawIn = record.raw?.checkIn;
  const rawOut = record.raw?.checkOut;
  const inText = punchLocationText(rawIn);
  const outText = punchLocationText(rawOut);

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
        {inText || outText ? (
          <div className="geo-sub" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {inText ? <span>In: {inText}</span> : null}
            {inText ? <LocationBadge validationStatus={rawIn.validationStatus} reviewStatus={rawIn.reviewStatus} /> : null}
            {outText ? <span>· Out: {outText}</span> : null}
            {outText ? <LocationBadge validationStatus={rawOut.validationStatus} reviewStatus={rawOut.reviewStatus} /> : null}
          </div>
        ) : null}
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
