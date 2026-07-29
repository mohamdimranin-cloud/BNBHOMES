import { Add, Delete } from '@mui/icons-material'
import { Backdrop, Button, Card, CircularProgress, Dialog, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import React, { Fragment, useEffect, useState } from 'react'
import { addtionalApi } from '../../../api/apiService'
import { incrementBookingReference, validateForm } from './constants'
import AdvanceBookingReceipt from './AdvanceBookingReceipt'
import { toast } from 'react-toastify'
import { calculateFinalAdvanceBookingPrice } from './AdvanceBookingPriceCalculator'

const NewAdvanceBooking = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [advanceBooking, setAdvanceBooking] = useState({
    advance_booking_ref: "",
    guest_name: "",
    mobile_num: "",
    whatsapp_num: "",
    email_id: "",
    num_of_guest: 0,
    guest_type: "",
    checkin_date: dayjs(today),
    checkout_date: dayjs(tomorrow),
    num_of_nights: 0,
    room_with_gst: 0,
    total_amount: 0,
    discount_any: "",
    final_amount: 0,
    advance_amount: "",
    paid_via: "",
    paid_reference: "",
    balance_amount: 0,
    remarks: "",
    prev_booking_ref: "",
  });

  const clearAdvanceBookingData = () => {
    setAdvanceBooking({
      advance_booking_ref: "",
      guest_name: "",
      mobile_num: "",
      whatsapp_num: "",
      email_id: "",
      num_of_guest: 0,
      guest_type: "",
      checkin_date: dayjs(today),
      checkout_date: dayjs(tomorrow),
      num_of_nights: 0,
      room_with_gst: 0,
      total_amount: 0,
      discount_any: "",
      final_amount: 0,
      advance_amount: "",
      paid_via: "",
      paid_reference: "",
      balance_amount: 0,
      remarks: "",
      prev_booking_ref: "",
    });

    setRooms([{ id: 1, room_type: "", num_of_rooms: 0 }]);
  }

  const [rooms, setRooms] = useState([
    { id: 1, room_type: "", num_of_rooms: 0 },
  ]);

  const handleRoomChange = (index, field, value) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) => (i === index ? { ...room, [field]: value } : room))
    );
  };

  const handleAddRoom = () => {
    setRooms([...rooms, { id: rooms.length + 1, room_type: "", num_of_rooms: 0 }]);
  };

  const handleDeleteRoom = (index) => {
    setRooms((prevRooms) => prevRooms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setReceiptOpen(false);

    const validated = validateForm(advanceBooking);
    if (validated !== null) {
      toast.warn(validated);
      return;
    }

    const updatedData = {
      advanceBooking,
      rooms
    };

    try {
      setIsDataLoading(true);

      const res = await addtionalApi.advanceBookingCreate(updatedData);
      if (res.status === 200) {
        toast.success("Advance Booking done")
        clearAdvanceBookingData();
      } else {
        toast.error("Advance Booking Error");
      }
      setIsDataLoading(false);
    } catch (error) {
      console.error("Advance Booking API error: " + error);
      toast.error("Advance Booking Error");
      setIsDataLoading(false);
    }
  }

  useEffect(() => {
    const calculateNumOfDays = () => {
      const differenceInMilliseconds = dayjs(advanceBooking.checkout_date) - dayjs(advanceBooking.checkin_date);
      const millisecondsInADay = 24 * 60 * 60 * 1000;
      const differenceInDays = differenceInMilliseconds / millisecondsInADay;

      setAdvanceBooking(prevData => ({
        ...prevData,
        num_of_nights: differenceInDays > 0 ? differenceInDays : 1
      }));
    }

    calculateNumOfDays();
  }, [advanceBooking.checkin_date, advanceBooking.checkout_date]);

  useEffect(() => {
    calculateFinalAdvanceBookingPrice({ advanceBooking, setAdvanceBooking, rooms })
  }, [
    advanceBooking.checkin_date, advanceBooking.checkout_date, advanceBooking.guest_type, rooms,
    advanceBooking.discount_any, advanceBooking.advance_amount
  ]);

  useEffect(() => {
    const getAdvanceBookingRef = async () => {
      try {
        const res = await addtionalApi.getAdvanceBookingReference();
        if (res.status === 200) {
          const abr = await res.data;
          // Backend returns { nextRef: "AD001/25" } — use directly
          const ref = abr.nextRef ?? (abr[0] ? incrementBookingReference(abr[0].advance_booking_ref) : '');

          setAdvanceBooking(prevData => ({
            ...prevData,
            advance_booking_ref: ref
          }));
        }
      } catch (error) {
        console.error("Advance Booking Reference fetch error: " + error);
      }
    }

    getAdvanceBookingRef();
  }, []);

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
      <Card>
        <form className='py-5 px-28 flex flex-col gap-5'>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Guest Name *</Typography>
            <TextField
              required
              className='col-span-3'
              label="Guest Name"
              size='small'
              value={advanceBooking.guest_name}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                guest_name: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Guest Mobile Number *</Typography>
            <TextField
              required
              className='col-span-3'
              label="Guest Mobile Number"
              size='small'
              type='number'
              value={advanceBooking.mobile_num}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                mobile_num: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Guest Whatsapp Number *</Typography>
            <TextField
              required
              className='col-span-3'
              label="Guest Whatsapp Number"
              size='small'
              type='number'
              value={advanceBooking.whatsapp_num}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                whatsapp_num: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Guest Email Id</Typography>
            <TextField
              className='col-span-3'
              label="Guest Email Id"
              size='small'
              type='email'
              value={advanceBooking.email_id}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                email_id: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Total Numbber of Guest</Typography>
            <TextField
              className='col-span-3'
              label="Total Numbber of Guest"
              size='small'
              type='number'
              value={advanceBooking.num_of_guest}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                num_of_guest: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Guest Type</Typography>
            <FormControl size='small' className='col-span-3'>
              <InputLabel id="labelId">Guest Type</InputLabel>
              <Select
                labelId='labelId'
                label="Guest Type"
                value={advanceBooking.guest_type}
                onChange={(e) => setAdvanceBooking(prevFormData => ({
                  ...prevFormData,
                  guest_type: e.target.value
                }))}
              >
                <MenuItem value='DG'>DG</MenuItem>
                <MenuItem value="DGB">DGB</MenuItem>
                <MenuItem value="Corporate">Corporate</MenuItem>
              </Select>
            </FormControl>
          </div>
          {
            advanceBooking.guest_type === "DG" && (
              <div className='grid grid-cols-12 items-center'>
                <Typography className='col-span-3'>Previous Booking Reference</Typography>
                <TextField
                  className='col-span-3'
                  label="Previous Booking Reference"
                  size='small'
                  value={advanceBooking.prev_booking_ref}
                  onChange={(e) => setAdvanceBooking(prevData => ({
                    ...prevData,
                    prev_booking_ref: e.target.value
                  }))}
                />
              </div>
            )
          }

          <hr className='my-5' />

          <div className='w-full flex items-center justify-between gap-5'>
            <div className='w-full flex items-center gap-44'>
              <Typography className=''>Check-In Date</Typography>
              <FormControl className='' size='small'>
                <DatePicker
                  label="Check-in Date"
                  name='chechInDate'
                  minDate={dayjs()}
                  value={dayjs(advanceBooking.checkin_date)}
                  onChange={(e) => setAdvanceBooking(prevData => ({
                    ...prevData,
                    checkin_date: dayjs(e)
                  }))}
                />
              </FormControl>
            </div>
            <div className='w-full flex items-center justify-between pl-20'>
              <Typography className=''>Check-Out Date</Typography>
              <FormControl className='' size='small'>
                <DatePicker
                  label="Check-out Date"
                  name='chechOutDate'
                  minDate={dayjs()}
                  value={dayjs(advanceBooking.checkout_date)}
                  onChange={(e) => setAdvanceBooking(prevData => ({
                    ...prevData,
                    checkout_date: dayjs(e)
                  }))}
                />
              </FormControl>
            </div>
          </div>

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Number of Days</Typography>
            <TextField
              className='col-span-3'
              label="Number of Days"
              size='small'
              type='number'
              value={advanceBooking.num_of_nights}
            />
          </div>

          <hr className='my-5' />

          <div className="flex flex-col gap-4">
            {rooms.map((room, index) => (
              <Paper
                key={index}
                className="w-full py-4 px-4 flex flex-col lg:flex-row items-center justify-start gap-4 lg:gap-10"
              >
                {/* Guest Room Type Selection */}
                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-5 w-full">
                  <Typography className="w-full lg:w-auto">Type of Guest Room</Typography>
                  <FormControl size="small" className="w-full lg:w-60">
                    <InputLabel id={`type-label-${index}`}>Type of Guest Room</InputLabel>
                    <Select
                      labelId={`type-label-${index}`}
                      label="Type of Guest Room"
                      value={room.room_type}
                      onChange={(e) => handleRoomChange(index, "room_type", e.target.value)}
                    >
                      <MenuItem value="SK">SK</MenuItem>
                      <MenuItem value="ST">ST</MenuItem>
                      <MenuItem value="FM">FM</MenuItem>
                      <MenuItem value="SU">SU</MenuItem>
                      <MenuItem value="SL">SL</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                {/* Number of Rooms Selection */}
                <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-5 w-full">
                  <Typography className="w-full lg:w-auto">Number of Rooms</Typography>
                  <FormControl size="small" className="w-full lg:w-40">
                    <InputLabel id={`rooms-label-${index}`}>No. of Rooms</InputLabel>
                    <Select
                      labelId={`rooms-label-${index}`}
                      label="No. of Rooms"
                      value={room.num_of_rooms}
                      onChange={(e) => handleRoomChange(index, "num_of_rooms", e.target.value)}
                    >
                      {[...Array(8)].map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                {
                  rooms.length > 1 && (
                    <IconButton aria-label="delete" color='error' onClick={() => handleDeleteRoom(index)}>
                      <Delete />
                    </IconButton>
                  )
                }
              </Paper>
            ))}

            {/* Add More Rooms Button */}
            <div className="w-full items-center justify-end flex">
              <Button
                className="flex items-center gap-1 w-fit"
                variant="contained"
                color="info"
                sx={{ textTransform: "none" }}
                onClick={handleAddRoom}
              >
                <Add />
                <Typography>More Room</Typography>
              </Button>
            </div>
          </div>

          <hr className='my-5' />

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Rate/Room with GST</Typography>
            <TextField
              className='col-span-3'
              label="Rate/Room with GST"
              size='small'
              type='email'
              value={advanceBooking.room_with_gst}
              disabled={true}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Total Amount</Typography>
            <TextField
              className='col-span-3'
              label="Total Amount"
              size='small'
              type='number'
              value={advanceBooking.total_amount}
              disabled={true}
            />
          </div>

          <hr className='my-5' />

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Discount If any</Typography>
            <TextField
              className='col-span-3'
              label="Discount If any"
              size='small'
              type='number'
              value={advanceBooking.discount_any}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                discount_any: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Final Amount</Typography>
            <TextField
              className='col-span-3'
              label="Final Amount"
              size='small'
              type='number'
              value={advanceBooking.final_amount}
              disabled={true}
            />
          </div>

          <hr className='my-5' />

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Advance Amount</Typography>
            <TextField
              className='col-span-3'
              label="Advance Amount"
              size='small'
              type='number'
              value={advanceBooking.advance_amount}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                advance_amount: e.target.value
              }))}
            />
          </div>

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Paid Via</Typography>
            <FormControl size='small' className='col-span-3'>
              <InputLabel id="labelId">Paid Via</InputLabel>
              <Select
                labelId='labelId'
                label="Paid Via"
                value={advanceBooking.paid_via}
                onChange={(e) => setAdvanceBooking(prevFormData => ({
                  ...prevFormData,
                  paid_via: e.target.value
                }))}
              >
                <MenuItem value='UPI'>UPI</MenuItem>
                <MenuItem value='Cash'>Cash</MenuItem>
                <MenuItem value='Card'>Card</MenuItem>
                <MenuItem value='AT'>Account Transfer</MenuItem>
                <MenuItem value='UPI'>UPI</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Paid Reference</Typography>
            <TextField
              className='col-span-3'
              label="Paid Reference"
              size='small'
              type='email'
              value={advanceBooking.paid_reference}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                paid_reference: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Balance Amount</Typography>
            <TextField
              className='col-span-3'
              size='small'
              type='number'
              label="Balance Amount"
              value={advanceBooking.balance_amount}
              disabled={true}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Remarks if Any</Typography>
            <TextField
              className='col-span-3'
              label="Remarks if Any"
              size='small'
              value={advanceBooking.remarks}
              onChange={(e) => setAdvanceBooking(prevData => ({
                ...prevData,
                remarks: e.target.value
              }))}
            />
          </div>
          <div className='grid grid-cols-12 items-center'>
            <Typography className='col-span-3'>Booking Reference</Typography>
            <TextField
              className='col-span-3'
              label="Booking Reference"
              size='small'
              value={advanceBooking.advance_booking_ref}
              disabled={true}
            />
          </div>

          <hr className='my-5' />

          <div className='w-full flex items-center justify-center'>
            <Button variant='contained' color='secondary' sx={{ textTransform: "none" }} className='w-40' onClick={() => setReceiptOpen(true)}>Preview</Button>
          </div>

          <Fragment>
            <Dialog
              open={receiptOpen}
              maxWidth="lg"
              onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                  return;
                }
                setReceiptOpen(false)
              }}
              disableEscapeKeyDown
            >
              <AdvanceBookingReceipt setReceiptOpen={setReceiptOpen} advanceBooking={advanceBooking} rooms={rooms} handleSubmit={handleSubmit} />
            </Dialog>
          </Fragment>
        </form>

      </Card>
    </>
  )
}

export default NewAdvanceBooking