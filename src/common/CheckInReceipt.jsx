import { DialogTitle } from '@mui/material';
import { Email, Logo, Phone, Telephone, Whatsapp } from '../assets/index';
import { calculateTotalPersons, extractDateTime, getToday, getTodayTime, numberToWords } from '../constants/Functions';
import { forwardRef, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fileApi } from '../api/apiService';

const CheckInReceipt = forwardRef(({ formData, boockingId }, ref) => {

  const [userPhoto, setUserPhoto] = useState("");

  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const filePath = localStorage.getItem("userImg");
        const res = await fileApi.getUploadedFile(filePath);

        if (res.status === 200) {
          const blobData = await res.data;
          const imageBlobUrl = URL.createObjectURL(blobData);
          setUserPhoto(imageBlobUrl)
        } else {
          toast.error("Profile Photo fetch failed");
        }
      } catch (error) {
        console.error("User Photo fetch Error: " + error);
      }
    }

    fetchUserPhoto();
  }, []);

  return (
    <div className='p-2 w-[800px]' ref={ref}>
      <div className='flex-row border-2 border-blue-800 rounded'>
        <div>
          <div className='h-4 w-full bg-blue-800 -mb-1' />
          <DialogTitle align='center' component="h2" fontWeight={900} fontSize={24}>Checkin Receipt</DialogTitle>
        </div>
        <div className='flex -mt-1 border-t border-b p-1 items-center justify-between'>
          <div className='flex gap-2'>
            <img
              src={Logo}
              alt='Logo'
              className='h-32 w-2h-32'
            />
            <p>
              BnB Homes <br />
              518/4, Phoenix Ln, <br />
              Thirupathapuram Jn, <br />
              Kazhakootam, <br />
              Trivandrum.
            </p>
          </div>
          <div className='mr-2'>
            <div className='flex'>
              <span>Checkin Reference: &nbsp;</span>
              <span>{formData.bookingRef !== "" ? formData.bookingRef : "null"}</span>
            </div>
            <div className='flex'>
              <span>Booking ID: &nbsp;</span>
              <span>{boockingId !== "" ? boockingId : "null"}</span>
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
              {/* <span>Contact Us: &nbsp;</span> */}
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

        <div className='border-b'>
          <table className='my-5 p-5'>
            <tr>
              <td rowSpan={6} className='transform -rotate-90 tableSide'>Room Details</td>
              <td className='px-4'>Checkin Date </td>
              <td className=''>{extractDateTime(formData.checkInDate).date}</td>
              <td className='pl-20'>Checkin Time</td>
              <td className='px-4'>{extractDateTime(formData.checkInDate).time}</td>
            </tr>
            <tr>
              <td className='px-4'>Check out Date</td>
              <td colSpan={3}>{extractDateTime(formData.checkOutDate).date}</td>
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
                  formData.selectedRooms.join(',')
                }
              </td>
            </tr>
            <tr>
              <td className='px-4'>Extra Bed</td>
              <td colSpan={3}>{formData.extraBed ? "Yes" : "No"}</td>
            </tr>
            <tr>
              <td colSpan={5}><br /></td>
            </tr>
            <tr className='relative'>
              <td rowSpan={6} className='transform -rotate-90 tableSide'>Guest Details</td>
              <td className='px-4'>Guest Name</td>
              <td colSpan={3}>{formData.guestDetails.length > 0 && formData.guestDetails[0].name}</td>
              <td rowSpan={6}>
                <div className='absolute top-0 right-0 border border-primary rounded-md w-[150px] h-[150px] flex items-center justify-center'>
                  <img src={userPhoto} alt="GuestPhoto" />
                </div>
              </td>
            </tr>
            <tr>
              <td className='px-4'>Mobile Number</td>
              <td colSpan={3}>{formData.guestDetails.length > 0 && formData.guestDetails[0].mobileNo}</td>
            </tr>
            <tr>
              <td className='px-4'>WhatsApp Number</td>
              <td colSpan={3}>{formData.guestDetails.length > 0 && formData.guestDetails[0].whatsappNo}</td>
            </tr>
            <tr>
              <td className='px-4'>ID Number</td>
              <td colSpan={3}>{formData.guestDetails.length > 0 && formData.guestDetails[0].idNo}</td>
            </tr>
            <tr>
              <td className='px-4'>Number of Person</td>
              <td colSpan={3}>{calculateTotalPersons(formData.guestOccupancy)}</td>
            </tr>
            <tr>
              <td className='px-4'>Car/Bike Plate No</td>
              <td colSpan={3}>{formData.guestDetails.length > 0 && formData.guestDetails[0].vehicleNo}</td>
            </tr>
            <tr>
              <td colSpan={5}><br /></td>
            </tr>
            <tr>
              <td rowSpan={8} className='transform -rotate-90 tableSide'>Payment Details</td>
              <td className='px-4'>Amount for Room</td>
              <td colSpan={3}>₹{formData.roomAmount}</td>
            </tr>
            <tr>
              <td className='px-4'>GST</td>
              <td colSpan={3}>₹{formData.gst}</td>
            </tr>
            <tr>
              <td className='px-4'>Advance Payment</td>
              <td colSpan={3}>₹{formData.advanceAmount}</td>
            </tr>
            <tr>
              <td className='px-4'>Balance Payment</td>
              <td colSpan={3}>₹{formData.balanceAmnt}</td>
            </tr>
            <tr>
              <td className='px-4'>Net Payable </td>
              <td colSpan={3}>₹{formData.netPayable}</td>
            </tr>
            <tr>
              <td className='px-4'>Amount in Words</td>
              <td colSpan={3}>{numberToWords(formData.netPayable)}</td>
            </tr>
            <tr>
              <td className='px-4'>Payment Method</td>
              <td colSpan={3} className=''>{formData.paymentMethod}</td>
            </tr>
          </table>

          <div className='w-full text-right px-3 text-black'>
            <span>Checkin Done By: </span>
            <span className='font-medium'>{formData.guestDetails.length > 0 && formData.guestDetails[0].name}</span>
          </div>
        </div>

        {/* <div className="py-3 pl-14">
          <h2 className="text-[17px] font-bold py-1">Terms & Conditions</h2>
          <ul className="list-disc pl-5 space-y-2 ml-6">
            <li className="ml-0">
              I have read the full page of the terms & conditions of BnB Homes document reference XXXXXXXXX, which is attached along with this receipt.
            </li>
            <li className="ml-0">
              I am legally responsible for any incompliance by me from the Terms & Conditions of BnB Homes.
            </li>
          </ul>
        </div> */}
        <div className='w-full flex items-center justify-center py-5'>
          <div className='border-2 border-primary px-14 py-3'>
            <span className='text-primary text-2xl font-bold'>THANK YOU</span>
          </div>
        </div>

        <div className='h-3 w-full bg-blue-800 -mb-1' />

        <div className='my-4 w-full text-center'>
          <span className='text-primary text-sm'>Only Soft copy will be shared</span>
        </div>
      </div>
    </div>
  );
});

export default CheckInReceipt;