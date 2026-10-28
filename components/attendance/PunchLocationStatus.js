import { fmtAccuracy, fmtDistance } from '@/lib/utils/geolocation';
import LocationBadge from '../geo/LocationBadge';

const MODE_TEXT = {
  enforce: 'required',
  flag: 'recorded (reviewed if outside)',
  off: 'not required',
};

const PERMISSION_TEXT = {
  granted: 'Allowed',
  denied: 'Blocked in browser settings',
  prompt: 'Will ask when you punch',
  unknown: 'Will ask when you punch',
};

function PunchLine({ label, location }) {
  if (!location) return null;
  const where = location.officeName ? `${location.officeName} · ${fmtDistance(location.distanceMeters)}` : 'No office matched';
  return (
    <div className="geo-line">
      <span>
        {label}: <b>{where}</b> {location.accuracy ? `(${fmtAccuracy(location.accuracy)})` : ''}
      </span>
      <LocationBadge validationStatus={location.validationStatus} reviewStatus={location.reviewStatus} />
    </div>
  );
}

// Location section of the employee punch card. Renders nothing for
// companies that don't use geofencing, so their dashboard is unchanged.
export default function PunchLocationStatus({ geo, checkInLocation, checkOutLocation, permission, lastFix }) {
  const usesGeo = geo && (geo.checkInMode !== 'off' || geo.checkOutMode !== 'off');
  if (!usesGeo && !checkInLocation?.officeName && !checkOutLocation?.officeName) return null;

  const offices = geo?.offices || [];
  return (
    <div className="geo-panel">
      {usesGeo ? (
        <>
          <div className="geo-line">
            <span>
              Location at check-in: <b>{MODE_TEXT[geo.checkInMode]}</b> · check-out: <b>{MODE_TEXT[geo.checkOutMode]}</b>
            </span>
          </div>
          <div className="geo-line">
            <span>
              Permission: <b>{PERMISSION_TEXT[permission] || PERMISSION_TEXT.unknown}</b>
            </span>
            {lastFix ? (
              <span>
                Last GPS accuracy: <b>{fmtAccuracy(lastFix.accuracy)}</b>
              </span>
            ) : null}
          </div>
          <div className="geo-line">
            <span>
              Your offices:{' '}
              <b>
                {offices.length
                  ? offices.map((o) => `${o.name}${o.isPrimary ? ' (primary)' : ''}`).join(', ')
                  : 'none assigned - contact HR'}
              </b>
            </span>
          </div>
        </>
      ) : null}
      <PunchLine label="Checked in at" location={checkInLocation} />
      <PunchLine label="Checked out at" location={checkOutLocation} />
      {usesGeo ? (
        <div className="geo-note">
          Your location is read only when you tap Check In or Check Out - never in the background
          {geo.locationRetentionDays ? `, and coordinates are kept for ${geo.locationRetentionDays} days` : ''}. GPS can be
          imprecise; flagged punches are reviewed by HR.
        </div>
      ) : null}
    </div>
  );
}
