'use client';

import { useEffect, useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetAllSalarySlipsQuery } from '@/lib/services/salaryApi';
import { useGetSalaryStructureQuery } from '@/lib/services/payrollApi';
import { normalizeUser, normalizeSalarySlip, normalizeSalaryStructure } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast } from '@/lib/hooks';
import { pad } from '@/lib/utils/format';
import PayrollSlipDocument from './PayrollSlipDocument';
import SalaryHistoryTimeline from './SalaryHistoryTimeline';
import Modal from '../ui/Modal';
import PrintPortal from '../ui/PrintPortal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { DownloadIcon, PrinterIcon, MailIcon, ShareIcon } from '../icons';

export default function SalarySlipsTab() {
  // Default to last month - the current month rarely has a finished slip yet.
  const lastMonth = new Date();
  lastMonth.setDate(1);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const [userId, setUserId] = useState('');
  const [period, setPeriod] = useState(`${lastMonth.getFullYear()}-${pad(lastMonth.getMonth() + 1)}`);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const toast = useToast();

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const effectiveUserId = userId || employees[0]?.id || '';

  const [year, month] = period.split('-').map(Number);
  const { data: slipsData, isLoading: slipsLoading } = useGetAllSalarySlipsQuery(
    { userId: effectiveUserId, month, year, page: 1, limit: 5 },
    { skip: !effectiveUserId }
  );
  const { data: structureData } = useGetSalaryStructureQuery(effectiveUserId, { skip: !effectiveUserId });

  const { items: slipItems } = unwrapList(slipsData);
  const slip = slipItems.map(normalizeSalarySlip)[0];
  const employee = employees.find((e) => e.id === effectiveUserId);
  const structure = normalizeSalaryStructure(structureData);
  const companyName = employee?.company?.name || 'AttendanceHR';
  console.log('slip', slip, 'employee', employee, 'structure', structure, 'companyName', companyName);

  function handlePrint() {
    setPrintMode(true);
    requestAnimationFrame(() => window.print());
  }

  useEffect(() => {
    if (!printMode) return undefined;
    const reset = () => setPrintMode(false);
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, [printMode]);

  function handleEmail() {
    if (!employee?.email) {
      toast('No email on file for this employee', 'err');
      return;
    }
    const subject = encodeURIComponent(`Salary Slip — ${employee.name}`);
    window.location.href = `mailto:${employee.email}?subject=${subject}`;
  }

  async function handleShare() {
    const shareData = { title: `Salary Slip — ${employee?.name}`, text: `Salary slip for ${employee?.name}, ${period}` };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareData.text);
      toast('Slip summary copied to clipboard');
    }
  }

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <select className="fi" style={{ flex: 1, minWidth: 160 }} value={effectiveUserId} onChange={(e) => setUserId(e.target.value)}>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <input type="month" className="fi" value={period} onChange={(e) => setPeriod(e.target.value)} />
      </div>

      <div className="slip-toolbar">
        <button className="btn btn-g btn-sm" onClick={handlePrint} disabled={!slip}>
          <DownloadIcon style={{ width: 13, height: 13 }} /> Download PDF
        </button>
        <button className="btn btn-g btn-sm" onClick={handlePrint} disabled={!slip}>
          <PrinterIcon style={{ width: 13, height: 13 }} /> Print
        </button>
        <button className="btn btn-g btn-sm" onClick={handleEmail} disabled={!slip}>
          <MailIcon style={{ width: 13, height: 13 }} /> Email
        </button>
        <button className="btn btn-g btn-sm" onClick={handleShare} disabled={!slip}>
          <ShareIcon style={{ width: 13, height: 13 }} /> Share
        </button>
        <button className="btn btn-p btn-sm" onClick={() => setPreviewOpen(true)} disabled={!slip}>
          Preview
        </button>
      </div>

      {usersLoading || slipsLoading ? (
        <Spinner />
      ) : slip && employee ? (
        <PayrollSlipDocument slip={slip} employee={employee} structure={structure} companyName={companyName} />
      ) : (
        <EmptyState>No salary slip generated for this employee in the selected period</EmptyState>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-label">Salary history</div>
        <SalaryHistoryTimeline
          userId={userId}
          onSelect={(s) => setPeriod(`${s.year}-${pad(s.month)}`)}
        />
      </div>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Salary Slip Preview">
        {slip && employee ? <PayrollSlipDocument slip={slip} employee={employee} structure={structure}  companyName={companyName}/> : null}
      </Modal>

      {printMode && slip && employee ? (
        <PrintPortal>
          <PayrollSlipDocument slip={slip} employee={employee} structure={structure} companyName={companyName} />
        </PrintPortal>
      ) : null}
    </div>
  );
}
