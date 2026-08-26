'use client';

import { useGetCompaniesQuery, useGetSubCompaniesQuery } from '@/lib/services/companiesApi';

// Reusable Company -> Subcompany selector. `value` is { companyId, subCompanyId }
// (either may be empty string / null for "All"). `allowAll` shows an
// "All companies" option at the top, for scope-filtering a dashboard/report;
// pass allowAll={false} for a required single-subcompany picker like the
// employee assignment form.
export default function CompanyHierarchySelector({ value, onChange, allowAll = true, requireSubCompany = false }) {
  const { data: companiesData, isLoading: companiesLoading } = useGetCompaniesQuery({ limit: 200 });
  const { data: subCompaniesData, isLoading: subCompaniesLoading } = useGetSubCompaniesQuery(
    value.companyId ? { companyId: value.companyId, limit: 200 } : { limit: 200 },
    { skip: !value.companyId && !allowAll }
  );

  const companies = companiesData?.items || [];
  const allSubCompanies = subCompaniesData?.items || [];
  const subCompanies = value.companyId
    ? allSubCompanies.filter((s) => (s.company?._id || s.company) === value.companyId)
    : [];

  function handleCompanyChange(e) {
    const companyId = e.target.value;
    onChange({ companyId, subCompanyId: '' });
  }

  function handleSubCompanyChange(e) {
    onChange({ companyId: value.companyId, subCompanyId: e.target.value });
  }

  return (
    <div className="frow" style={{ margin: 0 }}>
      <div className="ff" style={{ margin: 0 }}>
        <label className="fl">Company</label>
        <select className="fi" value={value.companyId || ''} onChange={handleCompanyChange} disabled={companiesLoading}>
          {allowAll ? <option value="">All companies</option> : <option value="">Select a company…</option>}
          {companies.map((c) => (
            <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
          ))}
        </select>
      </div>
      <div className="ff" style={{ margin: 0 }}>
        <label className="fl">Subcompany</label>
        <select
          className="fi"
          value={value.subCompanyId || ''}
          onChange={handleSubCompanyChange}
          disabled={!value.companyId || subCompaniesLoading}
        >
          {allowAll && !requireSubCompany ? <option value="">All subcompanies</option> : <option value="">Select a subcompany…</option>}
          {subCompanies.map((s) => (
            <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
