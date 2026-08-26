'use client';

import { useState } from 'react';
import { useCreateSubCompanyMutation, useUpdateSubCompanyMutation } from '@/lib/services/companiesApi';
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
};

function formFromSubCompany(subCompany) {
  if (!subCompany) return emptyForm;
  return {
    name: subCompany.name || '',
    code: subCompany.code || '',
    email: subCompany.email || '',
    phone: subCompany.phone || '',
    address: subCompany.address || '',
    city: subCompany.city || '',
    state: subCompany.state || '',
    country: subCompany.country || 'India',
    taxNumber: subCompany.taxNumber || '',
    website: subCompany.website || '',
    contactPerson: subCompany.contactPerson || '',
  };
}

// `company` is the parent Company object this subcompany is being created
// under (or already belongs to, when editing) - the form never lets the
// admin type a different company, it's always the one they opened this from.
function SubCompanyForm({ onClose, company, subCompany }) {
  const isEdit = Boolean(subCompany);
  const [createSubCompany, { isLoading: creating }] = useCreateSubCompanyMutation();
  const [updateSubCompany, { isLoading: updating }] = useUpdateSubCompanyMutation();
  const toast = useToast();
  const [form, setForm] = useState(() => formFromSubCompany(subCompany));
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    setError('');
    if (!form.name || !form.code) {
      setError('Subcompany name and code are required.');
      return;
    }
    try {
      if (isEdit) {
        const { code, ...payload } = form;
        await updateSubCompany({ id: subCompany._id, ...payload }).unwrap();
        toast('Subcompany updated');
      } else {
        await createSubCompany({ company: company._id, ...form }).unwrap();
        toast('Subcompany created');
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save subcompany.'));
    }
  }

  return (
    <div>
      <div className="ff">
        <label className="fl">Main company</label>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{company?.name}</div>
        <div style={{ fontSize: 11, color: 'var(--g400)' }}>{company?.code}</div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Subcompany name</label>
          <input className="fi" value={form.name} onChange={set('name')} />
        </div>
        <div className="ff">
          <label className="fl">Subcompany code</label>
          <input className="fi" value={form.code} onChange={set('code')} disabled={isEdit} placeholder="e.g. A1" />
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

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : isEdit ? 'Save' : 'Create subcompany'}
        </button>
      </div>
    </div>
  );
}

export default function SubCompanyModal({ open, onClose, company, subCompany }) {
  return (
    <Modal open={open} onClose={onClose} title={subCompany ? 'Edit Subcompany' : 'Create Subcompany'} wide>
      {open ? <SubCompanyForm key={subCompany?._id || 'new'} onClose={onClose} company={company} subCompany={subCompany} /> : null}
    </Modal>
  );
}
