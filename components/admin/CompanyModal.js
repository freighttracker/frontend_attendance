'use client';

import { useState } from 'react';
import { useCreateCompanyMutation, useUpdateCompanyMutation } from '@/lib/services/companiesApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

const emptyForm = {
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  taxNumber: '',
  website: '',
  contactPerson: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPhone: '',
  adminPassword: '',
};

function formFromCompany(company) {
  if (!company) return emptyForm;
  return {
    name: company.name || '',
    code: company.code || '',
    email: company.email || '',
    phone: company.phone || '',
    address: company.address || '',
    city: company.city || '',
    state: company.state || '',
    country: company.country || 'India',
    taxNumber: company.taxNumber || '',
    website: company.website || '',
    contactPerson: company.contactPerson || '',
  };
}

function CompanyForm({ onClose, company }) {
  const isEdit = Boolean(company);
  const [createCompany, { isLoading: creating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyMutation();
  const toast = useToast();
  const [form, setForm] = useState(() => formFromCompany(company));
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    setError('');
    if (!form.name || !form.code) {
      setError('Company name and code are required.');
      return;
    }
    if (!isEdit) {
      if (!form.adminFirstName || !form.adminLastName || !form.adminEmail || !form.adminPassword) {
        setError('Admin name, email and password are required to create the company\'s first login.');
        return;
      }
      if (form.adminPassword.length < 6) {
        setError('Admin password must be at least 6 characters.');
        return;
      }
    }
    try {
      if (isEdit) {
        const { code, adminFirstName, adminLastName, adminEmail, adminPhone, adminPassword, ...payload } = form;
        await updateCompany({ id: company._id, ...payload }).unwrap();
        toast('Company updated');
      } else {
        await createCompany(form).unwrap();
        toast('Company and admin login created');
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save company.'));
    }
  }

  return (
    <div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Company name</label>
          <input className="fi" value={form.name} onChange={set('name')} />
        </div>
        <div className="ff">
          <label className="fl">Company code</label>
          <input className="fi" value={form.code} onChange={set('code')} disabled={isEdit} placeholder="e.g. ACME" />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Email</label>
          <input className="fi" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="ff">
          <label className="fl">Phone</label>
          <input className="fi" type="tel" value={form.phone} onChange={set('phone')} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Address</label>
        <input className="fi" value={form.address} onChange={set('address')} />
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">City</label>
          <input className="fi" value={form.city} onChange={set('city')} />
        </div>
        <div className="ff">
          <label className="fl">State</label>
          <input className="fi" value={form.state} onChange={set('state')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Country</label>
          <input className="fi" value={form.country} onChange={set('country')} />
        </div>
        <div className="ff">
          <label className="fl">GST / VAT / Tax number</label>
          <input className="fi" value={form.taxNumber} onChange={set('taxNumber')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Website</label>
          <input className="fi" value={form.website} onChange={set('website')} />
        </div>
        <div className="ff">
          <label className="fl">Contact person</label>
          <input className="fi" value={form.contactPerson} onChange={set('contactPerson')} />
        </div>
      </div>

      {!isEdit && (
        <>
          <h3 style={{ marginTop: 20, marginBottom: 8, fontSize: 14 }}>Company admin login</h3>
          <p className="fl" style={{ marginBottom: 10 }}>
            This account will be able to sign in and manage this company.
          </p>
          <div className="frow">
            <div className="ff">
              <label className="fl">Admin first name</label>
              <input className="fi" value={form.adminFirstName} onChange={set('adminFirstName')} />
            </div>
            <div className="ff">
              <label className="fl">Admin last name</label>
              <input className="fi" value={form.adminLastName} onChange={set('adminLastName')} />
            </div>
          </div>
          <div className="frow">
            <div className="ff">
              <label className="fl">Admin email</label>
              <input className="fi" type="email" value={form.adminEmail} onChange={set('adminEmail')} />
            </div>
            <div className="ff">
              <label className="fl">Admin phone</label>
              <input className="fi" type="tel" value={form.adminPhone} onChange={set('adminPhone')} />
            </div>
          </div>
          <div className="ff">
            <label className="fl">Admin password</label>
            <input className="fi" type="password" value={form.adminPassword} onChange={set('adminPassword')} placeholder="Min 6 characters" />
          </div>
        </>
      )}

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : isEdit ? 'Save' : 'Create company'}
        </button>
      </div>
    </div>
  );
}

export default function CompanyModal({ open, onClose, company }) {
  return (
    <Modal open={open} onClose={onClose} title={company ? 'Edit Company' : 'Create Company'} wide>
      {open ? <CompanyForm key={company?._id || 'new'} onClose={onClose} company={company} /> : null}
    </Modal>
  );
}
