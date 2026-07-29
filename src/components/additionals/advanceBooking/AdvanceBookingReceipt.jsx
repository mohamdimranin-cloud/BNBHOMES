import { Button, DialogTitle } from '@mui/material';
import { Logo, Telephone, Whatsapp, Phone, Email } from '../../../assets';
import {getToday, getTodayTime } from '../../../constants/Functions';
import QRCode from "react-qr-code";


const AdvanceBookingReceipt = ({ setReceiptOpen, advanceBooking, rooms, handleSubmit }) => {

  const formatRoomData = (rooms) => {
    if (!rooms.length) return { types: ["N/A"], counts: ["N/A"] };

    return {
      types: rooms.map((room) => room.room_type),
      counts: rooms.map((room) => room.num_of_rooms),
    };
  };

  const { types, counts } = formatRoomData(rooms);

  return (
    <div className='p-2 w-[850px]' >
      <div className='flex-row border-2 border-blue-800 rounded'>
        <div>
          <div className='h-4 w-full bg-blue-800 -mb-1' />
          <DialogTitle align='center' component="h2" fontWeight={900} fontSize={24}>Reservation Receipt</DialogTitle>
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
          <div className='border-2 border-black p-1 w-[6rem]'>
            <QRCode
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={advanceBooking.advance_booking_ref}
              viewBox={`0 0 256 256`}
            />
          </div>
          <div className='mr-2'>
            <div className='flex'>
              <span>Booking Reference: &nbsp;</span>
              <span>{advanceBooking.advance_booking_ref}</span>
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
              <table className='ml-2'>
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
              </table>
            </div>
          </div>
        </div>

        <div className="py-5 px-10 flex flex-col gap-0">
          {/* Guest Details */}
          <div className="grid grid-cols-12 border border-black">
            <div className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black">
              <span>Guest Name</span>
              <span>Guest Mobile Number</span>
              <span>Guest Whatsapp Number</span>
              <span>Guest Email Id if available</span>
              <span>Total Number of Guest</span>
              <span>Guest Type</span>
            </div>
            <div className="col-span-8 flex flex-col px-4 py-2">
              <span>{advanceBooking.guest_name || "N/A"}</span>
              <span>{advanceBooking.mobile_num || "N/A"}</span>
              <span>{advanceBooking.whatsapp_num || "N/A"}</span>
              <span>{advanceBooking.email_id || "N/A"}</span>
              <span>{advanceBooking.num_of_guest || "N/A"}</span>
              <span>{advanceBooking.guest_type || "N/A"}</span>
            </div>
          </div>

          {/* Check-in Details */}
          <div className="grid grid-cols-12 border-l border-r border-b border-black">
            <div className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black">
              <span>Check-in Date</span>
              <span>Check-out Date</span>
              <span>Number of Nights</span>
            </div>
            <div className="col-span-8 flex flex-col px-4 py-2">
              <span>{advanceBooking.checkin_date?.format("DD/MM/YYYY") || "N/A"}</span>
              <span>{advanceBooking.checkout_date?.format("DD/MM/YYYY") || "N/A"}</span>
              <span>{advanceBooking.num_of_nights || "N/A"}</span>
            </div>
          </div>

          {/* Room Details */}
          <table className='w-full border-l border-r border-b border-black'>
            <tr className='grid grid-cols-12'>
              <td className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black"><span>Type of Guest Room</span></td>
              {
                types.map((type, index) => (
                  <td className='col-span-1 px-5 py-2'><span key={index} className="font-semibold">{type}</span></td>
                ))
              }
            </tr>
            <tr className='grid grid-cols-12'>
              <td className="col-span-4 text-black font-bold flex flex-col px-2 pb-2 border-r border-black"><span>Number of Rooms</span></td>
              {
                counts.map((count, index) => (
                  <td className='col-span-1 px-5'> <span key={index}>{count}</span></td>
                ))
              }
            </tr>
          </table>


          {/* Pricing Details */}
          <div className="grid grid-cols-12 border-l border-r border-b border-black">
            <div className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black">
              <span>Rate/Room with GST</span>
              <span>Total Amount</span>
            </div>
            <div className="col-span-8 flex flex-col px-4 py-2">
              <span>{advanceBooking.room_with_gst || "N/A"}</span>
              <span>{advanceBooking.total_amount || "N/A"}</span>
            </div>
          </div>

          {/* Discount & Final Amount */}
          <div className="grid grid-cols-12 border-l border-r border-b border-black">
            <div className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black">
              <span>Discount If Any</span>
              <span>Final Amount</span>
            </div>
            <div className="col-span-8 flex flex-col px-4 py-2">
              <span>{advanceBooking.discount_any || "N/A"}</span>
              <span>{advanceBooking.final_amount || "N/A"}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-12 border border-black">
            <div className="col-span-4 text-black font-bold flex flex-col px-2 py-2 border-r border-black">
              <span>Advance Amount</span>
              <span>Paid Via</span>
              <span>Paid Reference</span>
              <span>Balance Amount</span>
            </div>
            <div className="col-span-8 flex flex-col px-4 py-2">
              <span>{advanceBooking.advance_amount || "N/A"}</span>
              <span>{advanceBooking.paid_via || "N/A"}</span>
              <span>{advanceBooking.paid_reference || "N/A"}</span>
              <span>{advanceBooking.balance_amount || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
      <div className='w-full flex items-center justify-center gap-5 mt-4 mb-3'>
        <Button type='submit' variant='contained' color='success' sx={{ textTransform: "none" }} className='w-40' onClick={handleSubmit}>Confirm Booking</Button>
        <Button variant='contained' color='error' sx={{ textTransform: "none" }} className='w-32' onClick={() => setReceiptOpen(false)}>Close Receipt</Button>
      </div>
    </div>
  )
}

export default AdvanceBookingReceipt;