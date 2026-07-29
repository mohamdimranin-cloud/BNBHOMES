import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { staffApi } from '../../../api/apiService';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI'];

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
};

const CleanerSalary = () => {
  const [cleaners, setCleaners] = useState([]);
  const weekRange = getWeekRange();
  const [form, setForm] = useState({ staff_id: '', week_start: weekRange.start, week_end: weekRange.end, amount: '', paid_date: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCleaners = async () => {
    try {
      const res = await staffApi.getStaff('cleaner');
      if (res.status === 200) setCleaners(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getCleanerSalaries();
      if (res.status === 200) setRows(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchCleaners(); fetchRows(); }, []);

  const validate = () => {
    const e = {};
    if (!form.staff_id) e.staff_id = 'Select cleaner';
    if (!form.week_start) e.week_start = 'Week start required';
    if (!form.week_end) e.week_end = 'Week end required';
    if (!form.amount || isNaN(parseFloat(form.amount))) e.amount = 'Amount required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await staffApi.addCleanerSalary({
        staff_id: parseInt(form.staff_id),
        week_start: form.week_start,
        week_end: form.week_end,
        amount: parseFloat(form.amount),
        paid_date: form.paid_date || null,
        notes: form.notes || null,
      });
      if (res.status === 200 || res.status === 201) {
        toast.success('Cleaner salary recorded');
        setForm({ staff_id: '', week_start: weekRange.start, week_end: weekRange.end, amount: '', paid_date: '', notes: '' });
        fetchRows();
      } else toast.error('Failed');
    } catch (e) { toast.error('Error'); }
    setSaving(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='border rounded-lg p-4'>
        <Typography variant='subtitle1' fontWeight={700} className='mb-3'>Cleaner Weekly Salary</Typography>

        {cleaners.length === 0 && (
          <div className='mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800'>
            No cleaners found. Add staff with type "cleaner" from the Staff Details tab first.
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormControl size='small' error={!!errors.staff_id} fullWidth>
            <InputLabel>Cleaner *</InputLabel>
            <Select label='Cleaner *' value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
              {cleaners.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
            {errors.staff_id && <span className='text-red-500 text-xs'>{errors.staff_id}</span>}
          </FormControl>
          <TextField size='small' label='Week Start *' type='date' value={form.week_start}
            onChange={e => setForm(f => ({ ...f, week_start: e.target.value }))}
            error={!!errors.week_start} helperText={errors.week_start}
            InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Week End *' type='date' value={form.week_end}
            onChange={e => setForm(f => ({ ...f, week_end: e.target.value }))}
            error={!!errors.week_end} helperText={errors.week_end}
            InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Amount *' type='number' value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            error={!!errors.amount} helperText={errors.amount} fullWidth />
          <TextField size='small' label='Paid Date' type='date' value={form.paid_date}
            onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))}
            InputLabelProps={{ shrink: true }} fullWidth />
          <TextField size='small' label='Notes' value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth />
        </div>
        <div className='mt-4 flex justify-end'>
          <Button variant='contained' onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Record Payment'}
          </Button>
        </div>
      </div>

      {loading ? <CircularProgress /> : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border rounded-lg'>
            <thead className='bg-gray-100'>
              <tr>{['Cleaner', 'Week', 'Amount', 'Paid Date', 'Notes'].map(h => (
                <th key={h} className='text-left py-2 px-3'>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className='text-center text-gray-400 py-6'>No records</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className='border-t'>
                  <td className='py-2 px-3 font-medium'>{r.staff_name}</td>
                  <td className='py-2 px-3'>{r.week_start} → {r.week_end}</td>
                  <td className='py-2 px-3 font-semibold text-green-700'>₹ {r.amount}</td>
                  <td className='py-2 px-3'>{r.paid_date || '-'}</td>
                  <td className='py-2 px-3'>{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CleanerSalary;
