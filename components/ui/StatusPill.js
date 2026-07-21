import { titleCase } from '@/lib/utils/format';

const ATTENDANCE_CLASS = {
  present: 'ap',
  absent: 'aa',
  half_day: 'ah',
  on_leave: 'al',
  wfh: 'al',
  weekend: 'aw',
  holiday: 'ahol',
};

const LEAVE_CLASS = {
  pending: 'lp-pending',
  approved: 'lp-approved',
  rejected: 'lp-rejected',
  cancelled: 'lp-cancelled',
};

const SALARY_CLASS = {
  generated: 'sst-generated',
  approved: 'sst-approved',
  published: 'sst-published',
  paid: 'sst-paid',
};

export function AttendanceStatusPill({ status }) {
  return <span className={`apill ${ATTENDANCE_CLASS[status] || 'aa'}`}>{titleCase(status || 'absent')}</span>;
}

export function LeaveStatusPill({ status }) {
  return <span className={`lpill ${LEAVE_CLASS[status] || 'lp-pending'}`}>{titleCase(status || 'pending')}</span>;
}

export function SalaryStatusPill({ status }) {
  return <span className={`sst ${SALARY_CLASS[status] || 'sst-generated'}`}>{titleCase(status || 'generated')}</span>;
}
