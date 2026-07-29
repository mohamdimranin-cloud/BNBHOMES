import { Switch, Typography } from '@mui/material';
import { Fragment, useEffect, useState } from 'react'
import { Attachment, GroupGuestDetails, PaymentDetails, RoomDetails, SingleGuestDetails } from '.';
import dayjs from 'dayjs';
import { FinalPriceCalculator } from './PriceCalulator';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import { getTitleAndDescription, sortData } from '../../constants/constants';
import { AlertDialog } from '../../common';
import { roomApi, roomBookingApi, addtionalApi } from '../../api/apiService';
import { CheckInValidation } from '../../constants/CheckInValidation';
import { useContextProvider } from '../../context/contextProvider';
import { useGlobalProvider } from '../../context/globalProvider';

const CheckIn = () => {

  const { roomNum } = useParams();
  const { setIsSavingCheckIn } = useContextProvider();
  const { getGuestDataForTable } = useGlobalProvider();

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [groupCheckin, setGroupCheckin] = useState(false);
  const [btnDisable, setbtnDisable] = useState(false);
  const [floorsData, setFloorsData] = useState({});
  const [isAlerDialogtOpen, setIsAlerDialogtOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", description: "" });
  const [boockingId, setBoockingId] = useState("");

  const [formData, setFormData] = useState({
    checkInDate: dayjs(today),
    checkOutDate: dayjs(tomorrow),
    numberOfDays: 1,
    bookingRef: "",
    numOfRooms: 0,
    bookingRefNum: "",
    selectedRooms: [],
    roomBedType: [],
    guestDetails: [],
    guestType: "", corporateName: "",
    guestOccupancy: [], extraBed: [], breakfast: "", anyDiscountAmt: 0, anyDiscountCmt: "",
    roomAmount: 0.00,
    gst: 0, advanceAmount: 0, netPayable: 0.00, paymentAmount: "", paymentMethod: "", balanceAmnt: 0,
    booking_status: "checkedIn"
  });

  const handleClear = () => {
    setFormData({
      checkInDate: dayjs(today),
      checkOutDate: dayjs(tomorrow),
      numberOfDays: 1,
      bookingRef: "",
      numOfRooms: 0,
      bookingRefNum: "",
      selectedRooms: [],
      roomBedType: [],
      guestDetails: [],
      guestType: "", corporateName: "",
      guestOccupancy: [], extraBed: [], breakfast: "", anyDiscountAmt: "", anyDiscountCmt: "",
      roomAmount: 0.00,
      gst: 0, advanceAmount: 0, netPayable: 0.00, paymentAmount: "", paymentMethod: "", balanceAmnt: 0,
    });
  };

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
      console.log("Room Status Update error: " + error);
      return false;
    }
  }

  const updateRoomStatus = (roomNumbersArray) => {
    roomNumbersArray?.map(item => handleChangeRoomStatus({ roomNum: item, roomStatus: "Just Occupied" }))
  }

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();

    // console.log(formData)
    const checkinValidate = CheckInValidation({ formData });
    if (!checkinValidate.valid) {
      toast.warn(`Please Complete missing ${checkinValidate.field} required fields`);
      return false;
    }

    try {
      setIsSavingCheckIn(true);

      // Sanitize formData before sending — convert dayjs to ISO strings, numbers to floats
      const payload = {
        ...formData,
        // Use the auto-generated reference number as the booking ref
        bookingRef: formData.bookingRefNum || formData.bookingRef,
        checkInDate: dayjs(formData.checkInDate).format("YYYY-MM-DD"),
        checkOutDate: dayjs(formData.checkOutDate).format("YYYY-MM-DD"),
        numberOfDays: Number(formData.numberOfDays) || 1,
        numOfRooms: Number(formData.numOfRooms) || 1,
        roomAmount: parseFloat(formData.roomAmount) || 0,
        gst: parseFloat(formData.gst) || 0,
        advanceAmount: parseFloat(formData.advanceAmount) || 0,
        netPayable: parseFloat(formData.netPayable) || 0,
        paymentAmount: parseFloat(formData.paymentAmount) || 0,
        balanceAmnt: parseFloat(formData.balanceAmnt) || 0,
        anyDiscountAmt: parseFloat(formData.anyDiscountAmt) || 0,
        // Ensure guestOccupancy has an entry for every room with safe integer values
        guestOccupancy: formData.selectedRooms.map(roomNum => {
          const existing = formData.guestOccupancy.find(o => o.roomNum === roomNum);
          return {
            roomNum,
            numOfAdults: parseInt(existing?.numOfAdults) || 1,
            numOfChildren: parseInt(existing?.numOfChildren) || 0,
          };
        }),
        // Ensure roomBedType has an entry for every room
        roomBedType: formData.selectedRooms.map(roomNum => {
          const existing = formData.roomBedType.find(b => b.roomNum === roomNum);
          return {
            roomNum,
            bedType: existing?.bedType || "single",
          };
        }),
      };

      console.log("CHECKIN PAYLOAD:", JSON.stringify(payload, null, 2));
      const res = await roomBookingApi.submitCheckIn(payload);

      if (res.status === 200) {
        // handleClear();
        setBoockingId(res.data.booking_id);
        setbtnDisable(true);
        updateRoomStatus(formData.selectedRooms);
        toast.success("CheckIn Data Saved Successfully");
      } else {
        console.error("422 detail:", JSON.stringify(res?.response?.data || res?.data, null, 2));
        toast.error("Checkin data saving failed. Try Again");
      }
      setIsSavingCheckIn(false);
      getGuestDataForTable();
    } catch (error) {
      setIsSavingCheckIn(false);
      console.log("Checkin data upload error");
      toast.error("Checkin data upload error");
    }
  }

  const groupCheckinStatus = () => {
    setGroupCheckin(true);
    toast.error("Currently Group Check-In NOT Allowed");
    setGroupCheckin(false);
  }

  // Auto-generate booking reference number on mount
  useEffect(() => {
    const fetchNextRef = async () => {
      try {
        const res = await addtionalApi.getCheckinBookingReference();
        if (res.status === 200 && res.data.nextRef) {
          setFormData(prev => ({ ...prev, bookingRefNum: res.data.nextRef }));
        }
      } catch (err) {
        console.error("Could not fetch booking reference:", err);
      }
    };
    fetchNextRef();
  }, []);

  useEffect(() => {
    FinalPriceCalculator({ formData, setFormData });
  }, [
    formData.bookingRef, formData.guestType, formData.breakfast,
    formData.anyDiscountAmt, formData.numberOfDays, formData.paymentAmount, formData.advanceAmount
  ]);

  useEffect(() => {
    const checkRoomAlreadyBookedOrNot = async () => {
      try {
        const res = await roomApi.getAllRomms();
        if (res.status === 200) {
          const data = res.data;
          const sortedData = sortData(data);
          setFloorsData(sortedData);
        }
      } catch (error) {
        console.error("Room fetch error: " + error);
      }
    };

    checkRoomAlreadyBookedOrNot();
  }, []);

  useEffect(() => {
    if (Object.keys(floorsData).length === 0) return;

    const allRooms = [
      ...floorsData.fifth_floor,
      ...floorsData.first_floor,
      ...floorsData.fourth_floor,
      ...floorsData.ground_floor,
      ...floorsData.second_floor,
      ...floorsData.third_floor,
    ];

    const room = allRooms.find(room => room.room_number === roomNum);

    if (room && room.status !== "Vacant") {
      const { title, description: statusDescription } = getTitleAndDescription(room.status);
      setDialogContent({
        title,
        description: statusDescription
      })
      setIsAlerDialogtOpen(true);
    }
  }, [floorsData, roomNum])

  return (
    <Fragment>
      <AlertDialog
        isAlerDialogtOpen={isAlerDialogtOpen} setIsAlerDialogtOpen={setIsAlerDialogtOpen}
        dialogTitle={dialogContent.title} dialogDescription={dialogContent.description}
      />

      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow relative'>
        {/* <LocalizationProvider dateAdapter={AdapterDayjs}> */}
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between gap-10'>
          <Typography className='text-white w-1/4' fontSize={25} fontWeight={500}>Check-in</Typography>
          <div className='flex items-center justify-start gap-4'>
            <Typography className='text-white' fontSize={18}>Group Checkin</Typography>
            <div className='flex items-center justify-start text-primary bg-white px-3 rounded-md'>
              <Typography>No</Typography>
              <Switch color={groupCheckin ? "success" : "primary"} checked={groupCheckin} onChange={groupCheckinStatus} />
              <Typography>Yes</Typography>
            </div>
          </div>
        </div>
        <form onSubmit={handleCheckInSubmit}>
          <RoomDetails formData={formData} setFormData={setFormData} groupCheckin={groupCheckin} />
          <hr className='my-5 mx-10' />
          {
            groupCheckin ? (
              <GroupGuestDetails formData={formData} setFormData={setFormData} groupCheckin={groupCheckin} />
            ) : (
              <SingleGuestDetails formData={formData} setFormData={setFormData} />
            )
          }
          <hr className='my-5 mx-10' />
          <PaymentDetails formData={formData} setFormData={setFormData} />
          <hr className='my-5 mx-10' />
          <Attachment formData={formData} handleClear={handleClear} btnDisable={btnDisable} boockingId={boockingId} />
        </form>
        {/* </LocalizationProvider> */}
      </div>
    </Fragment >

  )
}

export default CheckIn