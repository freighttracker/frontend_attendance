'use client';

import { useRef, useState } from 'react';
import { useCreateEmployeeMutation, useUpdateEmployeeMutation } from '@/lib/services/usersApi';
import { useToast, extractErrorMessage } from '@/lib/hooks';
import { normalizeUser } from '@/lib/utils/normalize';
import Modal from '../ui/Modal';
import DynamicSalaryFields from './DynamicSalaryFields';

const emptyForm = {
  firstName: '',
  lastName: '',
  employeeCode: '',
  email: '',
  password: '',
  phone: '',
  department: '',
  designation: '',
  joiningDate: '',
  baseSalary: '',
  role: 'employee',
};

function formFromEmployee(employee) {
  if (!employee) return emptyForm;
  return {
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    employeeCode: employee.employeeCode || '',
    email: employee.email || '',
    password: '',
    phone: employee.phone || '',
    department: employee.department || '',
    designation: employee.designation || '',
    joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : '',
    baseSalary: employee.baseSalary ?? '',
    role: employee.role || 'employee',
  };
}

function EmployeeForm({ onClose, employee, onCreated }) {
  const isEdit = Boolean(employee);
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const toast = useToast();
  const [form, setForm] = useState(() => formFromEmployee(employee));
  const [error, setError] = useState('');
  const salaryFieldsRef = useRef(null);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const salaryTouched = form.baseSalary !== '';
  const salaryValid = salaryTouched && Number.isFinite(Number(form.baseSalary)) && Number(form.baseSalary) > 0;
  const salaryError = salaryTouched && !salaryValid ? 'Total salary must be a positive number.' : '';

  async function handleSubmit() {
    setError('');
    if (!form.firstName || !form.lastName || !form.email) {
      setError('First name, last name and email are required.');
      return;
    }
    if (!isEdit && (!form.employeeCode || !form.password)) {
      setError('Employee code and password are required for new employees.');
      return;
    }
    if (salaryTouched && !salaryValid) {
      setError('Total salary must be a positive number.');
      return;
    }
    if (salaryFieldsRef.current?.isLoading) {
      setError('Salary fields are still loading, please wait.');
      return;
    }
    if (salaryFieldsRef.current && !salaryFieldsRef.current.validate()) {
      setError('Please fill in all required salary fields.');
      return;
    }
    try {
      const salaryPayload = salaryFieldsRef.current?.getPayload() ?? {
        totalSalary: form.baseSalary === '' ? 0 : Number(form.baseSalary),
        salaryComponents: [],
        customFields: [],
      };
      const payload = {
        ...form,
        baseSalary: form.baseSalary === '' ? undefined : Number(form.baseSalary),
        totalSalary: salaryPayload.totalSalary,
        salaryComponents: salaryPayload.salaryComponents,
        customFields: salaryPayload.customFields,
      };
      if (isEdit) {
        delete payload.password;
        delete payload.employeeCode;
        await updateEmployee({ id: employee.id, ...payload }).unwrap();
        toast('Employee updated');
        onClose();
      } else {
        const result = await createEmployee(payload).unwrap();
        toast('Employee added');
        onClose();
        onCreated?.(normalizeUser(result?.data || result));
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save employee.'));
    }
  }

  return (
    <div>
      <div className="frow">
        <div className="ff">
          <label className="fl">First name</label>
          <input className="fi" value={form.firstName} onChange={set('firstName')} />
        </div>
        <div className="ff">
          <label className="fl">Last name</label>
          <input className="fi" value={form.lastName} onChange={set('lastName')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Employee code</label>
          <input className="fi" value={form.employeeCode} onChange={set('employeeCode')} disabled={isEdit} />
        </div>
        <div className="ff">
          <label className="fl">Email</label>
          <input className="fi" type="email" value={form.email} onChange={set('email')} />
        </div>
      </div>
      {!isEdit ? (
        <div className="ff">
          <label className="fl">Password</label>
          <input className="fi" type="text" value={form.password} onChange={set('password')} placeholder="min 6 characters" />
        </div>
      ) : null}
      <div className="frow">
        <div className="ff">
          <label className="fl">Department</label>
          <input className="fi" value={form.department} onChange={set('department')} />
        </div>
        <div className="ff">
          <label className="fl">Designation</label>
          <input className="fi" value={form.designation} onChange={set('designation')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Phone</label>
          <input className="fi" type="tel" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="ff">
          <label className="fl">Join date</label>
          <input className="fi" type="date" value={form.joiningDate} onChange={set('joiningDate')} />
        </div>
      </div>
      <div className="frow">
        <div className="ff">
          <label className="fl">Role</label>
          <select className="fi" value={form.role} onChange={set('role')}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="ff">
          <label className="fl">Total Salary (₹ / month)</label>
          <input
            className="fi"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 30000"
            value={form.baseSalary}
            onChange={set('baseSalary')}
          />
          <div className="ferr">{salaryError}</div>
        </div>
      </div>

      <DynamicSalaryFields ref={salaryFieldsRef} initialSalary={employee?.salary} baseAmount={Number(form.baseSalary) || 0} />

      <div className="ferr">{error}</div>
      <div className="macts">
        <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-p" style={{ flex: 1 }} disabled={creating || updating} onClick={handleSubmit}>
          {creating || updating ? 'Saving…' : isEdit ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  );
}

export default function EmployeeModal({ open, onClose, employee, onCreated }) {
  return (
    <Modal open={open} onClose={onClose} title={employee ? 'Edit Employee' : 'Add Employee'} wide>
      {open ? <EmployeeForm key={employee?.id || 'new'} onClose={onClose} employee={employee} onCreated={onCreated} /> : null}
    </Modal>
  );
}
