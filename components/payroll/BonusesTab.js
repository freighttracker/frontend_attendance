'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetBonusesQuery, useApproveBonusMutation, useDeleteBonusMutation } from '@/lib/services/bonusApi';
import { normalizeUser, normalizeBonus } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import BonusRow from './BonusRow';
import AddBonusModal from './AddBonusModal';
import ConfirmModal from '../ui/ConfirmModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { PlusIcon } from '../icons';

export default function BonusesTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { data: bonusesData, isLoading } = useGetBonusesQuery({ page: 1, limit: 100 });
  const [approveBonus] = useApproveBonusMutation();
  const [deleteBonus, { isLoading: deleting }] = useDeleteBonusMutation();

  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const { items } = unwrapList(bonusesData);
  const bonuses = items.map(normalizeBonus);

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await approveBonus(id).unwrap();
      toast('Bonus approved');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not approve bonus.'), 'err');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    try {
      await deleteBonus(deleteTarget.id).unwrap();
      toast('Bonus removed');
      setDeleteTarget(null);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not remove bonus.'), 'err');
    }
  }

  return (
    <div className="fade-in">
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : bonuses.length ? (
          bonuses.map((b) => (
            <BonusRow key={b.id} bonus={b} isBusy={busyId === b.id} onApprove={handleApprove} onDelete={setDeleteTarget} />
          ))
        ) : (
          <EmptyState>No bonuses recorded yet</EmptyState>
        )}
      </div>

      <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add bonus">
        <PlusIcon />
      </button>

      <AddBonusModal open={addOpen} onClose={() => setAddOpen(false)} employees={employees} />
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Remove Bonus?"
        subtitle={<>Remove this bonus entry for <b>{deleteTarget?.user?.name}</b>?</>}
      />
    </div>
  );
}
