// "Count this day as" choices for admin corrections - values match the
// backend's AttendanceRecord status enum. Weekend/Holiday turn a working day
// into a paid day off in payroll.
export const DAY_STATUS_OPTIONS = [
  { value: '', label: 'Auto-calculate from time' },
  { value: 'present', label: 'Full Day (Present)' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'absent', label: 'Absent' },
  { value: 'wfh', label: 'Work From Home' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'weekend', label: 'Weekend (Week Off)' },
  { value: 'holiday', label: 'Holiday' },
];
