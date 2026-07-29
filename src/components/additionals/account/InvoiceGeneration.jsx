import React, { useRef, useState } from 'react';
import { Button, CircularProgress, TextField, Typography, Alert } from '@mui/material';
import ReactToPrint from 'react-to-print';
import { roomBookingApi } from '../../../api/apiService';
import { getToday } from '../../../constants/Functions';

const InvoiceGeneration = () => {
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef();

  const handleFetch = async () => {
    if (!bookingId.trim()) { setError('Enter a Booking ID'); return; }
    setError('');
    setBooking(null);
    setLoading(true);
    try {
      const res = await roomBookingApi.getBookingById(bookingId);
      if (res.status === 200) {
        setBooking(res.data);
      } else {
        setError('Booking not found');
      }
    } catch (e) {
      setError('Failed to fetch booking');
    }
    setLoading(false);
  };

  const b = booking;

  return (
    <div className='flex flex-col gap-4'>
      <Typography variant='subtitle1' fontWeight={700}>Invoice Generation</Typography>
      <div className='flex gap-3 items-center'>
        <TextField size='small' label='Booking ID / Guest Stay ID' value={bookingId}
          onChange={e => setBookingId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFetch()} />
        <Button variant='contained' onClick={handleFetch} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Generate Invoice'}
        </Button>
      </div>

      {error && <Alert severity='error'>{error}</Alert>}

      {b && (
        <>
          {/* Invoice */}
          <div ref={printRef} className='border-2 border-gray-800 rounded-lg p-6 max-w-2xl'>
            {/* Header */}
            <div className='text-center mb-4 border-b pb-4'>
              <Typography variant='h5' fontWeight={800}>BnB Homes</Typography>
              <Typography variant='body2'>518/4, Phoenix Ln, Thirupathapuram Jn, Kazhakootam, Trivandrum</Typography>
              <Typography variant='body2'>Ph: 7540000750 | Email: bnbhomestvm@gmail.com</Typography>
            </div>

            <div className='flex justify-between mb-4'>
              <div>
                <Typography variant='h6' fontWeight={700}>INVOICE</Typography>
                <Typography variant='body2'>Invoice No: {b.bookingRef || b.id}</Typography>
                <Typography variant='body2'>Date: {getToday()}</Typography>
              </div>
              <div className='text-right'>
                <Typography variant='body2' fontWeight={600}>Bill To:</Typography>
                <Typography variant='body2'>{b.guestDetails?.[0]?.name || '-'}</Typography>
                <Typography variant='body2'>{b.guestDetails?.[0]?.mobile_no || '-'}</Typography>
                {b.corporateName && <Typography variant='body2'>{b.corporateName}</Typography>}
              </div>
            </div>

            {/* Stay details */}
            <table className='w-full text-sm border mb-4'>
              <thead className='bg-gray-100'>
                <tr>
                  <th className='text-left p-2 border'>Description</th>
                  <th className='text-right p-2 border'>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className='border'>
                  <td className='p-2 border'>
                    Room Charges — {(b.selectedRooms || []).join(', ')}<br />
                    <span className='text-xs text-gray-500'>{b.checkInDate} to {b.checkOutDate} ({b.numberOfDays} nights)</span>
                  </td>
                  <td className='p-2 border text-right'>₹ {b.roomAmount}</td>
                </tr>
                <tr className='border'>
                  <td className='p-2 border'>GST (12%)</td>
                  <td className='p-2 border text-right'>₹ {b.gst}</td>
                </tr>
                {b.anyDiscountAmt && parseFloat(b.anyDiscountAmt) > 0 && (
                  <tr className='border'>
                    <td className='p-2 border text-green-600'>Discount</td>
                    <td className='p-2 border text-right text-green-600'>- ₹ {b.anyDiscountAmt}</td>
                  </tr>
                )}
                <tr className='bg-gray-50 font-semibold border'>
                  <td className='p-2 border'>Net Payable</td>
                  <td className='p-2 border text-right'>₹ {b.netPayable}</td>
                </tr>
                <tr className='border'>
                  <td className='p-2 border'>Advance Paid ({b.paymentMethod})</td>
                  <td className='p-2 border text-right'>- ₹ {b.advanceAmount}</td>
                </tr>
                <tr className='bg-primary text-white font-bold border'>
                  <td className='p-2 border'>Balance Due</td>
                  <td className='p-2 border text-right'>₹ {b.balanceAmnt}</td>
                </tr>
              </tbody>
            </table>

            <div className='text-center text-gray-500 text-xs mt-4'>
              Thank you for staying with BnB Homes
            </div>
          </div>

          <div className='flex gap-3'>
            <ReactToPrint
              trigger={() => <Button variant='contained'>Print Invoice</Button>}
              content={() => printRef.current}
              documentTitle={`Invoice-${b.bookingRef || b.id}`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceGeneration;
