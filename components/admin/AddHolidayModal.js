'use client';

import { useState } from 'react';
import { useCreateHolidayMutation } from '@/lib/services/holidaysApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import Modal from '../ui/Modal';

function AddHolidayForm({ onClose }) {

  const [createHoliday, { isLoading }] = useCreateHolidayMutation();

  const toast = useToast();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('national');
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!date || !name.trim()) {
      setError('Date and name required.');
      return;
    }
    try {
      await createHoliday({ name: name.trim(), date, type, isActive: true }).unwrap();
      toast(`${name} added`);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add holiday.'));
    }
  }

  return (
    <>
      <div className="ff">
        <label className="fl">Date</label>
        <input className="fi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="ff">
        <label className="fl">Name</label>
        <input className="fi" placeholder="e.g. Diwali" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="ff">
        <label className="fl">Type</label>
        <select className="fi" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="national">National</option>
          <option value="regional">Regional</option>
          <option value="optional">Optional</option>
        </select>
      </div>
      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? 'Adding…' : 'Add'}
        </button>
      </div>
    </>
  );
}

export default function AddHolidayModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Add Holiday">
      {open ? <AddHolidayForm onClose={onClose} /> : null}
    </Modal>
  );
}
