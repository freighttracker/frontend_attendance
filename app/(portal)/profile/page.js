'use client';

import { useState } from 'react';
import { useGetMyProfileQuery } from '@/lib/services/usersApi';
import { useGetMySalarySlipsQuery } from '@/lib/services/salaryApi';
import { normalizeUser, normalizeSalarySlip } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { fmtDate, fmtCurrency, initials, titleCase } from '@/lib/utils/format';
import EditProfileModal from '@/components/profile/EditProfileModal';
import SalarySlipCard from '@/components/salary/SalarySlipCard';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import PrintPortal from '@/components/ui/PrintPortal';
import { EditIcon, PrinterIcon } from '@/components/icons';

export default function ProfilePage() {
  const { data, isLoading } = useGetMyProfileQuery();
  const profile = normalizeUser(data?.user || data);
  const [editOpen, setEditOpen] = useState(false);

  const now = new Date();
  const [slipMonth, setSlipMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [year, month] = slipMonth.split('-').map(Number);

  const { data: slipsData, isFetching: slipsLoading } = useGetMySalarySlipsQuery({ year, limit: 50 });
  const { items } = unwrapList(slipsData);
  const slip = items.map(normalizeSalarySlip).find((s) => s.month === month && s.year === year);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <>
        <div className="ph">
          <h1>My Profile</h1>
        </div>
        <Spinner />
      </>
    );
  }

  return (
    <>
      <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>My Profile</h1>
          <p>Your account and payroll details</p>
        </div>
        <button className="ib" onClick={() => setEditOpen(true)} title="Edit profile">
          <EditIcon />
        </button>
      </div>

      <div className="prof-hero">
        <div className="prof-av">{initials(profile?.name)}</div>
        <div className="prof-name">{profile?.name || '—'}</div>
        <div className="prof-role">{titleCase(profile?.role)}</div>
      </div>

      <div className="card" style={{ padding: '0 16px' }}>
        <div className="prow">
          <span className="pl">Employee code</span>
          <span className="pv">{profile?.employeeCode || '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Email</span>
          <span className="pv">{profile?.email || '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Department</span>
          <span className="pv">{profile?.department || '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Designation</span>
          <span className="pv">{profile?.designation || '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Phone</span>
          <span className="pv">{profile?.phone || '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Join date</span>
          <span className="pv">{profile?.joiningDate ? fmtDate(profile.joiningDate) : '—'}</span>
        </div>
        <div className="prow">
          <span className="pl">Base salary</span>
          <span className="pv">{profile?.baseSalary != null ? fmtCurrency(profile.baseSalary) : '—'}</span>
        </div>
      </div>

      <div className="sec-h" style={{ marginTop: 14 }}>
        <span className="sec-t">Salary Slip</span>
      </div>
      <div className="frow" style={{ marginBottom: 10 }}>
        <div className="ff" style={{ margin: 0 }}>
          <input type="month" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={slipMonth} onChange={(e) => setSlipMonth(e.target.value)} />
        </div>
        <button className="btn btn-g btn-sm" onClick={handlePrint} disabled={!slip}>
          <PrinterIcon style={{ width: 12, height: 12 }} />
          Print
        </button>
      </div>
      {slipsLoading ? (
        <Spinner />
      ) : slip ? (
        <>
          <SalarySlipCard slip={slip} employeeName={profile?.name} employeeMeta={profile?.department || 'Employee'} />
          <PrintPortal>
            <SalarySlipCard slip={slip} employeeName={profile?.name} employeeMeta={profile?.department || 'Employee'} />
          </PrintPortal>
        </>
      ) : (
        <div className="card">
          <EmptyState>No salary slip generated for this month yet</EmptyState>
        </div>
      )}

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} />
    </>
  );
}
