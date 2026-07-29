import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { staffApi } from '../../../api/apiService';

const ROLES = ['Manager', 'Receptionist', 'Housekeeping', 'Security', 'Maintenance', 'Cook', 'Other'];

const empty = { name: '', role: '', mobile: '', email: '', address: '', join_date: '', salary: '', bank_account: '', id_proof: '', staff_type: 'staff' };

const StaffDetails = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getStaff('staff');
      if (res.status === 200) setStaff(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.role) e.role = 'Role required';
    if (!form.mobile.trim()) e.mobile = 'Mobile required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, salary: form.salary ? parseFloat(form.salary) : null };
      const res = editing ? await staffApi.updateStaff(editing, payload) : await staffApi.addStaff(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success(editing ? 'Staff updated' : 'Staff added');
        setOpen(false); setForm(empty); setEditing(null);
        fetch();
      } else toast.error('Failed to save');
    } catch (e) { toast.error('Error saving'); }
    setSaving(false);
  };

  const handleEdit = (s) => {
    setForm({ name: s.name, role: s.role, mobile: s.mobile, email: s.email || '', address: s.address || '', join_date: s.join_date || '', salary: s.salary || '', bank_account: s.bank_account || '', id_proof: s.id_proof || '', staff_type: 'staff' });
    setEditing(s.id); setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try { await staffApi.deleteStaff(id); toast.success('Removed'); fetch(); } catch (e) { toast.error('Error'); }
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <Typography variant='subtitle1' fontWeight={700}>Staff Details</Typography>
        <Button variant='contained' onClick={() => { setForm(empty); setEditing(null); setErrors({}); setOpen(true); }}>+ Add Staff</Button>
      </div>

      {loading ? <CircularProgress /> : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border rounded-lg'>
            <thead className='bg-gray-100'>
              <tr>{['Name', 'Role', 'Mobile', 'Email', 'Join Date', 'Salary', 'Bank Account', ''].map(h => (
                <th key={h} className='text-left py-2 px-3'>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr><td colSpan={8} className='text-center text-gray-400 py-6'>No staff added yet</td></tr>
              ) : staff.map(s => (
                <tr key={s.id} className='border-t'>
                  <td className='py-2 px-3 font-medium'>{s.name}</td>
                  <td className='py-2 px-3'>{s.role}</td>
                  <td className='py-2 px-3'>{s.mobile}</td>
                  <td className='py-2 px-3'>{s.email || '-'}</td>
                  <td className='py-2 px-3'>{s.join_date || '-'}</td>
                  <td className='py-2 px-3'>{s.salary ? `₹ ${s.salary}` : '-'}</td>
                  <td className='py-2 px-3'>{s.bank_account || '-'}</td>
                  <td className='py-2 px-3 flex gap-1'>
                    <IconButton size='small' onClick={() => handleEdit(s)}><Edit fontSize='small' /></IconButton>
                    <IconButton size='small' color='error' onClick={() => handleDelete(s.id)}><Delete fontSize='small' /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editing ? 'Edit Staff' : 'Add Staff Member'}</DialogTitle>
        <DialogContent className='flex flex-col gap-3 pt-2'>
          <TextField size='small' label='Full Name *' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={!!errors.name} helperText={errors.name} fullWidth />
          <FormControl size='small' error={!!errors.role} fullWidth>
            <InputLabel>Role *</InputLabel>
            <Select label='Role *' value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
            {errors.role && <span className='text-red-500 text-xs'>{errors.role}</span>}
          </FormControl>
          <TextField size='small' label='Mobile *' value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} error={!!errors.mobile} helperText={errors.mobile} fullWidth />
          <TextField size='small' label='Email' value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} fullWidth />
          <TextField size='small' label='Address' value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} multiline rows={2} fullWidth />
          <TextField size='small' label='Join Date' type='date' value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Monthly Salary (₹)' type='number' value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} fullWidth />
          <TextField size='small' label='Bank Account Number' value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} fullWidth />
          <TextField size='small' label='ID Proof Number' value={form.id_proof} onChange={e => setForm(f => ({ ...f, id_proof: e.target.value }))} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSubmit} disabled={saving}>{saving ? <CircularProgress size={18} /> : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StaffDetails;
