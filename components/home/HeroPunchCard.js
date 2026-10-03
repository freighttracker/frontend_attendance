'use client';

import { useEffect, useState } from 'react';
import { useGetTodayAttendanceQuery, useCheckInMutation, useCheckOutMutation } from '@/lib/services/attendanceApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { normalizeAttendanceRecord } from '@/lib/utils/normalize';
import { fmtTime, fmtDurationMs, DAY_NAMES, MONTH_NAMES, pad } from '@/lib/utils/format';
import Modal from '../ui/Modal';

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

  async function handleCheckIn() {
    setError('');
    try {
      await checkIn({}).unwrap();
      toast(`Checked in at ${fmtTime(new Date().toISOString())}`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not check in.'));
    }
  }

  async function handleConfirmCheckOut() {

    setError('');
    try {
      await checkOut({}).unwrap();
      setConfirmOpen(false);
      toast('Checked out for today');
    } catch (err) {
      setConfirmOpen(false);
      setError(extractErrorMessage(err, 'Could not check out.'));
    }
    
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
        <button className="punch-btn co" disabled={checkingOut} onClick={() => setConfirmOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Check Out</span>
        </button>
      ) : (
        <button className="punch-btn ci" disabled={checkingIn || isComplete || isLoading} onClick={handleCheckIn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{isComplete ? 'Checked in' : checkingIn ? 'Checking in…' : 'Check In'}</span>
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
      <div className="hero-err">{error}</div>

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
            <button className="btn btn-r" style={{ flex: 1 }} disabled={checkingOut} onClick={handleConfirmCheckOut}>
              {checkingOut ? 'Checking out…' : 'Check Out'}
            </button>
          </>
        }
      />
    </div>
  );
}
