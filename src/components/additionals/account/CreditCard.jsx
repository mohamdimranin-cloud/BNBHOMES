import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { accountApi } from '../../../api/apiService';

const CARDS = ['IOB Credit Card'];
const today = () => new Date().toISOString().slice(0, 10);

const CreditCard = () => {
  const [form, setForm] = useState({ card_name: '', entry_date: today(), amount: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await accountApi.getCreditCards();
      if (res.status === 200) setRows(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const validate = () => {
    const e = {};
    if (!form.card_name) e.card_name = 'Select a card';
    if (!form.amount || isNaN(parseFloat(form.amount))) e.amount = 'Valid amount required';
    if (!form.entry_date) e.entry_date = 'Date required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await accountApi.addCreditCard({ ...form, amount: parseFloat(form.amount) });
      if (res.status === 200 || res.status === 201) {
        toast.success('Credit card entry recorded');
        setForm({ card_name: '', entry_date: today(), amount: '', notes: '' });
        fetch();
      } else toast.error('Failed to save');
    } catch (e) { toast.error('Error saving'); }
    setSaving(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='border rounded-lg p-4'>
        <Typography variant='subtitle1' fontWeight={700} className='mb-3'>Credit Card Credited</Typography>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormControl size='small' error={!!errors.card_name} fullWidth>
            <InputLabel>Card *</InputLabel>
            <Select label='Card *' value={form.card_name} onChange={e => setForm(f => ({ ...f, card_name: e.target.value }))}>
              {CARDS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
            {errors.card_name && <span className='text-red-500 text-xs'>{errors.card_name}</span>}
          </FormControl>
          <TextField size='small' label='Date *' type='date' value={form.entry_date}
            onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
            error={!!errors.entry_date} helperText={errors.entry_date}
            InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Amount *' type='number' value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            error={!!errors.amount} helperText={errors.amount} fullWidth />
          <TextField size='small' label='Notes' value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth />
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
            <tr>{['Card', 'Date', 'Amount', 'Notes'].map(h => <th key={h} className='text-left py-2 px-3'>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className='text-center text-gray-400 py-4'>No entries</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className='border-t'>
                <td className='py-2 px-3'>{r.card_name}</td>
                <td className='py-2 px-3'>{r.entry_date}</td>
                <td className='py-2 px-3 font-semibold'>₹ {r.amount}</td>
                <td className='py-2 px-3'>{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CreditCard;
