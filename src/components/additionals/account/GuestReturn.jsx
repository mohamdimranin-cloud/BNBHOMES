import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { accountApi } from '../../../api/apiService';

const RETURN_TYPES = [
  { value: 'advance_cancel', label: 'Advance Booking Cancel' },
  { value: 'early_checkout', label: 'Early Check Out' },
  { value: 'other', label: 'Other' },
];
const today = () => new Date().toISOString().slice(0, 10);

const GuestReturn = () => {
  const [form, setForm] = useState({ return_type: '', booking_id: '', return_date: today(), amount: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await accountApi.getGuestReturns();
      if (res.status === 200) setRows(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const validate = () => {
    const e = {};
    if (!form.return_type) e.return_type = 'Select type';
    if (!form.amount || isNaN(parseFloat(form.amount))) e.amount = 'Valid amount required';
    if (!form.return_date) e.return_date = 'Date required';
    if (form.return_type === 'other' && !form.reason?.trim()) e.reason = 'Reason required for Other';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        booking_id: form.booking_id ? parseInt(form.booking_id) : null,
      };
      const res = await accountApi.addGuestReturn(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success('Return entry recorded');
        setForm({ return_type: '', booking_id: '', return_date: today(), amount: '', reason: '' });
        fetch();
      } else toast.error('Failed to save');
    } catch (e) { toast.error('Error saving'); }
    setSaving(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='border rounded-lg p-4'>
        <Typography variant='subtitle1' fontWeight={700} className='mb-3'>Guest Return Amount Entry</Typography>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormControl size='small' error={!!errors.return_type} fullWidth>
            <InputLabel>Return Type *</InputLabel>
            <Select label='Return Type *' value={form.return_type} onChange={e => setForm(f => ({ ...f, return_type: e.target.value }))}>
              {RETURN_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
            {errors.return_type && <span className='text-red-500 text-xs'>{errors.return_type}</span>}
          </FormControl>
          <TextField size='small' label='Booking ID (optional)' value={form.booking_id}
            onChange={e => setForm(f => ({ ...f, booking_id: e.target.value }))} fullWidth />
          <TextField size='small' label='Date *' type='date' value={form.return_date}
            onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))}
            error={!!errors.return_date} helperText={errors.return_date}
            InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Amount *' type='number' value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            error={!!errors.amount} helperText={errors.amount} fullWidth />
          {form.return_type === 'other' && (
            <TextField size='small' label='Reason *' value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              error={!!errors.reason} helperText={errors.reason}
              multiline rows={2} fullWidth className='md:col-span-2' />
          )}
        </div>
        <div className='mt-4 flex justify-end'>
          <Button variant='contained' onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </div>
      </div>

      {loading ? <CircularProgress /> : (
        <table className='w-full text-sm border rounded-lg'>
          <thead className='bg-gray-100'>
            <tr>{['Type', 'Booking ID', 'Date', 'Amount', 'Reason'].map(h => <th key={h} className='text-left py-2 px-3'>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className='text-center text-gray-400 py-4'>No entries</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className='border-t'>
                <td className='py-2 px-3'>{RETURN_TYPES.find(t => t.value === r.return_type)?.label || r.return_type}</td>
                <td className='py-2 px-3'>{r.booking_id || '-'}</td>
                <td className='py-2 px-3'>{r.return_date}</td>
                <td className='py-2 px-3 font-semibold text-orange-600'>₹ {r.amount}</td>
                <td className='py-2 px-3'>{r.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GuestReturn;
