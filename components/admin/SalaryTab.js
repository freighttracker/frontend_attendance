'use client';

import { useEffect, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import {
  useGetAllSalarySlipsQuery,
  useGenerateSalarySlipMutation,
  useGenerateAllSalarySlipsMutation,
  useApproveSalarySlipMutation,
} from '@/lib/services/salaryApi';
import { normalizeUser, normalizeSalarySlip } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import SalaryRow from './SalaryRow';
import MarkPaidModal from './MarkPaidModal';
import SalarySlipCard from '../salary/SalarySlipCard';
import PrintPortal from '../ui/PrintPortal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { MONTH_NAMES } from '@/lib/utils/format';

export default function SalaryTab() {
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [loadedPeriod, setLoadedPeriod] = useState(period);
  const [year, month] = loadedPeriod.split('-').map(Number);
  const [payingId, setPayingId] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const toast = useToast();

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { data: slipsData, isLoading: slipsLoading } = useGetAllSalarySlipsQuery({ month, year, page: 1, limit: 200 });
  const [generateSlip, { isLoading: generating }] = useGenerateSalarySlipMutation();
  const [generateAll, { isLoading: generatingAll }] = useGenerateAllSalarySlipsMutation();
  const [approveSlip, { isLoading: approving }] = useApproveSalarySlipMutation();

  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const { items: slipItems } = unwrapList(slipsData);
  const slips = slipItems.map(normalizeSalarySlip);

  function slipForUser(userId) {
    return slips.find((s) => (typeof s.user === 'object' ? s.user?._id : s.user) === userId);
  }

  async function handleGenerate(userId) {
    try {
      await generateSlip({ userId, month, year }).unwrap();
      toast('Salary slip generated');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not generate slip.'), 'err');
    }
  }

  async function handleGenerateAll() {
    try {
      await generateAll({ month, year }).unwrap();
      toast('Salary slips generated for all employees');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not generate slips.'), 'err');
    }
  }

  async function handleApprove(id) {
    try {
      await approveSlip(id).unwrap();
      toast('Salary slip approved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve slip.'), 'err');
    }
  }

  function handlePrintAll() {
    setPrintMode(true);
    requestAnimationFrame(() => window.print());
  }

  useEffect(() => {
    if (!printMode) return undefined;
    const reset = () => setPrintMode(false);
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, [printMode]);

  const isBusy = generating || generatingAll || approving;
  const isLoading = usersLoading || slipsLoading;

  return (
    <div>
      <div className="frow" style={{ marginBottom: 11 }}>
        <div className="ff" style={{ margin: 0 }}>
          <input type="month" className="fi" style={{ fontSize: 12, padding: '9px 11px' }} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <button className="btn btn-g btn-sm" onClick={() => setLoadedPeriod(period)}>
          Load
        </button>
        <button className="btn btn-g btn-sm" onClick={handleGenerateAll} disabled={isBusy}>
          Generate all
        </button>
        <button className="btn btn-g btn-sm" onClick={handlePrintAll}>
          Print all
        </button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : employees.length ? (
          employees.map((u) => (
            <SalaryRow
              key={u.id}
              name={u.name}
              slip={slipForUser(u.id)}
              isBusy={isBusy}
              onGenerate={() => handleGenerate(u.id)}
              onApprove={handleApprove}
              onMarkPaid={setPayingId}
            />
          ))
        ) : (
          <EmptyState>No employees</EmptyState>
        )}
      </div>

      <MarkPaidModal slipId={payingId} onClose={() => setPayingId(null)} />

      {printMode ? (
        <PrintPortal>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>AttendanceHR</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
            All Salary Slips — {MONTH_NAMES[month - 1]} {year}
          </div>
          {employees.map((u) => {
            const slip = slipForUser(u.id);
            if (!slip) return null;
            return (
              <div key={u.id} style={{ pageBreakAfter: 'always', margin: '16px 0' }}>
                <SalarySlipCard slip={slip} employeeName={u.name} employeeMeta={u.department || 'Employee'} />
              </div>
            );
          })}
        </PrintPortal>
      ) : null}
    </div>
  );
}
