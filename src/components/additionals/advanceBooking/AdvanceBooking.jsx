import { Add } from '@mui/icons-material';
import { Backdrop, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import NewAdvanceBooking from './NewAdvanceBooking';
import PreviousRefData from './PreviousRefData';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addtionalApi } from '../../../api/apiService';

const AdvanceBooking = () => {

  const navigate = useNavigate();

  const regex = /^AD\d{3}\/\d{2}$/;

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [bookingState, setBookingState] = useState({ prevBooking: false, newBooking: false });
  const [booking_ref, setBooking_ref] = useState("");
  const [bookingData, setBookingData] = useState(null);

  const fetchAdvanceBookingByRef = async () => {
    try {
      setIsDataLoading(true);

      // First try the unified lookup (searches both advance_bookings and bookings)
      const lookupRes = await addtionalApi.lookupBookingRef(booking_ref);
      if (lookupRes.status === 200 && lookupRes.data.found) {
        const d = lookupRes.data;
        setBookingData({
          advanceBooking: {
            advance_booking_ref: d.booking_ref || '',
            guest_name: d.guest_name || '',
            mobile_num: d.mobile_num || '',
            whatsapp_num: d.whatsapp_num || '',
            email_id: d.email_id || '',
            num_of_guest: 0,
            guest_type: d.guest_type || '',
            checkin_date: d.checkin_date || '',
            checkout_date: d.checkout_date || '',
            num_of_nights: d.num_of_nights || 1,
            room_with_gst: d.room_with_gst || 0,
            total_amount: d.total_amount || 0,
            discount_any: d.discount_any || '',
            final_amount: d.final_amount || 0,
            advance_amount: d.advance_amount || '',
            paid_via: d.paid_via || '',
            paid_reference: d.paid_reference || '',
            balance_amount: d.balance_amount || 0,
            remarks: d.remarks || '',
          },
          rooms: d.room_type ? [{ id: 1, room_type: d.room_type, num_of_rooms: d.num_of_rooms || 1 }] : [{ id: 1, room_type: '', num_of_rooms: 0 }]
        });
        setIsDataLoading(false);
        return;
      }

      // Fallback: try advance booking by ref
      const res = await addtionalApi.getAdvanceBookingByRef(booking_ref);
      if (res.status === 200) {
        const data = res.data;
        // Backend returns the row directly (not nested)
        setBookingData({
          advanceBooking: data,
          rooms: data.room_type ? [{ id: 1, room_type: data.room_type, num_of_rooms: data.number_of_rooms || 1 }] : [{ id: 1, room_type: '', num_of_rooms: 0 }]
        });
      } else {
        toast.info("No booking found for this reference");
        setBookingState(prevData => ({ ...prevData, prevBooking: false }));
      }
      setIsDataLoading(false);
    } catch (error) {
      console.error("Advance booking by ref fetch error: " + error);
      toast.error("Could not fetch booking data");
      setIsDataLoading(false);
    }
  }

  const handlePrevRefSearch = async () => {
    if (!booking_ref.trim()) {
      toast.warn("Please enter a booking reference");
      return;
    }

    await fetchAdvanceBookingByRef();

    setBookingState(prevData => ({
      ...prevData,
      prevBooking: true,
    }));
  }

  const handleClearSearch = () => {
    setBooking_ref("");
    setBookingState(prevData => ({
      ...prevData,
      prevBooking: false,
    }));
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
        open={isDataLoading}
      >
        <div className='flex items-center justify-center gap-4'>
          <CircularProgress />
          <span className='text-blue-500 text-xl font-bold'>Loading...</span>
        </div>
      </Backdrop>

      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow relative'>
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between gap-10'>
          <Typography className='text-white w-1/4' fontSize={25} fontWeight={500}>Advance Booking</Typography>
          <div className="flex items-center gap-4">
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: "none" }}
              onClick={() => navigate("/")}
            >
              Go Back
            </Button>
          </div>
        </div>
        <div className='flex items-center justify-between mt-4 px-5'>
          <div className='flex items-center justify-normal gap-3'>
            <Typography>Previous Ref</Typography>
            <TextField
              size='small'
              placeholder='Enter previous ref. no'
              disabled={bookingState.prevBooking}
              value={booking_ref}
              onChange={(e) => setBooking_ref(e.target.value)}
            />
            <div>
              {
                bookingState.prevBooking ? (
                  <Button variant='outlined' color='info' sx={{ textTransform: "none" }} onClick={handleClearSearch}>Clear</Button>
                ) : (
                  <Button variant='outlined' color='secondary' sx={{ textTransform: "none" }} onClick={handlePrevRefSearch}>Proceed</Button>
                )
              }
            </div>
          </div>

          <Button className='flex items-center gap-1' variant='contained' color='info' sx={{ textTransform: "none" }} onClick={() => setBookingState(({ newBooking: true }))}>
            <Add />
            <Typography>New Guest</Typography>
          </Button>
        </div>
      </div >

      {
        bookingState.prevBooking && <PreviousRefData bookingData={bookingData} />
      }
      {
        bookingState.newBooking && <NewAdvanceBooking />
      }
    </>
  )
}

export default AdvanceBooking