'use client';

import { useEffect, useState } from 'react';
import { useGetTodayAttendanceQuery, useCheckInMutation, useCheckOutMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { normalizeAttendanceRecord } from '@/lib/utils/normalize';
import { fmtTime, fmtDurationMs, DAY_NAMES, MONTH_NAMES, pad } from '@/lib/utils/format';
import { getCurrentLocation, queryLocationPermission, GEO_ERROR, RECOVERABLE_PUNCH_CODES } from '@/lib/utils/geolocation';
import Modal from '../ui/Modal';
import LocationExceptionModal from '../attendance/LocationExceptionModal';
import PunchLocationStatus from '../attendance/PunchLocationStatus';

export default function HeroPunchCard() {

  const {data, isLoading } = useGetTodayAttendanceQuery();
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useCheckOutMutation();

  const toast = useToast();
  const [now, setNow] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {

    return newFunction();
    function newFunction() {
      setNow(new Date());
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
    
  }, []);

  const record = normalizeAttendanceRecord(data?.attendance || data?.record || data);
  const isCheckedIn = Boolean(record?.checkIn) && !record?.checkOut;
  const isComplete = Boolean(record?.checkIn) && Boolean(record?.checkOut);

  let workedMs = 0; 
  if (isCheckedIn && record.checkIn && now) {
    workedMs = now.getTime() - new Date(record.checkIn).getTime();
  } else if (isComplete && record.checkIn && record.checkOut) {
    workedMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
  }

  const geo = data?.geo;
  const usesGeo = Boolean(geo && (geo.checkInMode !== 'off' || geo.checkOutMode !== 'off'));
  const [capturing, setCapturing] = useState(false);
  const [lastFix, setLastFix] = useState(null);
  const [permission, setPermission] = useState('unknown');
  // { action, code, message, canRequestException, body } when a punch was blocked.
  const [problem, setProblem] = useState(null);

  // Reads the permission state only (no prompt) so the card can show it.
  useEffect(() => {
    if (!usesGeo) return;
    queryLocationPermission().then(setPermission);
  }, [usesGeo]);

  const modeFor = (action) => (action === 'checkIn' ? geo?.checkInMode : geo?.checkOutMode) || 'off';

  // One GPS read, only when the policy for this action needs it.
  async function captureLocation(action) {
    if (modeFor(action) === 'off') return { body: {} };
    setCapturing(true);
    try {
      const fix = await getCurrentLocation();
      setLastFix(fix);
      setPermission('granted');
      return { body: { latitude: fix.latitude, longitude: fix.longitude, accuracy: fix.accuracy } };
    } catch (geoError) {
      if (geoError.code === GEO_ERROR.DENIED) setPermission('denied');
      return { body: {}, geoError };
    } finally {
      setCapturing(false);
    }
  }

  // Returns true when the punch was recorded.
  async function sendPunch(action, body) {
    const mutate = action === 'checkIn' ? checkIn : checkOut;
    try {
      const result = await mutate(body).unwrap();
      setProblem(null);
      const label = action === 'checkIn' ? `Checked in at ${fmtTime(new Date().toISOString())}` : 'Checked out for today';
      // Flag-mode punches succeed but carry a "flagged for review" note.
      const flagged = result?.message && /review/i.test(result.message);
      toast(flagged ? result.message : label);
      return true;
    } catch (err) {
      const code = err?.data?.code;
      const message = extractErrorMessage(err, action === 'checkIn' ? 'Could not check in.' : 'Could not check out.');
      if (RECOVERABLE_PUNCH_CODES.includes(code)) {
        setProblem({ action, code, message, canRequestException: Boolean(err.data?.details?.canRequestException), body });
      } else {
        setError(message);
      }
      return false;
    }
  }

  async function punch(action) {
    setError('');
    const { body, geoError } = await captureLocation(action);
    if (geoError && modeFor(action) === 'enforce') {
      // The server would reject a location-less punch; offer retry/exception directly.
      setProblem({ action, code: 'LOCATION_REQUIRED', message: geoError.message, canRequestException: Boolean(geo?.allowExceptions), body: {} });
      return false;
    }
    return sendPunch(action, body);
  }

  async function handleRetry() {
    const action = problem.action;
    setProblem(null);
    await punch(action);
  }

  // Resubmits with the same reading (or none) plus the employee's reason.
  // Returns an error message for the modal, or null on success.
  async function handleSubmitException(reason) {
    const mutate = problem.action === 'checkIn' ? checkIn : checkOut;
    try {
      const result = await mutate({ ...problem.body, exceptionReason: reason }).unwrap();
      setProblem(null);
      toast(result?.message || 'Submitted for review');
      return null;
    } catch (err) {
      return extractErrorMessage(err, 'Could not submit.');
    }
  }

  async function handleCheckIn() {
    await punch('checkIn');
  }

  async function handleConfirmCheckOut() {
    setError('');
    await punch('checkOut');
    setConfirmOpen(false);
  }

  const pillClass = isCheckedIn ? 'hero-pill in-pill' : 'hero-pill off';
  const statusText = isCheckedIn ? 'Checked in' : isComplete ? 'Shift complete' : 'Not checked in';
  
  return (
    <div className="hero">
      <div className="hero-date">
        {now ? `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}` : ' '}
      </div>
      <div className="hero-clock">
        {now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : '--:--:--'}
      </div>
      <div className={pillClass}>
        <span className={isCheckedIn ? 'pdot' : 'odot'} />
        <span>{statusText}</span>
      </div>
      <div className="hero-hrs">{fmtDurationMs(workedMs)}</div>
      <div className="hero-hrs-lbl">worked today</div>

      {isCheckedIn ? (
        <button className="punch-btn co" disabled={checkingOut || capturing} onClick={() => setConfirmOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Check Out</span>
        </button>
      ) : (
        <button className="punch-btn ci" disabled={checkingIn || capturing || isComplete || isLoading} onClick={handleCheckIn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{isComplete ? 'Checked in' : capturing ? 'Getting location…' : checkingIn ? 'Checking in…' : 'Check In'}</span>
        </button>
      )}

      <div className="hero-meta">
        <span>
          In: <b>{fmtTime(record?.checkIn)}</b>
        </span>
        <span>
          Out: <b>{fmtTime(record?.checkOut)}</b>
        </span>
      </div>
      {data?.officeStartTime ? (
        <div className="hero-meta" style={{ marginTop: 4 }}>
          <span>
            Office: <b>{data.officeStartTime}–{data.officeEndTime}</b>
          </span>
          <span>
            Grace: <b>{data.graceBeforeMinutes || 0}m / {data.graceAfterMinutes || 0}m</b>
          </span>
        </div>
      ) : null}
      {data?.isLate || data?.overtimeHours > 0 || data?.isEarlyCheckin ? (
        <div className="hero-meta" style={{ marginTop: 4 }}>
          {data.isLate ? <span style={{ color: 'var(--red)' }}>Late {data.lateMinutes}m</span> : null}
          {data.overtimeHours > 0 ? <span style={{ color: 'var(--grn)' }}>Overtime {data.overtimeHours}h</span> : null}
          {data.isEarlyCheckin ? <span style={{ color: 'var(--amb)' }}>Early check-in {data.earlyCheckinMinutes}m</span> : null}
        </div>
      ) : null}
      <PunchLocationStatus
        geo={geo}
        checkInLocation={data?.checkInLocation}
        checkOutLocation={data?.checkOutLocation}
        permission={permission}
        lastFix={lastFix}
      />
      <div className="hero-err">{error}</div>

      <LocationExceptionModal
        key={problem ? `${problem.action}-${problem.code}` : 'none'}
        problem={problem}
        onClose={() => setProblem(null)}
        onRetry={handleRetry}
        onSubmitException={handleSubmitException}
        isBusy={capturing || checkingIn || checkingOut}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Check Out"
        subtitle={
          <>
            Checked in at <b>{fmtTime(record?.checkIn)}</b> · worked <b>{fmtDurationMs(workedMs)}</b> so far.
          </>
        }
        actions={
          <>
            <button className="btn btn-g" style={{ flex: 1 }} onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-r" style={{ flex: 1 }} disabled={checkingOut || capturing} onClick={handleConfirmCheckOut}>
              {capturing ? 'Getting location…' : checkingOut ? 'Checking out…' : 'Check Out'}
            </button>
          </>
        }
      />
    </div>
  );
}
