import React, { useRef, useState } from 'react';
import { Alert, Button, CircularProgress, TextField, Typography } from '@mui/material';
import ReactToPrint from 'react-to-print';
import { accountApi } from '../../../api/apiService';
import * as XLSX from 'xlsx';

const Section = ({ title, rows, columns }) => (
  <div className='mb-6'>
    <Typography variant='subtitle2' fontWeight={700} className='mb-2 text-primary'>{title} ({rows.length})</Typography>
    {rows.length === 0 ? (
      <p className='text-gray-400 text-sm'>None</p>
    ) : (
      <table className='w-full text-sm border rounded'>
        <thead className='bg-gray-100'>
          <tr>{columns.map(c => <th key={c.key} className='text-left py-1 px-2 border'>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className='border-t'>
              {columns.map(c => <td key={c.key} className='py-1 px-2'>{r[c.key] ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const TransactionReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef();

  const handleFetch = async () => {
    if (!startDate || !endDate) { setError('Select both dates'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await accountApi.getTransactionReport(startDate, endDate);
      if (res.status === 200) setReport(res.data);
      else setError('Failed to load report');
    } catch (e) { setError('Error loading report'); }
    setLoading(false);
  };

  const handleExport = () => {
    if (!report) return;
    const wb = XLSX.utils.book_new();

    const addSheet = (name, data) => {
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      }
    };

    addSheet('Money Entries', report.money_entries || []);
    addSheet('Expenses', report.expense_entries || []);
    addSheet('Account Balances', report.account_balances || []);
    addSheet('Credit Card', report.credit_card_entries || []);
    addSheet('Guest Returns', report.guest_returns || []);

    const summary = [report.summary];
    const ws = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');

    XLSX.writeFile(wb, `Transaction_Report_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className='flex flex-col gap-4'>
      <Typography variant='subtitle1' fontWeight={700}>Full Transaction Report</Typography>

      <div className='flex flex-wrap items-center gap-3'>
        <TextField size='small' label='From Date' type='date' value={startDate}
          onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size='small' label='To Date' type='date' value={endDate}
          onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant='contained' onClick={handleFetch} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Generate Report'}
        </Button>
        {report && (
          <>
            <Button variant='outlined' color='success' onClick={handleExport}>Export to Excel</Button>
            <ReactToPrint
              trigger={() => <Button variant='outlined'>Print Report</Button>}
              content={() => printRef.current}
              documentTitle={`Transaction-Report-${startDate}-${endDate}`}
            />
          </>
        )}
      </div>

      {error && <Alert severity='error'>{error}</Alert>}

      {report && (
        <div ref={printRef}>
          {/* Summary */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
            {[
              { label: 'Total Income', value: `₹ ${report.summary?.total_income}`, color: 'text-green-600' },
              { label: 'Total Expenses', value: `₹ ${report.summary?.total_expenses}`, color: 'text-red-600' },
              { label: 'Guest Returns', value: `₹ ${report.summary?.total_returns}`, color: 'text-orange-600' },
              { label: 'Net', value: `₹ ${report.summary?.net}`, color: parseFloat(report.summary?.net) >= 0 ? 'text-green-700' : 'text-red-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className='border rounded-lg p-3 text-center'>
                <Typography variant='caption' className='text-gray-500'>{label}</Typography>
                <Typography variant='h6' fontWeight={700} className={color}>{value}</Typography>
              </div>
            ))}
          </div>

          <Section title='Money Entries (Income)' rows={report.money_entries || []}
            columns={[
              { key: 'created_at', label: 'Date' },
              { key: 'booking_ref', label: 'Booking Ref' },
              { key: 'guest_name', label: 'Guest' },
              { key: 'amount', label: 'Amount' },
              { key: 'payment_method', label: 'Method' },
              { key: 'reference_number', label: 'Reference' },
            ]}
          />

          <Section title='Expense Entries' rows={report.expense_entries || []}
            columns={[
              { key: 'entry_date', label: 'Date' },
              { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount' },
              { key: 'reference_number', label: 'Reference' },
              { key: 'notes', label: 'Notes' },
            ]}
          />

          <Section title='Account Balances' rows={report.account_balances || []}
            columns={[
              { key: 'entry_date', label: 'Date' },
              { key: 'bank_name', label: 'Bank' },
              { key: 'amount', label: 'Amount' },
              { key: 'notes', label: 'Notes' },
            ]}
          />

          <Section title='Credit Card Entries' rows={report.credit_card_entries || []}
            columns={[
              { key: 'entry_date', label: 'Date' },
              { key: 'card_name', label: 'Card' },
              { key: 'amount', label: 'Amount' },
              { key: 'notes', label: 'Notes' },
            ]}
          />

          <Section title='Guest Returns' rows={report.guest_returns || []}
            columns={[
              { key: 'return_date', label: 'Date' },
              { key: 'return_type', label: 'Type' },
              { key: 'booking_id', label: 'Booking ID' },
              { key: 'amount', label: 'Amount' },
              { key: 'reason', label: 'Reason' },
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default TransactionReport;
