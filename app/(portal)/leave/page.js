'use client';

import { useState } from 'react';
import { useGetMyLeavesQuery, useCancelLeaveMutation } from '@/lib/services/leavesApi';
import { normalizeLeave } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import LeaveApplyModal from '@/components/leave/LeaveApplyModal';
import LeaveRow from '@/components/leave/LeaveRow';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';


export default function LeavePage() {
  
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useGetMyLeavesQuery({ page: 1, limit: 50 });
  const [cancelLeave] = useCancelLeaveMutation();
  const toast = useToast();

  const { items } = unwrapList(data);
  const leaves = items.map(normalizeLeave).sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));

  async function handleCancel(id) {
    try {
      await cancelLeave(id).unwrap();
      toast('Leave request cancelled');
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not cancel leave.'), 'err');
    }
  }

  return (
    <>
      <div className="ph" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Leave Requests</h1>
          <p>Your submitted leave requests</p>
        </div>
        <button className="btn btn-p btn-sm" style={{ marginTop: 2 }} onClick={() => setModalOpen(true)}>
          + Apply
        </button>
      </div>
      <div className="card" style={{ padding: '0 16px' }}>
        {isLoading ? (
          <Spinner />
        ) : leaves.length ? (
          leaves.map((leave) => <LeaveRow key={leave.id} leave={leave} onCancel={handleCancel} />)
        ) : (
          <EmptyState>No leave requests yet</EmptyState>
        )}
      </div>
      <LeaveApplyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
