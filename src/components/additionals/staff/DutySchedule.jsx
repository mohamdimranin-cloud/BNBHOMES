import React, { useEffect, useState } from 'react';
import { Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { staffApi } from '../../../api/apiService';

const SHIFTS = ['Morning', 'Evening', 'Night', 'Off'];
const currentMonth = () => new Date().toISOString().slice(0, 7);

const DutySchedule = () => {
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ staff_id: '', schedule_date: '', shift: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentMonth());

  const fetchStaff = async () => {
    try {
      const res = await staffApi.getStaff('staff');
      if (res.status === 200) setStaffList(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getDuties(filterMonth, null);
      if (res.status === 200) setDuties(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); fetchDuties(); }, []);

  const validate = () => {
    const e = {};
    if (!form.staff_id) e.staff_id = 'Select staff';
    if (!form.schedule_date) e.schedule_date = 'Date required';
    if (!form.shift) e.shift = 'Shift required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await staffApi.addDuty({ ...form, staff_id: parseInt(form.staff_id) });
      if (res.status === 200 || res.status === 201) {
        toast.success('Duty scheduled');
        setForm({ staff_id: '', schedule_date: '', shift: '', notes: '' });
        fetchDuties();
      } else toast.error('Failed');
    } catch (e) { toast.error('Error'); }
    setSaving(false);
  };

  // Group duties by date for schedule view
  const grouped = duties.reduce((acc, d) => {
    const dt = d.schedule_date;
    if (!acc[dt]) acc[dt] = [];
    acc[dt].push(d);
    return acc;
  }, {});

  return (
    <div className='flex flex-col gap-6'>
      {/* Form */}
      <div className='border rounded-lg p-4'>
        <Typography variant='subtitle1' fontWeight={700} className='mb-3'>Add Duty Schedule</Typography>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormControl size='small' error={!!errors.staff_id} fullWidth>
            <InputLabel>Staff *</InputLabel>
            <Select label='Staff *' value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
              {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.role})</MenuItem>)}
            </Select>
            {errors.staff_id && <span className='text-red-500 text-xs'>{errors.staff_id}</span>}
          </FormControl>
          <TextField size='small' label='Date *' type='date' value={form.schedule_date}
            onChange={e => setForm(f => ({ ...f, schedule_date: e.target.value }))}
            error={!!errors.schedule_date} helperText={errors.schedule_date}
            InputLabelProps={{ shrink: true }} fullWidth />
          <FormControl size='small' error={!!errors.shift} fullWidth>
            <InputLabel>Shift *</InputLabel>
            <Select label='Shift *' value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}>
              {SHIFTS.map(s => <MenuItem key={s} value={s.toLowerCase()}>{s}</MenuItem>)}
            </Select>
            {errors.shift && <span className='text-red-500 text-xs'>{errors.shift}</span>}
          </FormControl>
          <TextField size='small' label='Notes' value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth />
        </div>
        <div className='mt-4 flex justify-end'>
          <Button variant='contained' onClick={handleSubmit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Add Schedule'}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className='flex items-center gap-3'>
        <TextField size='small' label='Month' type='month' value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant='outlined' onClick={fetchDuties}>View</Button>
      </div>

      {/* Schedule Table */}
      {loading ? <CircularProgress /> : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border rounded-lg'>
            <thead className='bg-gray-100'>
              <tr>{['Date', 'Staff', 'Role', 'Shift', 'Notes'].map(h => (
                <th key={h} className='text-left py-2 px-3'>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {duties.length === 0 ? (
                <tr><td colSpan={5} className='text-center text-gray-400 py-6'>No schedules for this month</td></tr>
              ) : duties.map(d => (
                <tr key={d.id} className='border-t'>
                  <td className='py-2 px-3'>{d.schedule_date}</td>
                  <td className='py-2 px-3 font-medium'>{d.staff_name}</td>
                  <td className='py-2 px-3'>{d.role}</td>
                  <td className='py-2 px-3'>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      d.shift === 'morning' ? 'bg-yellow-100 text-yellow-800' :
                      d.shift === 'evening' ? 'bg-orange-100 text-orange-800' :
                      d.shift === 'night' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>{d.shift}</span>
                  </td>
                  <td className='py-2 px-3'>{d.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DutySchedule;
