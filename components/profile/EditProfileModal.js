'use client';

import { useState } from 'react';
import { useUpdateMyProfileMutation } from '@/lib/services/usersApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

function EditProfileForm({ onClose, profile }) {
  
  const [updateProfile, { isLoading }] = useUpdateMyProfileMutation();
  const toast = useToast();
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [contactName, setContactName] = useState(profile?.emergencyContact?.name || '');
  const [contactPhone, setContactPhone] = useState(profile?.emergencyContact?.phone || '');
  const [contactRelation, setContactRelation] = useState(profile?.emergencyContact?.relation || '');
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    try {
      await updateProfile({
        phone,
        address,
        emergencyContact: { name: contactName, phone: contactPhone, relation: contactRelation },
      }).unwrap();
      toast('Profile updated');
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update profile.'));
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Phone</label>
        <input className="fi" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="ff">
        <label className="fl">Address</label>
        <textarea className="fi" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="card-label" style={{ marginTop: 4 }}>
        Emergency contact
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Name</label>
          <input className="fi" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="ff">
          <label className="fl">Relation</label>
          <input className="fi" value={contactRelation} onChange={(e) => setContactRelation(e.target.value)} />
        </div>
      </div>
      <div className="ff">
        <label className="fl">Contact phone</label>
        <input className="fi" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  );
}

export default function EditProfileModal({ open, onClose, profile }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" subtitle="Update your contact and emergency details.">
      {open ? <EditProfileForm onClose={onClose} profile={profile} /> : null}
    </Modal>
  );
}
