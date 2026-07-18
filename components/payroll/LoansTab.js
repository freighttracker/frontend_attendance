'use client';

import { useState } from 'react';
import { useGetUsersQuery } from '@/lib/services/usersApi';
import { useGetLoansQuery } from '@/lib/services/loanApi';
import { normalizeUser, normalizeLoan } from '@/lib/utils/normalize';
import { unwrapList } from '@/lib/utils/queryParams';
import LoanCard from './LoanCard';
import AddLoanModal from './AddLoanModal';
import LoanPaymentModal from './LoanPaymentModal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { PlusIcon } from '../icons';

export default function LoansTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [payingLoan, setPayingLoan] = useState(null);
  const [status, setStatus] = useState('active');

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 200, role: 'employee' });
  const { data: loansData, isLoading } = useGetLoansQuery({ status: status || undefined, page: 1, limit: 100 });

  const { items: userItems } = unwrapList(usersData);
  const employees = userItems.map(normalizeUser).filter((u) => u.role === 'employee');
  const { items } = unwrapList(loansData);
  const loans = items.map(normalizeLoan);

  return (
    <div className="fade-in">
      <div className="filters-bar">
        <select className="fi" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : loans.length ? (
        loans.map((loan) => <LoanCard key={loan.id} loan={loan} onRecordPayment={setPayingLoan} />)
      ) : (
        <div className="card"><EmptyState>No loans or advances recorded yet</EmptyState></div>
      )}

      <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add loan">
        <PlusIcon />
      </button>

      <AddLoanModal open={addOpen} onClose={() => setAddOpen(false)} employees={employees} />
      <LoanPaymentModal loan={payingLoan} onClose={() => setPayingLoan(null)} />
    </div>
  );
}
