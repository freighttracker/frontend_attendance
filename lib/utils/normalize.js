export function normalizeAttendanceRecord(record) {
  if (!record) return null;
  const checkIn = record.checkIn?.time || record.checkInTime || record.checkIn || null;
  const checkOut = record.checkOut?.time || record.checkOutTime || record.checkOut || null;
  const workingHours = record.workingHours ?? record.totalHours ?? record.duration ?? null;
  return {
    id: record._id || record.id,
    date: record.date,
    checkIn,
    checkOut,
    status: record.status,
    workingHours,
    raw: record,
  };
}

export function normalizeLeave(leave) {
  if (!leave) return null;
  return {
    id: leave._id || leave.id,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    status: leave.status,
    totalDays: leave.totalDays ?? leave.days ?? null,
    leaveType: leave.leaveTypeId || leave.leaveType,
    user: leave.userId || leave.user,
    rejectionReason: leave.rejectionReason,
    createdAt: leave.createdAt,
    raw: leave,
  };
}

export function normalizeHoliday(holiday) {
  if (!holiday) return null;
  return {
    id: holiday._id || holiday.id,
    name: holiday.name,
    date: holiday.date,
    type: holiday.type,
    isActive: holiday.isActive,
    description: holiday.description,
    raw: holiday,
  };
}

export function normalizeSalarySlip(slip) {
  if (!slip) return null;
  const attendance = slip.attendanceSummary || {};
  return {
    id: slip._id || slip.id,
    month: slip.month,
    year: slip.year,
    baseSalary: slip.baseSalary,
    netSalary: slip.netSalary ?? slip.net,
    // slip.deductions on the raw doc is the line-item array, not a number -
    // totalDeductions is the actual amount every consumer expects here.
    deductions: slip.totalDeductions ?? slip.deductions,
    presentDays: attendance.presentDays ?? slip.presentDays ?? slip.p,
    halfDays: attendance.halfDays ?? slip.halfDays ?? slip.h,
    absentDays: attendance.absentDays ?? slip.absentDays ?? slip.a,
    workingDays: attendance.workingDays ?? slip.workingDays ?? slip.totalWorkingDays,
    status: slip.status,
    user: slip.userId || slip.user,
    raw: slip,
  };
}

const KNOWN_COMPONENT_LABELS = { hra: 'HRA', pf: 'PF', tds: 'TDS', esic: 'ESIC', pt: 'PT' };

function humanizeComponentKey(key) {
  const known = KNOWN_COMPONENT_LABELS[key.toLowerCase()];
  if (known) return known;
  const withSpaces = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeSalaryComponent(component) {
  if (!component) return null;
  return {
    id: component._id || component.id || `${component.type}-${component.name}`,
    name: component.name,
    type: component.type || 'custom',
    calcType: component.calcType || component.calculationType || (component.percentage !== undefined ? 'percentage' : 'fixed'),
    value: component.value ?? component.amount ?? component.percentage ?? 0,
    baseComponent: component.baseComponent,
    enabled: component.enabled ?? component.isEnabled ?? true,
  };
}

// Backend stores earnings/deductions as an object keyed by component name
// (e.g. { basicSalary: { calculationType, value, baseComponent, isEnabled } },
// with custom entries nested under otherAllowances/otherDeductions arrays),
// not a flat array — this flattens either shape into an array of components
// for display. Zero-value, non-custom components (never configured by the
// admin) are dropped so unconfigured fixed slots don't clutter the view.
const CUSTOM_COMPONENT_KEYS = ['otherAllowances', 'otherDeductions'];

function normalizeComponentMap(source) {
  if (!source) return [];
  if (Array.isArray(source)) return source.map(normalizeSalaryComponent);
  const result = [];
  Object.entries(source).forEach(([key, comp]) => {
    if (!comp) return;
    if (CUSTOM_COMPONENT_KEYS.includes(key)) {
      (Array.isArray(comp) ? comp : []).forEach((item, idx) =>
        result.push(normalizeSalaryComponent({ ...item, id: item._id || item.id || `${key}-${idx}`, type: 'custom' }))
      );
      return;
    }
    if (typeof comp !== 'object' || Array.isArray(comp)) return;
    result.push(normalizeSalaryComponent({ ...comp, id: comp._id || comp.id || key, name: comp.name || humanizeComponentKey(key), type: key }));
  });
  return result.filter((c) => c.enabled !== false && Number(c.value) > 0);
}

export function normalizeSalaryStructure(structure) {
  if (!structure) return null;
  const user = structure.userId || structure.user || {};
  return {
    id: structure._id || structure.id,
    userId: (typeof user === 'object' ? user._id : user) || structure.userId,
    user: typeof user === 'object' ? normalizeUser(user) : null,
    grossSalary: structure.monthlyGrossSalary ?? structure.grossSalary ?? structure.gross ?? 0,
    annualCTC: structure.annualCTC ?? 0,
    earnings: normalizeComponentMap(structure.earnings),
    deductions: normalizeComponentMap(structure.deductions),
    overtime: structure.overtime || null,
    remarks: structure.remarks,
    status: structure.status || 'active',
    effectiveFrom: structure.effectiveFrom || structure.createdAt,
    updatedAt: structure.updatedAt,
    raw: structure,
  };
}

export function normalizeBonus(bonus) {
  if (!bonus) return null;
  const user = bonus.userId || bonus.user || {};
  return {
    id: bonus._id || bonus.id,
    user: typeof user === 'object' ? normalizeUser(user) : null,
    userId: (typeof user === 'object' ? user._id : user) || bonus.userId,
    bonusType: bonus.bonusType || bonus.type,
    reason: bonus.reason,
    amount: bonus.amount ?? 0,
    approvedBy: bonus.approvedBy?.name || bonus.approvedByName || null,
    date: bonus.date || bonus.createdAt,
    status: bonus.status || 'pending',
    raw: bonus,
  };
}

export function normalizeReimbursement(item) {
  if (!item) return null;
  const user = item.userId || item.user || {};
  return {
    id: item._id || item.id,
    user: typeof user === 'object' ? normalizeUser(user) : null,
    userId: (typeof user === 'object' ? user._id : user) || item.userId,
    category: item.category || 'other',
    description: item.description,
    amount: item.amount ?? 0,
    receiptUrl: item.receiptUrl,
    date: item.date || item.createdAt,
    status: item.status || 'pending',
    rejectionReason: item.rejectionReason,
    raw: item,
  };
}

export function normalizeLoan(loan) {
  if (!loan) return null;
  const user = loan.userId || loan.user || {};
  const principal = loan.principal ?? loan.amount ?? 0;
  const outstanding = loan.outstanding ?? loan.balance ?? principal;
  return {
    id: loan._id || loan.id,
    user: typeof user === 'object' ? normalizeUser(user) : null,
    userId: (typeof user === 'object' ? user._id : user) || loan.userId,
    type: loan.type || 'loan',
    principal,
    emi: loan.emi ?? 0,
    tenureMonths: loan.tenureMonths ?? 0,
    outstanding,
    paid: principal - outstanding,
    status: loan.status || 'active',
    startDate: loan.startDate || loan.createdAt,
    payments: loan.payments || [],
    raw: loan,
  };
}

export function normalizeUser(user) {
  if (!user) return null;
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const name = user.name || `${firstName} ${lastName}`.trim();
  return {
    id: user._id || user.id,
    name: name || user.email,
    firstName,
    lastName,
    email: user.email,
    employeeCode: user.employeeCode,
    role: user.role,
    department: user.department,
    designation: user.designation,
    phone: user.phone,
    baseSalary: user.baseSalary,
    joiningDate: user.joiningDate,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    address: user.address,
    emergencyContact: user.emergencyContact,
    salary: user.salary || [],
    raw: user,
  };
}

export function normalizeSalaryField(field) {
  if (!field) return null;
  return {
    id: field._id || field.id,
    name: field.name,
    code: field.code,
    description: field.description || '',
    group: field.group || field.type || 'other',
    inputType: field.inputType || 'text',
    defaultValue: field.defaultValue,
    calculationBase: field.calculationBase || null,
    placeholder: field.placeholder,
    options: (field.options || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    isRequired: Boolean(field.isRequired),
    isEditable: field.isEditable !== false,
    isVisible: field.isVisible !== false,
    isActive: field.isActive !== false,
    sortOrder: field.sortOrder ?? 0,
    raw: field,
  };
}
