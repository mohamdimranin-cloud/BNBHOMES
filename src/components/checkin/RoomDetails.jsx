import { useEffect, useState } from 'react';
import { Chip, Dialog, FormControl, InputLabel, Menu, MenuItem, Select, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { BedTypeSelector, DropdownMenu, NumberOfPersons, RoomsCard } from '../../common';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { useParams } from 'react-router-dom';
import { sortData, StatusAndColor } from '../../constants/constants';
import { toast } from 'react-toastify';
import { roomApi } from '../../api/apiService';

const menuItemStyle = {
  ":hover": { backgroundColor: "transparent" },
  "cursor": "default"
};

const RoomDetails = ({ formData, setFormData, groupCheckin }) => {

  const { roomNum } = useParams();

  const [selectedRooms, setSelectedRooms] = useState(formData.selectedRooms);

  const [roomDetails, setRoomDetails] = useState({});

  const fetchRoomData = async () => {
    try {
      const res = await roomApi.getAllRomms();
      if (res.status === 200) {
        const data = await res.data;
        const sortedData = sortData(data);
        setRoomDetails(sortedData);
      }
    } catch (error) {
      console.log("Room Data fetch error: " + error);
      toast.error("Room Data fetch error");
    }
  }

  useEffect(() => {
    fetchRoomData();
  }, []);

  useEffect(() => {
    const calculateNumOfDays = () => {
      const differenceInMilliseconds = dayjs(formData.checkOutDate) - dayjs(formData.checkInDate);
      const millisecondsInADay = 24 * 60 * 60 * 1000;
      const differenceInDays = differenceInMilliseconds / millisecondsInADay;

      setFormData(prevFormData => ({
        ...prevFormData,
        numberOfDays: differenceInDays > 0 ? differenceInDays : 1
      }));
    }

    calculateNumOfDays();
  }, [formData.checkOutDate, formData.checkInDate]);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    setFormData(prevFormData => ({
      ...prevFormData,
      selectedRooms: selectedRooms,
      numOfRooms: selectedRooms.length
    }));

  }, [selectedRooms]);

  useEffect(() => {
    const addSingleCheckinRoomNum = () => {
      if (!groupCheckin) {
        setFormData(prevData => ({
          ...prevData,
          selectedRooms: [roomNum],
          numOfRooms: 1,
          roomBedType: [],
          guestOccupancy: [],
        }));
        setSelectedRooms([roomNum]);

      } else {
        setFormData(prevData => ({
          ...prevData,
          selectedRooms: [],
          numOfRooms: 0,
          roomBedType: [],
          guestOccupancy: [],
        }));

        setSelectedRooms([]);
      }
    }
    addSingleCheckinRoomNum();
  }, [groupCheckin]);

  return (
    <div className="my-5 mx-1 grid grid-cols-12 gap-4">
      <div className="col-span-1 flex items-center justify-center bg-primary rounded-lg">
        <span className="transform -rotate-90 text-white text-xl font-bold text-nowrap">Boocking Details</span>
      </div>
      <div className='col-span-1' />
      <div className='col-span-10'>
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Check-In Date</Typography>
          <DatePicker
            sx={{ width: 300 }}
            label="Check-in Date"
            name='chechInDate'
            minDate={dayjs()}
            value={dayjs(formData.checkInDate)}
            onChange={(e) => setFormData(prevFormData => ({
              ...prevFormData,
              checkInDate: dayjs(e)
            }))}
          />
        </div>
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Check-Out Date</Typography>
          <DatePicker
            sx={{ width: 300 }}
            label="Check-Out Date"
            name='checkOutDate'
            minDate={dayjs()}
            value={dayjs(formData.checkOutDate)}
            onChange={(e) => setFormData(prevFormData => ({
              ...prevFormData,
              checkOutDate: dayjs(e)
            }))}
          />
        </div>
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Number of Days</Typography>
          <TextField
            label="Number of Days"
            value={formData.numberOfDays}
            sx={{ width: 300 }}
          />
        </div>
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Booking Reference <span className='text-red-500'>*</span></Typography>
          <div className='flex flex-col xl:flex-row xl:col-span-2 gap-4 xl:gap-10'>
            <FormControl sx={{ width: 300 }}>
              <InputLabel id="booking-reference">Booking Reference <span className='text-red-500'>*</span></InputLabel>
              <Select
                labelId="booking-reference"
                value={formData.bookingRef}
                label="Booking Reference"
                onChange={(e) => setFormData(prevFormData => ({
                  ...prevFormData,
                  bookingRef: e.target.value
                }))
                }
              >
                <MenuItem value={"direct-ckeckin"}>Direct Check in</MenuItem>
                <MenuItem value={"direct-advance"}>Direct Advance</MenuItem>
                <MenuItem value={"booking-com"}>Booking.com</MenuItem>
                <MenuItem value={"mmt"}>MMT</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>

        <div className='grid grid-cols-3 items-center mt-5'>
          <Typography className='text-primary'>Booking Reference Number</Typography>
          <TextField
            label="Booking Reference Number"
            variant='outlined'
            sx={{ width: 300 }}
            value={formData.bookingRefNum}
            InputProps={{ readOnly: true }}
          />
        </div>
        {/* <br /> */}
        {/* <div className={`grid grid-cols-3 mt-5 items-center ${(formData.bookingRef === "direct-ckeckin" || formData.bookingRef === "") && "hidden"}`}>
        <div />
        <TextField label="Booking Reference Number" variant='outlined' sx={{ width: 300 }} disabled={formData.bookingRef === "direct"} value={formData.bookingRefNum}
          onChange={(e) => setFormData(prevData => ({
            ...prevData,
            bookingRefNum: e.target.value
          }))}
        />
      </div> */}
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Room Number</Typography>
          {
            groupCheckin ? (
              <div className=''>
                {
                  selectedRooms.length === 0 ? (
                    <div className='border flex justify-center items-center w-[300px] h-36 rounded-md border-slate-300 cursor-pointer' onClick={handleClick}>
                      <span className='text-gray-400'>Click to select rooms</span>
                    </div>
                  ) : (
                    <div className='border flex gap-2 flex-wrap px-3 py-2 w-[300px] h-36 rounded-md border-slate-300 cursor-pointer' onClick={handleClick}>
                      {
                        selectedRooms.slice(0, 9).map((item, idx) => (
                          <Chip
                            key={idx}
                            label={item}
                            variant="outlined"
                            color='primary'
                            icon={<BookmarkAddedIcon />}
                            className='!px-2' />
                        ))
                      }
                    </div>
                  )
                }
                <Dialog open={open}>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'center',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'center',
                      horizontal: 'center',
                    }}
                    sx={{ height: 800 }} className='w-full flex items-center justify-center'
                  >
                    <FormControl>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="Fifth Floor" rooms={roomDetails?.fifth_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="Fourth Floor" rooms={roomDetails?.fourth_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="Third Floor" rooms={roomDetails?.third_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="Second Floor" rooms={roomDetails?.second_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="First Floor" rooms={roomDetails?.first_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                      <MenuItem disableRipple sx={menuItemStyle}><RoomsCard name="Ground Floor" rooms={roomDetails?.ground_floor} setSelectedRooms={setSelectedRooms} setRoomDetails={setRoomDetails} formData={formData} /></MenuItem>
                    </FormControl>
                    <FormControl>
                      <MenuItem disableTouchRipple sx={{ ...menuItemStyle, height: 550 }} className='pr-4 flex flex-col items-start justify-center gap-2'>
                        {
                          StatusAndColor.map(item => (
                            <div className={`flex items-center justify-start gap-2 border ${item.borderColor} rounded-full px-3 py-1 w-full`}>
                              <div className={`h-2 w-2 rounded-full ${item.bgColor}`} />
                              <span className={item.txtColor}>{item.label}</span>
                            </div>
                          ))
                        }
                      </MenuItem>
                    </FormControl>
                  </Menu>
                </Dialog>
              </div>
            ) : (
              <TextField
                disabled={true}
                value={formData.selectedRooms.length === 1 && formData.selectedRooms[0]}
                label="Room Number"
                variant="outlined"
                sx={{
                  width: 300,
                }}
              />
            )
          }
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Number of Rooms</Typography>
          <TextField
            disabled={true}
            value={formData.numOfRooms}
            label="Number of Rooms"
            variant="outlined"
            sx={{
              width: 300,
            }}
          />
        </div>
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Bed Type</Typography>
          <BedTypeSelector checkinType={groupCheckin} selectedRooms={selectedRooms} setFormData={setFormData} formData={formData} />
        </div>
        <br />
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Number of Person's <span className='text-red-500'>*</span></Typography>
          <NumberOfPersons selectedRooms={selectedRooms} setFormData={setFormData} formData={formData} roomData={roomDetails} />
        </div>
        <br />

        <DropdownMenu name="Guest Type" data={formData.guestType} setData={setFormData} fieldName={"guestType"} menuItem={["DG", "DGB", "Online", "Corporate Guest"]} />
        <div className={`grid grid-cols-3 items-center mt-5 ${formData.guestType !== "Corporate Guest" && "hidden"}`}>
          <div />
          <div>
            <TextField label="Corporate Name" variant='outlined' sx={{ width: 300 }} value={formData.corporateName}
              onChange={(e) => setFormData(prevData => ({
                ...prevData,
                corporateName: e.target.value
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomDetails;