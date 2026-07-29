import { Backdrop, Button, Card, CircularProgress, DialogTitle, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Email, Logo, Phone, Telephone, Whatsapp } from '../../assets/index';
import { calculateAmounts, calculateTotalPersons, extractDateTimeCheckout, getToday, getTodayTime } from '../../constants/Functions'
import { toast } from 'react-toastify'
import ReactToPrint from 'react-to-print';
import { useNavigate, useParams } from 'react-router-dom';
import { roomApi, roomBookingApi } from '../../api/apiService';

const CheckOut = () => {

  const receiptRef = useRef();
  const { roomNum } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [extraCharges, setExtraCharges] = useState([]);
  const [moneyEntries, setMoneyEntries] = useState([]);
  const [amount, setAmount] = useState({
    advanceAmount: "",
    anyDiscountAmt: "",
    balanceAmnt: "",
    gst: "",
    netPayable: "",
    paymentAmount: "",
    roomAmount: ""
  });
  const [extractedAmount, setExtractedAmount] = useState({
    totalAmountPayable: "", alreadyPaid: "", balancePayment: ""
  });

  const userRole = localStorage.getItem('userRole') ?? '';

  const finalBalance = useMemo(() => {
    const netPayable = parseFloat(amount.netPayable) || 0;
    const advanceAmount = parseFloat(amount.advanceAmount) || 0;
    const totalExtraCharges = extraCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalMoneyEntries = moneyEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return netPayable + totalExtraCharges - totalMoneyEntries - advanceAmount;
  }, [amount.netPayable, amount.advanceAmount, extraCharges, moneyEntries]);

  const [balanceCleared, setBalanceCleared] = useState(false);
  const [showClearForm, setShowClearForm] = useState(false);
  const [clearPaymentMethod, setClearPaymentMethod] = useState('');
  const [clearReference, setClearReference] = useState('');
  const [clearFormErrors, setClearFormErrors] = useState({});
  const [isClearSubmitting, setIsClearSubmitting] = useState(false);
  const isCheckoutBlocked = finalBalance > 0 && userRole !== 'admin' && !balanceCleared;

  const receiptSummary = useMemo(() => {
    if (!formData) return '';
    const guestName = formData.guestDetails?.length > 0 ? formData.guestDetails[0].name : 'N/A';
    const rooms = formData.selectedRooms?.join(', ') ?? 'N/A';
    const checkIn = extractDateTimeCheckout(formData.checkInDate).date ?? 'N/A';
    const checkOut = extractDateTimeCheckout(formData.checkOutDate).date ?? 'N/A';
    const extraChargeLines = extraCharges.length > 0
      ? extraCharges.map(c => `  - ${c.reason ?? 'Charge'}: ₹${c.amount ?? 0}`).join('\n')
      : '  None';
    const moneyEntryLines = moneyEntries.length > 0
      ? moneyEntries.map(e => `  - ₹${e.amount ?? 0} via ${e.payment_method ?? e.paymentMethod ?? 'N/A'} (Ref: ${e.reference_no ?? e.referenceNo ?? 'N/A'})`).join('\n')
      : '  None';
    return [
      'BnB Homes - Checkout Receipt',
      '-----------------------------',
      `Guest Name   : ${guestName}`,
      `Room(s)      : ${rooms}`,
      `Check-in     : ${checkIn}`,
      `Check-out    : ${checkOut}`,
      `Nights       : ${formData.numberOfDays ?? 'N/A'}`,
      '',
      'Extra Charges:',
      extraChargeLines,
      '',
      'Money Entries:',
      moneyEntryLines,
      '',
      `Final Balance: ₹${finalBalance.toFixed(2)}`,
    ].join('\n');
  }, [formData, extraCharges, moneyEntries, finalBalance]);

  const handleShare = async () => {
    if (!receiptSummary) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'BnB Homes - Checkout Receipt', text: receiptSummary });
      } catch (err) {
        // User cancelled or share failed — silently ignore
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(receiptSummary);
        toast.success('Receipt copied to clipboard');
      } catch (err) {
        console.error('Clipboard write failed:', err);
        toast.error('Failed to copy receipt');
      }
    }
  };

  // update this to by room number and update the route as well
  // const handleSearch = async (event) => {
  //   if (event.key === 'Enter' || event.keyCode === 13) {
  //     setIsDataLoading(true);
  //     if (bookingId !== '') {
  //       try {
  //         const res = await roomBookingApi.getBookingById(bookingId);

  //         if (res.status === 200) {
  //           const data = await res.data;

  //           setFormData(data);
  // setAmount({
  //   advanceAmount: data.advanceAmount,
  //   anyDiscountAmt: data.anyDiscountAmt,
  //   balanceAmnt: data.balanceAmnt,
  //   gst: data.gst,
  //   netPayable: data.netPayable,
  //   paymentAmount: data.paymentAmount,
  //   roomAmount: data.roomAmount
  // });
  // const { totalAmountPayable: tAP, alreadyPaid: aP, balancePayment: bP } = calculateAmounts(amount);
  // setExtractedAmount({
  //   totalAmountPayable: tAP,
  //   alreadyPaid: aP,
  //   balancePayment: bP,
  // });
  //           console.log(data);

  //   setIsDataLoading(false);
  // } else {
  //   setIsDataLoading(false);
  //   toast.warn("No record found for Booking ID: " + bookingId);
  //   setFormData(null);
  // }
  //       } catch (error) {
  //         setIsDataLoading(false);
  //         setFormData(null);
  //         console.error("Error fetching data: ", error);
  //       }
  //     } else {
  //       setIsDataLoading(true);
  //       toast.warn("Not entered any Booking ID");
  //       setFormData(null);
  //     }
  //   }
  // };

  const handleChangeRoomStatus = async ({ roomNum, roomStatus }) => {
    try {
      const updatedStatus = {
        "status": roomStatus
      };

      const res = await roomApi.updateRoomStatus(roomNum, updatedStatus);

      if (res.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Room Status Update error: " + error);
      return false;
    }
  }

  const handleDoCheckout = async ({ bookingId }) => {
    try {
      const res = await roomBookingApi.doCheckOut(bookingId);
      if (res.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Checkout Api error");
      return false;
    }
  }

  const handleClearAmountSubmit = async () => {
    const errors = {};
    if (!clearPaymentMethod) errors.clearPaymentMethod = 'Payment method is required.';
    if (Object.keys(errors).length > 0) { setClearFormErrors(errors); return; }
    setClearFormErrors({});
    setIsClearSubmitting(true);
    try {
      const res = await roomBookingApi.addMoneyEntry(bookingId, {
        amount: finalBalance,
        payment_method: clearPaymentMethod,
        reference_number: clearReference || null,
      });
      if (res.status === 200 || res.status === 201) {
        setMoneyEntries(prev => [...prev, { amount: finalBalance, payment_method: clearPaymentMethod, reference_no: clearReference }]);
        setBalanceCleared(true);
        setShowClearForm(false);
        toast.success('Payment recorded. You can now proceed with checkout.');
      } else {
        toast.error('Failed to record payment. Please try again.');
      }
    } catch (err) {
      console.error('Clear amount error:', err);
      toast.error('Failed to record payment. Please try again.');
    }
    setIsClearSubmitting(false);
  };

  const handleCheckOut = () => {
    // checkout api must be added
    formData?.guestDetails?.map(item => handleDoCheckout({ bookingId: item?.booking_id }));
    formData?.selectedRooms?.map(item => handleChangeRoomStatus({ roomNum: item, roomStatus: "Cleaning Process" }));
    toast.success("Checkout successfull");
    navigate("/");
  }

  useEffect(() => {
    const fetchGuestDataTocheckOut = async () => {
      try {
        setIsDataLoading(true);

        const res = await roomBookingApi.getCheckoutData(roomNum);
        if (res.status === 200) {
          const data = await res.data;
          setFormData(data);
          const fetchedBookingId = data?.guestDetails[0]?.booking_id;
          setBookingId(fetchedBookingId);
          setAmount({
            advanceAmount: data.advanceAmount,
            anyDiscountAmt: data.anyDiscountAmt,
            balanceAmnt: data.balanceAmnt,
            gst: data.gst,
            netPayable: data.netPayable,
            paymentAmount: data.paymentAmount,
            roomAmount: data.roomAmount
          });

          const { totalAmountPayable: tAP, alreadyPaid: aP, balancePayment: bP } = calculateAmounts(amount);

          setExtractedAmount({
            totalAmountPayable: tAP,
            alreadyPaid: aP,
            balancePayment: bP,
          });

          // Fetch extra charges and money entries in parallel
          if (fetchedBookingId) {
            try {
              const [extraChargesRes, moneyEntriesRes] = await Promise.all([
                roomBookingApi.getExtraCharges(fetchedBookingId),
                roomBookingApi.getMoneyEntries(fetchedBookingId),
              ]);
              if (extraChargesRes.status === 200) {
                setExtraCharges(extraChargesRes.data ?? []);
              }
              if (moneyEntriesRes.status === 200) {
                setMoneyEntries(moneyEntriesRes.data ?? []);
              }
            } catch (chargesError) {
              console.error("Error fetching extra charges or money entries:", chargesError);
            }
          }

          setIsDataLoading(false);
        } else {
          setIsDataLoading(false);
          toast.warn("No record found for Booking ID: " + bookingId);
          setFormData(null);
        }
        console.log(formData);

      } catch (error) {
        console.error("Error while fetching guest data by room number");
        setIsDataLoading(false);
      }
    }

    fetchGuestDataTocheckOut();
  }, [roomNum]);

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
          <Typography className='text-white w-1/4' fontSize={25} fontWeight={500}>Check-out</Typography>

          {/* <div className='flex items-center justify-center gap-4'>
            <TextField
              size='small'
              placeholder='Search by Booking ID'
              variant='outlined'
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              onKeyDown={handleSearch}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <Search className='text-white' />
                  </InputAdornment>
                )
              }}
              sx={SearchInputStyle}
            /> */}

          <Button variant='contained' color='primary' className='right-0' sx={{ textTransform: "none" }} onClick={() => navigate("/")}>Go Back</Button>
          {/* </div> */}
        </div>
      </div >

      <Card className='!rounded-lg px-4 py-5 flex items-center justify-center'>
        {
          (formData !== null) ? (
            <div className='flex flex-col items-center justify-center gap-4 overflow-x-scroll'>
              <div className='p-2 w-[800px]' ref={receiptRef}>
                <div className='flex-row border-2 border-blue-800 rounded'>
                  <div>
                    <div className='h-4 w-full bg-blue-800 -mb-1' />
                    <DialogTitle align='center' component="h2" fontWeight={900} fontSize={24}>Guest Receipt - Checkout</DialogTitle>
                  </div>
                  <div className='flex -mt-1 border-t border-b p-1 items-center justify-between'>
                    <div className='flex gap-2'>
                      <img
                        src={Logo}
                        alt='Logo'
                        className='h-32 w-2h-32'
                      />
                      <p className='text-black font-medium'>
                        BnB Homes <br />
                        518/4, Phoenix Ln, <br />
                        Thirupathapuram Jn, <br />
                        Kazhakootam, <br />
                        Trivandrum.
                      </p>
                    </div>
                    <div className='mr-2'>
                      {/* <div className='flex'>
                      <span>Booking Reference: &nbsp;</span>
                      <span>{formData.bookingRef !== "" ? formData.bookingRef : "null"}</span>
                    </div> */}
                      <div className='flex'>
                        <span>Receipt Number: &nbsp;</span>
                        <span>{bookingId !== "" ? bookingId : "null"}</span>
                      </div>
                      <div className='flex'>
                        <span>Date: &nbsp;</span>
                        <span>{getToday()}</span>
                      </div>
                      <div className='flex'>
                        <span>Time: &nbsp;</span>
                        <span>{getTodayTime()}</span>
                      </div>
                      <div className='flex-row items-center'>
                        <span>Contact Us: &nbsp;</span>
                        <table className='ml-2'>
                          <tbody>
                          <tr>
                            <td><img src={Phone} alt="Phone" width={18} height={18} /></td>
                            <td><img src={Whatsapp} alt="Whatsapp" width={18} height={18} /></td>
                            <td>&nbsp; : &nbsp;7540000750</td>
                          </tr>
                          <tr>
                            <td colSpan={2} align='center'><img src={Telephone} alt="Telephone" width={20} height={20} /></td>
                            <td>&nbsp; : &nbsp;0471 3567506</td>
                          </tr>
                          <tr>
                            <td colSpan={2} align='center'><img src={Email} alt="Email" width={20} height={20} /></td>
                            <td>
                              &nbsp; : &nbsp;
                              <a href="mailto:bnbhomestvm@gmail.com">bnbhomestvm@gmail.com</a>
                            </td>
                          </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className='border-b'>
                    <table className='my-5 p-5'>
                      <tbody>
                      <tr>
                        <td rowSpan={6} className='transform -rotate-90 tableSide'>Room Details</td>
                        <td className='px-4'>Checkin Date </td>
                        <td className=''>{extractDateTimeCheckout(formData.checkInDate).date}</td>
                        <td className='pl-20'>Checkin Time</td>
                        <td className='px-4'>{extractDateTimeCheckout(formData.checkInDate).time}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Check out Date</td>
                        <td className=''>{extractDateTimeCheckout(formData.checkOutDate).date}</td>
                        <td className='pl-20'>Check out Time</td>
                        <td className='px-4'>{getTodayTime()}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Number Of Nights</td>
                        <td colSpan={3}>{formData.numberOfDays}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Number of Rooms</td>
                        <td colSpan={3}>{formData.numOfRooms}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Room Numbers</td>
                        <td colSpan={3}>
                          {
                            formData.selectedRooms?.join(',') ?? ''
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className='px-4'>Extra Bed</td>
                        <td colSpan={3}>{formData.extraBed?.length ? formData.extraBed : "No"}</td>
                      </tr>
                      <tr>
                        <td colSpan={5}><br /></td>
                      </tr>
                      <tr>
                        <td rowSpan={6} className='transform -rotate-90 tableSide'>Guest Details</td>
                        <td className='px-4'>Guest Name</td>
                        <td colSpan={3}>{formData.guestDetails?.length > 0 && formData.guestDetails[0].name}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Mobile Number</td>
                        <td colSpan={3}>{formData.guestDetails?.length > 0 && formData.guestDetails[0].mobile_no}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>WhatsApp Number</td>
                        <td colSpan={3}>{formData.guestDetails?.length > 0 && formData.guestDetails[0].whatsapp_no}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>ID Number</td>
                        <td colSpan={3}>{formData.guestDetails?.length > 0 && formData.guestDetails[0].id_no}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Number of Person</td>
                        <td colSpan={3}>{calculateTotalPersons(formData.guestOccupancy)}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Car/Bike Plate No</td>
                        <td colSpan={3}>{formData.guestDetails?.length > 0 && formData.guestDetails[0].vehicle_no}</td>
                      </tr>
                      <tr>
                        <td colSpan={5}><br /></td>
                      </tr>
                      <tr>
                        <td rowSpan={8} className='transform -rotate-90 tableSide'>Payment Details</td>
                        <td className='px-4'>Amount for Room</td>
                        <td colSpan={3}>{formData.roomAmount}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Services/Damage</td>
                        <td colSpan={3}>{formData.bikeCarNumber}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>GST 12%</td>
                        <td colSpan={3}>{formData.gst}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Total Amount Payable</td>
                        <td colSpan={3}>{extractedAmount?.totalAmountPayable}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Already Paid</td>
                        <td colSpan={3}>{extractedAmount.alreadyPaid}</td>
                      </tr>
                      <tr>
                        <td className='px-4'>Final Balance</td>
                        <td colSpan={3} className={finalBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {finalBalance.toFixed(2)}
                        </td>
                      </tr>
                      </tbody>
                    </table>

                    <div className='w-full text-right px-3 text-black'>
                      <span>Checkout Done By: </span>
                      <span className='font-medium'>{formData.guestDetails?.length > 0 && formData.guestDetails[0].name}</span>
                    </div>
                  </div>

                  {/* Extra Charges Section */}
                  <div className='border-b px-4 py-3'>
                    <p className='font-semibold text-sm mb-2'>Extra Charges</p>
                    {extraCharges.length > 0 ? (
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b'>
                            <th className='text-left py-1 pr-4'>Reason</th>
                            <th className='text-right py-1'>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extraCharges.map((charge, index) => (
                            <tr key={index} className='border-b last:border-0'>
                              <td className='py-1 pr-4'>{charge.reason ?? '-'}</td>
                              <td className='py-1 text-right'>{charge.amount ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className='text-sm text-gray-500'>None</p>
                    )}
                  </div>

                  {/* Money Entries Section */}
                  <div className='border-b px-4 py-3'>
                    <p className='font-semibold text-sm mb-2'>Money Entries</p>
                    {moneyEntries.length > 0 ? (
                      <table className='w-full text-sm'>
                        <thead>
                          <tr className='border-b'>
                            <th className='text-left py-1 pr-4'>Amount</th>
                            <th className='text-left py-1 pr-4'>Payment Method</th>
                            <th className='text-right py-1'>Reference No.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {moneyEntries.map((entry, index) => (
                            <tr key={index} className='border-b last:border-0'>
                              <td className='py-1 pr-4'>{entry.amount ?? '-'}</td>
                              <td className='py-1 pr-4'>{entry.payment_method ?? entry.paymentMethod ?? '-'}</td>
                              <td className='py-1 text-right'>{entry.reference_no ?? entry.referenceNo ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className='text-sm text-gray-500'>None</p>
                    )}
                  </div>

                  <div className='w-full flex items-center justify-center py-5'>
                    <div className='border-2 border-primary px-14 py-3'>
                      <span className='text-primary text-2xl font-bold'>THANK YOU</span>
                    </div>
                  </div>

                  <div className='h-3 w-full bg-blue-800 -mb-1' />

                  <div className='my-4 w-full text-center'>
                    <span className='text-primary text-sm'>Soft copy will be shared to Customer and "BnB Check out"</span>
                  </div>
                </div>
              </div>

              <Card className='w-full flex flex-col items-center justify-center gap-4 py-4 px-6'>
                {/* Clear Amount inline form */}
                {showClearForm && (
                  <div className='w-full max-w-md border rounded-lg p-4 flex flex-col gap-3 bg-orange-50'>
                    <Typography variant='subtitle2' fontWeight={600}>
                      Clear Outstanding Balance: ₹{finalBalance.toFixed(2)}
                    </Typography>
                    <FormControl size='small' error={!!clearFormErrors.clearPaymentMethod} fullWidth>
                      <InputLabel>Payment Method *</InputLabel>
                      <Select
                        value={clearPaymentMethod}
                        label='Payment Method *'
                        onChange={e => { setClearPaymentMethod(e.target.value); setClearFormErrors(prev => ({ ...prev, clearPaymentMethod: '' })); }}
                      >
                        <MenuItem value='Cash'>Cash</MenuItem>
                        <MenuItem value='Card'>Card</MenuItem>
                        <MenuItem value='UPI'>UPI</MenuItem>
                        <MenuItem value='Bank Transfer'>Bank Transfer</MenuItem>
                      </Select>
                      {clearFormErrors.clearPaymentMethod && <FormHelperText>{clearFormErrors.clearPaymentMethod}</FormHelperText>}
                    </FormControl>
                    <TextField
                      size='small'
                      label='Reference Number (optional)'
                      value={clearReference}
                      onChange={e => setClearReference(e.target.value)}
                      fullWidth
                    />
                    <div className='flex gap-2 justify-end'>
                      <Button variant='outlined' size='small' onClick={() => setShowClearForm(false)} disabled={isClearSubmitting}>Cancel</Button>
                      <Button variant='contained' color='warning' size='small' onClick={handleClearAmountSubmit} disabled={isClearSubmitting}>
                        {isClearSubmitting ? <CircularProgress size={16} /> : 'Confirm Payment'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className='flex items-center gap-5 flex-wrap justify-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <Button
                      variant='contained'
                      onClick={handleCheckOut}
                      disabled={isCheckoutBlocked}
                    >
                      Checkout
                    </Button>
                    {finalBalance > 0 && userRole !== 'admin' && !balanceCleared && (
                      <Typography variant='caption' color='error'>
                        Outstanding balance must be cleared before checkout.
                      </Typography>
                    )}
                  </div>
                  {finalBalance > 0 && userRole !== 'admin' && !balanceCleared && !showClearForm && (
                    <Button
                      variant='outlined'
                      color='warning'
                      onClick={() => setShowClearForm(true)}
                    >
                      Clear Amount
                    </Button>
                  )}
                  <div className='flex justify-center'>
                    <ReactToPrint
                      trigger={() =>
                        <Button variant='outlined' className='w-fit'>Print Receipt</Button>
                      }
                      content={() => receiptRef.current}
                      documentTitle={`CheckOutReceipt-${bookingId}`}
                      onAfterPrint={() => { }}
                    />
                  </div>
                  <div className='flex justify-center'>
                    <Button variant='outlined' className='w-fit' onClick={handleShare}>Share</Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className='w-full flex flex-col items-center gap-4'>
              <div className='w-full flex justify-end'>
                <Button variant='outlined' color='error' className='right-0' sx={{ textTransform: "none" }} onClick={() => navigate("/")}>Go Back</Button>
              </div>
              <Card className='w-full text-center'>
                <div className='py-5 text-gray-400 cursor-default'>
                  No Room Data found
                </div>
              </Card>
            </div>
          )
        }
      </Card >
    </>
  )
}

export default CheckOut