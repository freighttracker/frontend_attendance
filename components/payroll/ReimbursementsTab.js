'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetReimbursementsQuery, useApproveReimbursementMutation } from '@/lib/services/reimbursementApi';
import { normalizeUser, normalizeReimbursement } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtCurrency } from '@/lib/utils/format';
import ReimbursementRow from './ReimbursementRow';
import AddReimbursementModal, { REIMBURSEMENT_CATEGORIES } from './AddReimbursementModal';
import RejectReimbursementModal from './RejectReimbursementModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { ReceiptIcon, PlusIcon } from '../icons';

export default function ReimbursementsTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const toast = useToast();

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { data: reimbData, isLoading } = useGetReimbursementsQuery({ page: 1, limit: 100 });
  const [approveReimbursement] = useApproveReimbursementMutation();

  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const { items } = unwrapList(reimbData);
  const reimbursements = items.map(normalizeReimbursement);

  const totalsByCategory = REIMBURSEMENT_CATEGORIES.reduce((acc, cat) => {
    const key = cat.toLowerCase();
    acc[key] = reimbursements.filter((r) => r.category === key).reduce((sum, r) => sum + r.amount, 0);
    return acc;
  }, {});

  const filtered = activeCategory ? reimbursements.filter((r) => r.category === activeCategory) : reimbursements;

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await approveReimbursement(id).unwrap();
      toast('Reimbursement approved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve reimbursement.'), 'err');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fade-in">
      <div className="cat-grid">
        {REIMBURSEMENT_CATEGORIES.map((cat) => {
          const key = cat.toLowerCase();
          return (
            <button key={cat} type="button" className={`cat-card ${activeCategory === key ? 'on' : ''}`} onClick={() => setActiveCategory(activeCategory === key ? '' : key)}>
              <div className="qa-icon"><ReceiptIcon /></div>
              <div className="cat-amt">{fmtCurrency(totalsByCategory[key] || 0)}</div>
              <div className="cat-lbl">{cat}</div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : filtered.length ? (
          filtered.map((item) => (
            <ReimbursementRow key={item.id} item={item} isBusy={busyId === item.id} onApprove={handleApprove} onReject={setRejectId} />
          ))
        ) : (
          <EmptyState>No reimbursement claims yet</EmptyState>
        )}
      </div>

      <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add reimbursement">
        <PlusIcon />
      </button>

      <AddReimbursementModal open={addOpen} onClose={() => setAddOpen(false)} employees={employees} />
      <RejectReimbursementModal reimbursementId={rejectId} onClose={() => setRejectId(null)} />
    </div>
  );
}
