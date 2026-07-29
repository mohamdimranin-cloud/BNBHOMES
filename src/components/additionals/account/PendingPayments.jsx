import React, { useEffect, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { accountApi } from '../../../api/apiService';

const PendingPayments = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await accountApi.getPendingPayments();
        if (res.status === 200) setRows(res.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, []);

  const computeBalance = (r) => {
    const net = parseFloat(r.net_payable || 0);
    const extra = parseFloat(r.total_extra || 0);
    const paid = parseFloat(r.total_paid || 0);
    const advance = parseFloat(r.advance_amount || 0);
    return (net + extra - paid - advance).toFixed(2);
  };

  if (loading) return <CircularProgress />;

  return (
    <div>
      <Typography variant='subtitle1' fontWeight={700} className='mb-3'>
        Pending Payments ({rows.length})
      </Typography>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm border rounded-lg'>
          <thead className='bg-gray-100'>
            <tr>
              {['Booking Ref', 'Guest Name', 'Mobile', 'Check-in', 'Check-out', 'Net Payable', 'Extra Charges', 'Total Paid', 'Outstanding Balance'].map(h => (
                <th key={h} className='text-left py-2 px-3'>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={9} className='text-center text-gray-400 py-6'>No pending payments</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className='border-t'>
                <td className='py-2 px-3 font-medium'>{r.booking_ref}</td>
                <td className='py-2 px-3'>{r.guest_name}</td>
                <td className='py-2 px-3'>{r.mobile_no}</td>
                <td className='py-2 px-3'>{r.check_in_date}</td>
                <td className='py-2 px-3'>{r.check_out_date}</td>
                <td className='py-2 px-3'>₹ {r.net_payable}</td>
                <td className='py-2 px-3'>₹ {r.total_extra}</td>
                <td className='py-2 px-3'>₹ {r.total_paid}</td>
                <td className='py-2 px-3 font-bold text-red-600'>₹ {computeBalance(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingPayments;
