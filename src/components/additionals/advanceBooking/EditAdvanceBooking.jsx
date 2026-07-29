import {
  Backdrop, Button, Card, CircularProgress, FormControl,
  InputLabel, MenuItem, Select, TextField, Typography
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addtionalApi } from '../../../api/apiService';

const PAID_VIA_OPTIONS = ['UPI', 'Cash', 'Card', 'Account Transfer'];
const GUEST_TYPES = ['DG', 'DGB', 'Corporate'];

const EditAdvanceBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const res = await addtionalApi.getAdvanceBookingById(id);
        if (res.status === 200) {
          const d = res.data;
          setForm({
            guest_name:         d.guest_name        ?? '',
            mobile_num:         d.guest_mobile       ?? '',
            whatsapp_num:       d.guest_whatsapp     ?? '',
            email_id:           d.guest_email        ?? '',
            num_of_guest:       d.num_of_guest       ?? 0,
            guest_type:         d.guest_type         ?? '',
            corporate_name:     d.corporate_name     ?? '',
            prev_booking_ref:   d.previous_ref       ?? '',
            checkin_date:       dayjs(d.check_in_date),
            checkout_date:      dayjs(d.check_out_date),
            num_of_nights:      d.number_of_nights   ?? 1,
            room_type:          d.room_type          ?? '',
            num_of_rooms:       d.number_of_rooms    ?? 1,
            room_with_gst:      d.rate_per_room      ?? 0,
            total_amount:       d.total_amount       ?? 0,
            discount_any:       d.discount_amt       ?? 0,
            final_amount:       d.final_amount       ?? 0,
            advance_amount:     d.advance_amount     ?? 0,
            paid_via:           d.paid_via           ?? '',
            paid_reference:     d.paid_reference     ?? '',
            balance_amount:     d.balance_amount     ?? 0,
            remarks:            d.remarks            ?? '',
            advance_booking_ref: d.booking_ref       ?? '',
          });
        } else {
          toast.error('Failed to load booking.');
          navigate('/advanceCalendar');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load booking.');
        navigate('/advanceCalendar');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name || !form.mobile_num) {
      toast.warn('Guest name and mobile are required.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await addtionalApi.updateAdvanceBooking(id, { advanceBooking: form, rooms: [] });
      if (res.status === 200) {
        toast.success('Advance booking updated successfully.');
        navigate('/advanceCalendar');
      } else {
        toast.error('Update failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Update failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!form) return (
    <Backdrop open={true} sx={{ zIndex: 9999 }}>
      <CircularProgress /><span className='text-white ml-4 text-lg'>Loading...</span>
    </Backdrop>
  );

  return (
    <>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <div className='flex items-center gap-4'>
          <CircularProgress />
          <span className='text-blue-500 text-xl font-bold'>Saving...</span>
        </div>
      </Backdrop>

      {/* Header */}
      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow'>
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between'>
          <Typography className='text-white' fontSize={25} fontWeight={500}>Edit Advance Booking</Typography>
          <Button variant='contained' color='primary' sx={{ textTransform: 'none' }} onClick={() => navigate('/advanceCalendar')}>
            Go Back
          </Button>
        </div>
      </div>

      <Card>
        <form className='py-5 px-28 flex flex-col gap-5' onSubmit={handleSubmit}>

          {/* Guest Info */}
          <Row label='Guest Name *'>
            <TextField size='small' fullWidth value={form.guest_name} onChange={e => set('guest_name', e.target.value)} required />
          </Row>
          <Row label='Mobile Number *'>
            <TextField size='small' fullWidth type='tel' value={form.mobile_num} onChange={e => set('mobile_num', e.target.value)} required />
          </Row>
          <Row label='WhatsApp Number'>
            <TextField size='small' fullWidth type='tel' value={form.whatsapp_num} onChange={e => set('whatsapp_num', e.target.value)} />
          </Row>
          <Row label='Email ID'>
            <TextField size='small' fullWidth type='email' value={form.email_id} onChange={e => set('email_id', e.target.value)} />
          </Row>
          <Row label='Guest Type'>
            <FormControl size='small' fullWidth>
              <InputLabel>Guest Type</InputLabel>
              <Select label='Guest Type' value={form.guest_type} onChange={e => set('guest_type', e.target.value)}>
                {GUEST_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Row>
          {form.guest_type === 'Corporate' && (
            <Row label='Corporate Name'>
              <TextField size='small' fullWidth value={form.corporate_name} onChange={e => set('corporate_name', e.target.value)} />
            </Row>
          )}
          {form.guest_type === 'DG' && (
            <Row label='Previous Booking Ref'>
              <TextField size='small' fullWidth value={form.prev_booking_ref} onChange={e => set('prev_booking_ref', e.target.value)} />
            </Row>
          )}

          <hr className='my-3' />

          {/* Dates */}
          <div className='flex gap-10'>
            <Row label='Check-in Date'>
              <DatePicker label='Check-in' value={form.checkin_date} onChange={v => set('checkin_date', v)} slotProps={{ textField: { size: 'small' } }} />
            </Row>
            <Row label='Check-out Date'>
              <DatePicker label='Check-out' value={form.checkout_date} onChange={v => set('checkout_date', v)} slotProps={{ textField: { size: 'small' } }} />
            </Row>
          </div>
          <Row label='Number of Nights'>
            <TextField size='small' type='number' value={form.num_of_nights} disabled />
          </Row>

          <hr className='my-3' />

          {/* Room */}
          <Row label='Room Type'>
            <FormControl size='small' fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select label='Room Type' value={form.room_type} onChange={e => set('room_type', e.target.value)}>
                {['SK', 'ST', 'FM', 'SU', 'SL'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Row>
          <Row label='Number of Rooms'>
            <FormControl size='small' fullWidth>
              <InputLabel>Rooms</InputLabel>
              <Select label='Rooms' value={form.num_of_rooms} onChange={e => set('num_of_rooms', e.target.value)}>
                {[...Array(8)].map((_, i) => <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>)}
              </Select>
            </FormControl>
          </Row>

          <hr className='my-3' />

          {/* Amounts */}
          <Row label='Rate/Room with GST'>
            <TextField size='small' type='number' value={form.room_with_gst} disabled />
          </Row>
          <Row label='Total Amount'>
            <TextField size='small' type='number' value={form.total_amount} disabled />
          </Row>
          <Row label='Discount'>
            <TextField size='small' type='number' value={form.discount_any} onChange={e => set('discount_any', e.target.value)} />
          </Row>
          <Row label='Final Amount'>
            <TextField size='small' type='number' value={form.final_amount} disabled />
          </Row>
          <Row label='Advance Amount'>
            <TextField size='small' type='number' value={form.advance_amount} onChange={e => set('advance_amount', e.target.value)} />
          </Row>

          <hr className='my-3' />

          {/* Payment */}
          <Row label='Paid Via'>
            <FormControl size='small' fullWidth>
              <InputLabel>Paid Via</InputLabel>
              <Select label='Paid Via' value={form.paid_via} onChange={e => set('paid_via', e.target.value)}>
                {PAID_VIA_OPTIONS.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </Select>
            </FormControl>
          </Row>
          <Row label='Paid Reference'>
            <TextField size='small' fullWidth value={form.paid_reference} onChange={e => set('paid_reference', e.target.value)} />
          </Row>
          <Row label='Balance Amount'>
            <TextField size='small' type='number' value={form.balance_amount} disabled />
          </Row>
          <Row label='Remarks'>
            <TextField size='small' fullWidth value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </Row>
          <Row label='Booking Reference'>
            <TextField size='small' fullWidth value={form.advance_booking_ref} disabled />
          </Row>

          <hr className='my-5' />

          <div className='flex items-center justify-center gap-4'>
            <Button variant='outlined' color='error' sx={{ textTransform: 'none' }} onClick={() => navigate('/advanceCalendar')}>
              Cancel
            </Button>
            <Button variant='contained' color='primary' type='submit' sx={{ textTransform: 'none' }}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};

// Helper layout row
const Row = ({ label, children }) => (
  <div className='grid grid-cols-12 items-center'>
    <Typography className='col-span-3'>{label}</Typography>
    <div className='col-span-4'>{children}</div>
  </div>
);

export default EditAdvanceBooking;
