'use client';

import { fmtCurrency } from '@/lib/utils/format';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';

function componentAmount(component, gross) {
  const value = Number(component.value) || 0;
  return component.calcType === 'percentage' ? (value / 100) * gross : value;
}

export default function SalaryStructureViewModal({ open, onClose, employee, structure }) {
  const gross = structure?.grossSalary ?? 0;
  const earnings = structure?.earnings || [];
  const deductions = (structure?.deductions || []).filter((d) => d.enabled !== false);
  const totalEarnings = earnings.reduce((sum, c) => sum + componentAmount(c, gross), 0);
  const totalDeductions = deductions.reduce((sum, c) => sum + componentAmount(c, gross), 0);

  return (
    <Modal open={open} onClose={onClose} title="Salary Structure" subtitle={employee?.name}>
      {!structure ? (
        <EmptyState>No salary structure configured for this employee yet</EmptyState>
      ) : (
        <div className="slip" style={{ border: 'none', padding: 0 }}>
          <div className="slip-row">
            <span>Gross salary</span>
            <span>{fmtCurrency(gross)}</span>
          </div>
          {earnings.map((c) => (
            <div className="slip-row" key={c.id || c.name}>
              <span>{c.name} {c.calcType === 'percentage' ? `(${c.value}%)` : ''}</span>
              <span>{fmtCurrency(componentAmount(c, gross))}</span>
            </div>
          ))}
          <div className="slip-row" style={{ fontWeight: 800 }}>
            <span>Total earnings</span>
            <span>{fmtCurrency(totalEarnings)}</span>
          </div>
          {deductions.map((c) => (
            <div className="slip-row ded" key={c.id || c.name}>
              <span>{c.name} {c.calcType === 'percentage' ? `(${c.value}%)` : ''}</span>
              <span>−{fmtCurrency(componentAmount(c, gross))}</span>
            </div>
          ))}
          <div className="slip-row ttl">
            <span>Estimated net salary</span>
            <span>{fmtCurrency(totalEarnings - totalDeductions)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
