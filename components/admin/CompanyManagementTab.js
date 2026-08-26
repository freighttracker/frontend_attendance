'use client';

import { useState } from 'react';
import {
  useGetCompaniesQuery,
  useGetSubCompaniesQuery,
  useGetCompanyStatsQuery,
  useSetCompanyStatusMutation,
  useSetSubCompanyStatusMutation,
  useGetCompanyUsersQuery,
  useGetSubCompanyUsersQuery,
} from '@/lib/services/companiesApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils/format';
import CompanyModal from './CompanyModal';
import SubCompanyModal from './SubCompanyModal';
import KpiCard from '../payroll/KpiCard';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';
import { PlusIcon, EditIcon, UsersIcon, BuildingIcon, CheckIcon, XIcon } from '../icons';

function CompanyStatsRow() {
  const { data, isLoading } = useGetCompanyStatsQuery();
  if (isLoading || !data) return null;

  return (
    <>
      <div className="kpi-grid">
        <KpiCard icon={BuildingIcon} tone="ind" label="Total Companies" value={data.totalCompanies} />
        <KpiCard icon={BuildingIcon} tone="ind" label="Total Subcompanies" value={data.totalSubCompanies} />
        <KpiCard icon={UsersIcon} tone="ind" label="Total Users" value={data.totalUsers} />
        <KpiCard icon={CheckIcon} tone="grn" label="Active Companies" value={data.activeCompanies} />
        <KpiCard icon={XIcon} tone="red" label="Inactive Companies" value={data.inactiveCompanies} />
        <KpiCard icon={CheckIcon} tone="grn" label="Active Subcompanies" value={data.activeSubCompanies} />
      </div>
      {data.recentCompanies?.length || data.recentSubCompanies?.length ? (
        <div className="chart-grid">
          <div className="card">
            <div className="card-label">Recent companies</div>
            {data.recentCompanies?.length ? (
              data.recentCompanies.map((c) => (
                <div className="prow" key={c._id}>
                  <span className="pl">{c.name} ({c.code})</span>
                  <span className="pv">{fmtDate(c.createdAt)}</span>
                </div>
              ))
            ) : (
              <EmptyState>No companies yet</EmptyState>
            )}
          </div>
          <div className="card">
            <div className="card-label">Recent subcompanies</div>
            {data.recentSubCompanies?.length ? (
              data.recentSubCompanies.map((s) => (
                <div className="prow" key={s._id}>
                  <span className="pl">{s.name} · {s.company?.name || '—'}</span>
                  <span className="pv">{fmtDate(s.createdAt)}</span>
                </div>
              ))
            ) : (
              <EmptyState>No subcompanies yet</EmptyState>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function StatusChip({ isActive }) {
  return <span className={`chip ${isActive ? 'chip-approved' : 'chip-pending'}`}>{isActive ? 'Active' : 'Inactive'}</span>;
}

function UsersListModal({ scope, onClose }) {
  const isCompany = scope?.type === 'company';
  const companyQuery = useGetCompanyUsersQuery({ id: scope?.id, limit: 100 }, { skip: !scope || !isCompany });
  const subCompanyQuery = useGetSubCompanyUsersQuery({ id: scope?.id, limit: 100 }, { skip: !scope || isCompany });
  const { data, isLoading } = isCompany ? companyQuery : subCompanyQuery;
  const users = data?.items || [];

  return (
    <Modal open={Boolean(scope)} onClose={onClose} title={`Users — ${scope?.name || ''}`} subtitle={`${data?.pagination?.total ?? users.length} user(s)`}>
      {isLoading ? (
        <Spinner />
      ) : users.length ? (
        <div className="card" style={{ padding: '0 16px' }}>
          {users.map((u) => (
            <div className="drow" key={u._id}>
              <div className="drow-info">
                <div className="drow-title">{u.firstName} {u.lastName}</div>
                <div className="drow-sub">{u.employeeCode} · {u.email} · {u.role}</div>
              </div>
              <StatusChip isActive={u.isActive} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>No users assigned here yet</EmptyState>
      )}
    </Modal>
  );
}

function SubCompanyRow({ subCompany, onEdit, onViewUsers }) {
  const [setStatus, { isLoading: togglingStatus }] = useSetSubCompanyStatusMutation();
  const toast = useToast();

  async function toggleStatus() {
    try {
      await setStatus({ id: subCompany._id, isActive: !subCompany.isActive }).unwrap();
      toast(`Subcompany ${subCompany.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not update subcompany status.'), 'err');
    }
  }

  return (
    <div className="drow" style={{ paddingLeft: 28 }}>
      <div className="drow-info">
        <div className="drow-title">{subCompany.name}</div>
        <div className="drow-sub">{subCompany.code} · {subCompany.userCount ?? 0} user(s)</div>
      </div>
      <StatusChip isActive={subCompany.isActive} />
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        <button className="ib" title="View users" onClick={() => onViewUsers({ type: 'subcompany', id: subCompany._id, name: subCompany.name })}>
          <UsersIcon />
        </button>
        <button className="ib" title="Edit" onClick={() => onEdit(subCompany)}>
          <EditIcon />
        </button>
        <button className="btn btn-g btn-sm" disabled={togglingStatus} onClick={toggleStatus}>
          {subCompany.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

function CompanyRow({ company, subCompanies, expanded, onToggleExpand, onEditCompany, onAddSubCompany, onEditSubCompany, onViewUsers }) {
  const [setStatus, { isLoading: togglingStatus }] = useSetCompanyStatusMutation();
  const toast = useToast();

  async function toggleStatus() {
    try {
      await setStatus({ id: company._id, isActive: !company.isActive }).unwrap();
      toast(`Company ${company.isActive ? 'deactivated (and its subcompanies)' : 'activated'}`);
    } catch (err) {
      toast(extractErrorMessage(err, 'Could not update company status.'), 'err');
    }
  }

  return (
    <div className="card" style={{ padding: '0 16px', marginBottom: 10 }}>
      <div className="drow">
        <button
          type="button"
          className="ib"
          style={{ flexShrink: 0 }}
          onClick={() => onToggleExpand(company._id)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <span className={`dsf-chevron ${expanded ? 'open' : ''}`}>⌄</span>
        </button>
        <div className="uav" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
          <BuildingIcon />
        </div>
        <div className="drow-info">
          <div className="drow-title">{company.name}</div>
          <div className="drow-sub">
            {company.code} · {company.subCompanyCount ?? 0} subcompany(ies) · {company.userCount ?? 0} user(s)
          </div>
        </div>
        <StatusChip isActive={company.isActive} />
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <button className="ib" title="View users" onClick={() => onViewUsers({ type: 'company', id: company._id, name: company.name })}>
            <UsersIcon />
          </button>
          <button className="ib" title="Edit" onClick={() => onEditCompany(company)}>
            <EditIcon />
          </button>
          <button className="btn btn-g btn-sm" disabled={togglingStatus} onClick={toggleStatus}>
            {company.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div style={{ borderTop: '1px solid var(--g100)', marginTop: 4 }}>
          {subCompanies.length ? (
            subCompanies.map((s) => (
              <SubCompanyRow key={s._id} subCompany={s} onEdit={onEditSubCompany} onViewUsers={onViewUsers} />
            ))
          ) : (
            <EmptyState>No subcompanies yet</EmptyState>
          )}
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ margin: '10px 0 10px 28px' }}
            onClick={() => onAddSubCompany(company)}
          >
            <PlusIcon style={{ width: 12, height: 12 }} /> Add subcompany
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CompanyManagementTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [subCompanyModalOpen, setSubCompanyModalOpen] = useState(false);
  const [subCompanyParent, setSubCompanyParent] = useState(null);
  const [editingSubCompany, setEditingSubCompany] = useState(null);
  const [viewUsersScope, setViewUsersScope] = useState(null);

  const { data: companiesData, isLoading: companiesLoading } = useGetCompaniesQuery({
    search: search || undefined,
    isActive: statusFilter || undefined,
    limit: 200,
  });
  const { data: subCompaniesData, isLoading: subCompaniesLoading } = useGetSubCompaniesQuery({ limit: 500 });

  const companies = companiesData?.items || [];
  const allSubCompanies = subCompaniesData?.items || [];

  function subCompaniesFor(companyId) {
    return allSubCompanies.filter((s) => (s.company?._id || s.company) === companyId);
  }

  function toggleExpand(companyId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  }

  const isLoading = companiesLoading || subCompaniesLoading;

  return (
    <div className="fade-in">
      <CompanyStatsRow />
      <div className="filters-bar">
        <input className="fi" style={{ flex: 1, minWidth: 160 }} placeholder="Search company name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="fi" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          className="btn btn-p btn-sm"
          onClick={() => {
            setEditingCompany(null);
            setCompanyModalOpen(true);
          }}
        >
          <PlusIcon style={{ width: 12, height: 12 }} /> New company
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : companies.length ? (
        companies.map((c) => (
          <CompanyRow
            key={c._id}
            company={c}
            subCompanies={subCompaniesFor(c._id)}
            expanded={expanded.has(c._id)}
            onToggleExpand={toggleExpand}
            onEditCompany={(company) => {
              setEditingCompany(company);
              setCompanyModalOpen(true);
            }}
            onAddSubCompany={(company) => {
              setSubCompanyParent(company);
              setEditingSubCompany(null);
              setSubCompanyModalOpen(true);
            }}
            onEditSubCompany={(subCompany) => {
              setSubCompanyParent(c);
              setEditingSubCompany(subCompany);
              setSubCompanyModalOpen(true);
            }}
            onViewUsers={setViewUsersScope}
          />
        ))
      ) : (
        <EmptyState>No companies match these filters</EmptyState>
      )}

      <CompanyModal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} company={editingCompany} />
      <SubCompanyModal
        open={subCompanyModalOpen}
        onClose={() => setSubCompanyModalOpen(false)}
        company={subCompanyParent}
        subCompany={editingSubCompany}
      />
      <UsersListModal scope={viewUsersScope} onClose={() => setViewUsersScope(null)} />
    </div>
  );
}
