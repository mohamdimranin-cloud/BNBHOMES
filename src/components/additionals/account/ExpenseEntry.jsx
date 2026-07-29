import React, { useEffect, useState } from 'react';
import {
  Button, CircularProgress, FormControl, IconButton, InputLabel,
  MenuItem, Select, TextField, Typography, Alert
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { accountApi, fileApi } from '../../../api/apiService';

const CATEGORIES = [
  'Vendor Payment', '20 Ltr Bottle', 'Bislery Water', 'Breakfast', 'GST',
  'Booking.com', 'Laundry', 'Services', 'KSEB', 'Corporation Water',
  'Petty Cash', 'Cleaner Food', 'HNG Items', 'Care 4 Items', 'Auditor',
  'Weekly Incentive', 'Staff Salary', 'Maintenance / Setup',
];

const today = () => new Date().toISOString().slice(0, 10);

const ExpenseEntry = () => {
  const [form, setForm] = useState({ category: '', amount: '', reference_number: '', notes: '', entry_date: today() });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await accountApi.getExpenses(filterStart || null, filterEnd || null);
      if (res.status === 200) setEntries(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fileApi.imageUpload(fd);
      if (res.status === 200 || res.status === 201) {
        setAttachmentUrl(res.data.file_path);
        toast.success('Attachment uploaded');
      }
    } catch (err) { toast.error('Upload failed'); }
    setUploading(false);
  };

  const validate = () => {
    const e = {};
    if (!form.category) e.category = 'Category is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) e.amount = 'Valid amount required';
    if (!form.entry_date) e.entry_date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await accountApi.addExpense({ ...form, amount: parseFloat(form.amount), attachment_url: attachmentUrl || null });
      if (res.status === 200 || res.status === 201) {
        toast.success('Expense recorded');
        setForm({ category: '', amount: '', reference_number: '', notes: '', entry_date: today() });
        setAttachmentUrl('');
        fetchEntries();
      } else { toast.error('Failed to save'); }
    } catch (e) { toast.error('Error saving expense'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await accountApi.deleteExpense(id);
      toast.success('Deleted');
      fetchEntries();
    } catch (e) { toast.error('Delete failed'); }
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Form */}
      <div className='border rounded-lg p-4'>
        <Typography variant='subtitle1' fontWeight={700} className='mb-3'>New Expense Entry</Typography>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormControl size='small' error={!!errors.category} fullWidth>
            <InputLabel>Category *</InputLabel>
            <Select label='Category *' value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
            {errors.category && <span className='text-red-500 text-xs mt-1'>{errors.category}</span>}
          </FormControl>

          <TextField size='small' label='Amount *' type='number' value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            error={!!errors.amount} helperText={errors.amount} fullWidth />

          <TextField size='small' label='Reference Number' value={form.reference_number}
            onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} fullWidth />

          <TextField size='small' label='Date *' type='date' value={form.entry_date}
            onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))}
            error={!!errors.entry_date} helperText={errors.entry_date}
            InputLabelProps={{ shrink: true }} fullWidth />

          <TextField size='small' label='Notes' value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            multiline rows={2} fullWidth />

          <div className='flex flex-col gap-1'>
            <Typography variant='caption' className='text-gray-500'>Attachment (optional)</Typography>
            <input type='file' accept='image/*,application/pdf' onChange={handleFileUpload} />
            {uploading && <CircularProgress size={16} />}
            {attachmentUrl && <span className='text-xs text-green-600'>✓ {attachmentUrl}</span>}
          </div>
        </div>

        <div className='mt-4 flex justify-end'>
          <Button variant='contained' onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save Expense'}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className='flex flex-wrap items-center gap-3'>
        <TextField size='small' label='From Date' type='date' value={filterStart}
          onChange={e => setFilterStart(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size='small' label='To Date' type='date' value={filterEnd}
          onChange={e => setFilterEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant='outlined' onClick={fetchEntries}>Filter</Button>
        <Button variant='text' onClick={() => { setFilterStart(''); setFilterEnd(''); setTimeout(fetchEntries, 0); }}>Clear</Button>
      </div>

      {/* Table */}
      {loading ? <CircularProgress /> : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border rounded-lg'>
            <thead className='bg-gray-100'>
              <tr>
                {['Date', 'Category', 'Amount', 'Reference', 'Notes', 'Attachment', ''].map(h => (
                  <th key={h} className='text-left py-2 px-3'>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={7} className='text-center text-gray-400 py-4'>No entries found</td></tr>
              ) : entries.map(e => (
                <tr key={e.id} className='border-t'>
                  <td className='py-2 px-3'>{e.entry_date}</td>
                  <td className='py-2 px-3'>{e.category}</td>
                  <td className='py-2 px-3 font-semibold'>₹ {e.amount}</td>
                  <td className='py-2 px-3'>{e.reference_number || '-'}</td>
                  <td className='py-2 px-3'>{e.notes || '-'}</td>
                  <td className='py-2 px-3'>
                    {e.attachment_url
                      ? <a href={`http://localhost:8000/files?path=${e.attachment_url}`} target='_blank' rel='noreferrer' className='text-blue-600 underline text-xs'>View</a>
                      : '-'}
                  </td>
                  <td className='py-2 px-3'>
                    <IconButton size='small' color='error' onClick={() => handleDelete(e.id)}><Delete fontSize='small' /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
            {entries.length > 0 && (
              <tfoot className='bg-gray-50'>
                <tr>
                  <td colSpan={2} className='py-2 px-3 font-semibold'>Total</td>
                  <td className='py-2 px-3 font-bold text-red-600'>₹ {entries.reduce((s, e) => s + parseFloat(e.amount || 0), 0).toFixed(2)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseEntry;
