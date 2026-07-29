import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import ReactToPrint from 'react-to-print';
import { toast } from 'react-toastify';
import { staffApi } from '../../../api/apiService';
import { useRole } from '../../../hooks/useRole';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];
const currentMonth = () => new Date().toISOString().slice(0, 7);

const Payslip = ({ salary, printRef }) => (
  <div ref={printRef} className='p-8 max-w-lg mx-auto'>
    <div className='text-center border-b pb-4 mb-4'>
      <Typography variant='h5' fontWeight={800}>BnB Homes</Typography>
      <Typography variant='body2'>518/4, Phoenix Ln, Kazhakootam, Trivandrum</Typography>
      <Typography variant='h6' className='mt-2'>PAYSLIP — {salary.month}</Typography>
    </div>
    <div className='mb-4'>
      <Typography fontWeight={600}>{salary.staff_name}</Typography>
      <Typography variant='body2' color='textSecondary'>{salary.role}</Typography>
    </div>
    <table className='w-full text-sm mb-4'>
      <tbody>
        {[
          ['Basic Salary', `₹ ${salary.basic_salary}`],
          ['Bonus', `₹ ${salary.bonus || '0'}`],
          ['Deductions', `- ₹ ${salary.deductions || '0'}`],
        ].map(([l, v]) => (
          <tr key={l} className='border-b'>
            <td className='py-1 text-gray-500'>{l}</td>
            <td className='py-1 text-right'>{v}</td>
          </tr>
        ))}
        <tr className='font-bold text-base'>
          <td className='py-2'>Net Salary</td>
          <td className='py-2 text-right text-green-700'>₹ {salary.net_salary}</td>
        </tr>
      </tbody>
    </table>
    <div className='text-sm text-gray-500'>
      <div>Paid on: {salary.paid_date || '-'}</div>
      <div>Via: {salary.paid_via || '-'}</div>
      {salary.notes && <div>Notes: {salary.notes}</div>}
    </div>
    <div className='mt-8 text-center text-xs text-gray-400'>This is a computer generated payslip</div>
  </div>
);

const StaffSalary = () => {
  const [staffList, setStaffList] = useState([]);
  const { canEditSalary } = useRole();
  const [form, setForm] = useState({ staff_id: '', month: currentMonth(), basic_salary: '', bonus: '', deductions: '', paid_date: '', paid_via: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentMonth());
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [alert, setAlert] = useState([]);
  const printRef = useRef();

  const fetchStaff = async () => {
    try {
      const res = await staffApi.getStaff('staff');
      if (res.status === 200) setStaffList(res.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getSalaries(filterMonth, null);
      if (res.status === 200) setSalaries(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchAlert = async () => {
    try {
      const res = await staffApi.getPayslipAlert();
      if (res.status === 200) setAlert(res.data.missing_payslips || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStaff(); fetchSalaries(); fetchAlert(); }, []);

  const net = () => {
    const b = parseFloat(form.basic_salary) || 0;
    const bo = parseFloat(form.bonus) || 0;
    const d = parseFloat(form.deductions) || 0;
    return (b + bo - d).toFixed(2);
  };

  const validate = () => {
    const e = {};
    if (!form.staff_id) e.staff_id = 'Select staff';
    if (!form.month) e.month = 'Month required';
    if (!form.basic_salary || isNaN(parseFloat(form.basic_salary))) e.basic_salary = 'Basic salary required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        staff_id: parseInt(form.staff_id),
        month: form.month,
        basic_salary: parseFloat(form.basic_salary),
        bonus: parseFloat(form.bonus) || 0,
        deductions: parseFloat(form.deductions) || 0,
        net_salary: parseFloat(net()),
        paid_date: form.paid_date || null,
        paid_via: form.paid_via || null,
        notes: form.notes || null,
      };
      const res = await staffApi.addSalary(payload);
      if (res.status === 200 || res.status === 201) {
        toast.success('Salary recorded');
        setForm({ staff_id: '', month: currentMonth(), basic_salary: '', bonus: '', deductions: '', paid_date: '', paid_via: '', notes: '' });
        fetchSalaries(); fetchAlert();
      } else toast.error('Failed');
    } catch (e) { toast.error('Error'); }
    setSaving(false);
  };

  return (
    <div className='flex flex-col gap-6'>
      {/* Payslip alert */}
      {alert.length > 0 && (
        <Alert severity='warning'>
          <strong>⚠ Missing Payslips ({alert.length}):</strong>{' '}
          {alert.map(a => `${a.staff_name} (${a.month})`).join(', ')}
        </Alert>
      )}

      {/* Salary entry form — admin only */}
      {canEditSalary ? (
        <div className='border rounded-lg p-4'>
          <Typography variant='subtitle1' fontWeight={700} className='mb-3'>Record Salary / Payslip</Typography>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormControl size='small' error={!!errors.staff_id} fullWidth>
              <InputLabel>Staff *</InputLabel>
              <Select label='Staff *' value={form.staff_id} onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
              {errors.staff_id && <span className='text-red-500 text-xs'>{errors.staff_id}</span>}
            </FormControl>
            <TextField size='small' label='Month *' type='month' value={form.month}
              onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
              error={!!errors.month} helperText={errors.month} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField size='small' label='Basic Salary *' type='number' value={form.basic_salary}
              onChange={e => setForm(f => ({ ...f, basic_salary: e.target.value }))}
              error={!!errors.basic_salary} helperText={errors.basic_salary} fullWidth />
            <TextField size='small' label='Bonus' type='number' value={form.bonus}
              onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} fullWidth />
            <TextField size='small' label='Deductions' type='number' value={form.deductions}
              onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))} fullWidth />
            <TextField size='small' label='Net Salary' value={'₹ ' + net()} disabled fullWidth />
            <TextField size='small' label='Paid Date' type='date' value={form.paid_date}
              onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))}
              InputLabelProps={{ shrink: true }} fullWidth />
            <FormControl size='small' fullWidth>
              <InputLabel>Paid Via</InputLabel>
              <Select label='Paid Via' value={form.paid_via} onChange={e => setForm(f => ({ ...f, paid_via: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size='small' label='Notes' value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth />
          </div>
          <div className='mt-4 flex justify-end'>
            <Button variant='contained' onClick={handleSubmit} disabled={saving}>
              {saving ? <CircularProgress size={18} /> : 'Save Salary'}
            </Button>
          </div>
        </div>
      ) : (
        <Alert severity='info'>Only Admin can record salary entries. You can view existing records below.</Alert>
      )}

      {/* Filter */}
      <div className='flex items-center gap-3'>
        <TextField size='small' label='Filter Month' type='month' value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant='outlined' onClick={fetchSalaries}>View</Button>
      </div>

      {/* Salary Table */}
      {loading ? <CircularProgress /> : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border rounded-lg'>
            <thead className='bg-gray-100'>
              <tr>{['Staff', 'Month', 'Basic', 'Bonus', 'Deductions', 'Net', 'Paid Date', 'Via', 'Payslip'].map(h => (
                <th key={h} className='text-left py-2 px-3'>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr><td colSpan={9} className='text-center text-gray-400 py-6'>No salary records</td></tr>
              ) : salaries.map(s => (
                <tr key={s.id} className='border-t'>
                  <td className='py-2 px-3 font-medium'>{s.staff_name}</td>
                  <td className='py-2 px-3'>{s.month}</td>
                  <td className='py-2 px-3'>₹ {s.basic_salary}</td>
                  <td className='py-2 px-3'>₹ {s.bonus || '0'}</td>
                  <td className='py-2 px-3'>₹ {s.deductions || '0'}</td>
                  <td className='py-2 px-3 font-bold text-green-700'>₹ {s.net_salary}</td>
                  <td className='py-2 px-3'>{s.paid_date || '-'}</td>
                  <td className='py-2 px-3'>{s.paid_via || '-'}</td>
                  <td className='py-2 px-3'>
                    <Button size='small' variant='outlined' onClick={() => setSelectedPayslip(s)}>Print</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Printable payslip */}
      {selectedPayslip && (
        <div className='mt-4'>
          <div className='border rounded-lg overflow-hidden'>
            <Payslip salary={selectedPayslip} printRef={printRef} />
          </div>
          <div className='flex gap-2 mt-2'>
            <ReactToPrint
              trigger={() => <Button variant='contained'>Print Payslip — {selectedPayslip.staff_name} ({selectedPayslip.month})</Button>}
              content={() => printRef.current}
              documentTitle={'Payslip-' + selectedPayslip.staff_name + '-' + selectedPayslip.month}
            />
            <Button variant='outlined' onClick={() => setSelectedPayslip(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffSalary;
