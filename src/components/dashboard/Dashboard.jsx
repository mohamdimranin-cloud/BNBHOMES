import { Alert, Backdrop, Button, Card, CircularProgress, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { calculateRoomStatus, calculateTotalStatusCount, flooreNames, roomStatusBg, sortData, StatusAndColor } from '../../constants/constants';
import { toast } from 'react-toastify';
import { CurrentDateTimeComp, CustomeRefreshBtn } from '../../common';
import { AdminPanelSettings, ExitToApp } from '@mui/icons-material';
import { useContextProvider } from '../../context/contextProvider';
import { roomApi } from '../../api/apiService';
import { useGlobalProvider } from '../../context/globalProvider';
import GuestDetailDialog from './GuestDetailDialog';
import ExtraChargesDialog from './ExtraChargesDialog';
import MoneyEntryDialog from './MoneyEntryDialog';
import ExtensionDialog from './ExtensionDialog';
import RoomShiftDialog from './RoomShiftDialog';
import AddGuestDialog from './AddGuestDialog';
import { useRole } from '../../hooks/useRole';

const Dashboard = () => {

  const navigate = useNavigate();
  const { handleLogOut } = useContextProvider();
  const { getGuestDataForTable } = useGlobalProvider();
  const { isAdmin, canAccessSettings, canAccessRoomDetails, role } = useRole();

  const [loggedUserName, setLoggedUserName] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [openDialog, setOpenDialog] = useState(null);
  const [activeRoomNum, setActiveRoomNum] = useState(null);

  const [roomData, setRoomData] = useState(null);
  const [roomStatusCount, setRoomStatusCount] = useState({ occupiedCount: 0, unOccupiedCount: 0 });
  const [statusCount, setStatusCount] = useState([]);
  const [isDataLoaded, setIsDataLoaded,] = useState(false);

  const handleMenuOpen = (event, room) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoom(room);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRoom(null);
  };

  const roomStatusOptions = (room) => {
    switch (room.status) {
      case 'Vacant':
        return (
          <div>
            <MenuItem onClick={() => { handleChangeRoomStatus({ room, roomStatus: "Cleaning Process" }); handleMenuClose(); }}>Further Cleaning</MenuItem>
            <MenuItem onClick={() => { handleChangeRoomStatus({ room, roomStatus: "Maintenance" }); handleMenuClose(); }}>Maintenance</MenuItem>
            <MenuItem onClick={() => navigate(`/check-in/${room.room_number}`)}>Check in</MenuItem>
          </div>
        );
      case 'Maintenance':
        return (
          <div>
            <MenuItem onClick={() => { handleChangeRoomStatus({ room, roomStatus: "Cleaning Process" }); handleMenuClose(); }}>Further Cleaning</MenuItem>
          </div>
        );
      case 'Just Occupied':
      case 'Stay Back':
      case 'Over Stay':
        return (
          <div>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('guestDetail'); handleMenuClose(); }}>Guest Detail</MenuItem>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('extraCharges'); handleMenuClose(); }}>Extra Charges</MenuItem>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('moneyEntry'); handleMenuClose(); }}>Money Entry</MenuItem>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('extension'); handleMenuClose(); }}>Extension</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate(`/check-out/${room.room_number}`); }}>Check Out</MenuItem>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('roomShift'); handleMenuClose(); }}>Room Shift</MenuItem>
            <MenuItem onClick={() => { setActiveRoomNum(room.room_number); setOpenDialog('addGuest'); handleMenuClose(); }}>Add Guest</MenuItem>
          </div>
        );
      case "Cleaning Process":
        return (
          <div>
            <MenuItem onClick={() => { handleChangeRoomStatus({ room, roomStatus: "Vacant" }); handleMenuClose(); }}>Vacant</MenuItem>
            <MenuItem onClick={() => { handleChangeRoomStatus({ room, roomStatus: "Maintenance" }); handleMenuClose(); }}>Maintenance</MenuItem>
          </div>
        )
      default:
        return <MenuItem>No Item is there</MenuItem>;
    }
  };

  // const fetchRoomData = async () => {
  //   try {
  //     setIsDataLoaded(true);
  //     const res = await roomApi.getAllRomms();
  //     if (res.status === 200) {
  //       const data = await res.data;
  //       const sortedData = sortData(data);
  //       setRoomData(sortedData);
  //       const { occupied, unoccupied } = calculateRoomStatus(sortedData);
  //       setRoomStatusCount({ occupiedCount: occupied, unOccupiedCount: unoccupied });
  //       setStatusCount(calculateTotalStatusCount(sortedData));
  //       setIsDataLoaded(false);
  //     }
  //   } catch (error) {
  //     setIsDataLoaded(false);
  //     console.log("Room Data fetch error: " + error);
  //     toast.error("Room Data fetch error");
  //   }
  // }

  const updateRoomStatusToStayBackCall = async (roomNum) => {
    try {
      await roomApi.updateRoomStatusToStayBack(roomNum);
    } catch (error) {
      console.error("Update to Stay Back Error: " + error);
    }
  }

  const updateRoomStatusToOverStayCall = async (roomNum) => {
    try {
      await roomApi.updateRoomStatusToOverStay(roomNum);
    } catch (error) {
      console.error("Update to Over Stay Error: " + error);
    }
  }

  const checkStayBackUserAndUpdateRoomStatus = async (currRoomData) => {
    if (!currRoomData) return;
    const justOccupiedRooms = Object.values(currRoomData)
      .map(floor =>
        floor?.filter(room => room?.status === "Just Occupied").map(room => room?.room_number)
      )
      .flat();

    if (justOccupiedRooms.length > 0) {
      justOccupiedRooms.map(item => updateRoomStatusToStayBackCall(item));
    }

    const stayBackRooms = Object.values(currRoomData)
      .map(floor =>
        floor?.filter(room => room?.status === "Stay Back").map(room => room?.room_number)
      )
      .flat();

    if (stayBackRooms.length > 0) {
      stayBackRooms.map(item => updateRoomStatusToOverStayCall(item));
    }
  }

  const fetchRoomData = async () => {
    try {
      const res = await roomApi.getAllRomms();
      if (res.status === 200) {
        const data = res.data;
        const sortedData = sortData(data);
        setRoomData(sortedData);
        const { occupied, unoccupied } = calculateRoomStatus(sortedData);
        setRoomStatusCount({ occupiedCount: occupied, unOccupiedCount: unoccupied });
        setStatusCount(calculateTotalStatusCount(sortedData));
        const username = localStorage.getItem("userToken");
        setLoggedUserName(username);
        return sortedData;
      }
    } catch (error) {
      console.log("Room Data fetch error: " + error);
      toast.error("Room Data fetch error");
    } finally {
      setIsDataLoaded(false);
    }
  };

  const fetchMethods = async () => {
    setIsDataLoaded(true);
    const res = await fetchRoomData();
    // Only run status updates once per session (store last-run date)
    const lastRun = sessionStorage.getItem('statusUpdateDate');
    const today = new Date().toDateString();
    if (res && lastRun !== today) {
      sessionStorage.setItem('statusUpdateDate', today);
      checkStayBackUserAndUpdateRoomStatus(res);
    }
    getGuestDataForTable();
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleChangeRoomStatus = async ({ room, roomStatus }) => {
    try {
      setIsDataLoaded(true);
      const updatedStatus = {
        "status": roomStatus
      }

      const res = await roomApi.updateRoomStatus(room.room_number, updatedStatus);

      if (res.status === 200) {
        await fetchRoomData();
        toast.success("Room Status updated successfully.");
      } else {
        toast.error("Update not done...");
      }
      setIsDataLoaded(false);
    } catch (error) {
      setIsDataLoaded(false);
      console.log("Room Status Update error: " + error);
      toast.error("Room Status Update error");
    }
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
        open={isDataLoaded}
      >
        <div className='flex items-center justify-center gap-4'>
          <CircularProgress />
          <span className='text-blue-500 text-xl font-bold'>Loading...</span>
        </div>
      </Backdrop>

      <div className='flex flex-col gap-2'>
        <Card className='px-5 py-3 w-full flex items-start justify-between'>
          <div className='flex flex-col items-center'>
            <CustomeRefreshBtn clickEvent={fetchMethods} />
            <CurrentDateTimeComp />
          </div>
          <div className='flex gap-2 items-start'>
            <table className=''>
              <tbody>
                {
                  StatusAndColor.slice(0, 5).map(item => (
                    <tr key={item.label}>
                      <td className={`h-9 w-20 ${item.bgColor} border border-black text-center`}>{statusCount[item.label]}</td>
                      <td className='border border-black text-primary pl-3 pr-7 '>{item.label}</td>
                    </tr>
                  ))
                }
                <tr>
                  <td className='h-9 w-20 text-center'>{roomStatusCount.occupiedCount}</td>
                  <td className='pl-3 pr-7'>Occupied</td>
                </tr>
              </tbody>
            </table>
            <table className=''>
              <tbody>
                {
                  StatusAndColor.slice(5, 10).map(item => (
                    <tr key={item.label}>
                      <td className={`h-9 w-20 ${item.bgColor} border border-black text-center`}>{statusCount[item.label]}</td>
                      <td className='border border-black text-primary pl-3 pr-7 '>{item.label}</td>
                    </tr>
                  ))
                }
                <tr><td className='h-9'></td><td></td></tr>
                <tr><td className='h-9'></td><td></td></tr>
                <tr>
                  <td className='h-9 w-20 text-center'>{roomStatusCount.unOccupiedCount}</td>
                  <td className='pl-3 pr-7'>Un Occupied</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className='flex flex-col items-start justify-start gap-3 mr-5'>
            <div className='flex items-center gap-2 text-primary'>
              <AdminPanelSettings titleAccess='Time' />
              <Typography>Login Name: <span className='text-lg font-bold'>{loggedUserName}</span></Typography>
            </div>
            <div className='flex items-center gap-2 text-primary'>
              <Typography variant='caption' className='bg-primary text-white px-2 py-0.5 rounded capitalize'>{role}</Typography>
            </div>
            <div className='w-full flex items-center gap-1 text-primary'>
              <Button
                color='error'
                variant='contained'
                className='!w-full'
                sx={{ textTransform: "none" }}
                startIcon={
                  <ExitToApp titleAccess='Logout' />
                }
                onClick={() => { handleLogOut(); navigate("/"); }}
              >
                <Typography>Logout</Typography>
              </Button>
            </div>
          </div>
        </Card>

        <Card className='flex items-center justify-center overflow-hidden'>
          {
            roomData ? (
              <div className='w-full px-4 py-4'>
                <div className='flex flex-col-reverse gap-2'>
                  {
                    Object.keys(roomData).map((floor, idx) => (
                      <div className='flex items-center border px-3 py-2 rounded-md w-full min-h-[5rem]' key={idx}>
                        <Typography className='w-28 min-w-[7rem] text-primary shrink-0' fontSize={15} fontWeight={500}>{flooreNames[idx]}</Typography>
                        <div className='flex items-center flex-wrap gap-x-4 gap-y-2'>
                          {
                            roomData[floor]?.map((room, idx1) => (
                              <div key={idx1}>
                                <div className='flex flex-col items-center justify-center cursor-pointer' onClick={(e) => handleMenuOpen(e, room)}>
                                  <Tooltip title={room?.status} arrow>
                                    {roomStatusBg(room?.status, room?.room_number)}
                                  </Tooltip>
                                  <span className='text-[13px] text-primary text-center'>{room?.room_type}</span>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    ))
                  }
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                  >
                    {selectedRoom && roomStatusOptions(selectedRoom)}
                  </Menu>
                </div>
              </div>
            ) : (
              <div className='py-5 text-gray-400 cursor-default'>
                No Room Data found
              </div>
            )
          }
        </Card >

        <Card className='flex flex-col items-center justify-center gap-10 py-5'>
          <div className='overflow-x-scroll w-full flex items-center justify-center gap-10'>
            <div className='flex flex-col items-center justify-center gap-4'>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/advance-booking")}>Advance Booking</Button>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/advanceCalendar")}>Advance Calendar</Button>
            </div>
            <div className='flex flex-col items-center justify-center gap-4'>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/account")}>Account</Button>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/guest-data")}>Guest Data</Button>
            </div>
            <div className='flex flex-col items-center justify-center gap-4'>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/dailyReport")}>Daily Reports</Button>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/maintananceAMC")}>Maintenance/AMC</Button>
            </div>
            <div className='flex flex-col items-center justify-center gap-4'>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="primary" onClick={() => navigate("/staff")}>Staff Details</Button>
              <div className='h-10 w-full' />
            </div>
            <div className='flex flex-col items-center justify-center gap-4'>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="warning" onClick={() => navigate("/settings")} disabled={!canAccessSettings}>Settings</Button>
              <Button className="w-full" sx={{ textTransform: "none" }} variant="contained" color="warning" onClick={() => navigate("/roomDetails")} disabled={!canAccessRoomDetails}>Room Details</Button>
            </div>
          </div>

          <div className='flex items-center text-center'>
            <Alert severity="warning" sx={{ fontWeight: 500 }}>Emergency Alarm Number: <span className='text-red-500 font-extrabold'>1223456</span></Alert>
          </div>
        </Card>
      </div>

      {/* Room action dialogs */}
      <GuestDetailDialog
        open={openDialog === 'guestDetail'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
      />
      <ExtraChargesDialog
        open={openDialog === 'extraCharges'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
        onSuccess={fetchRoomData}
      />
      <MoneyEntryDialog
        open={openDialog === 'moneyEntry'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
        onSuccess={fetchRoomData}
      />
      <ExtensionDialog
        open={openDialog === 'extension'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
        onSuccess={fetchRoomData}
      />
      <RoomShiftDialog
        open={openDialog === 'roomShift'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
        onSuccess={fetchRoomData}
      />
      <AddGuestDialog
        open={openDialog === 'addGuest'}
        onClose={() => setOpenDialog(null)}
        roomNum={activeRoomNum}
        onSuccess={fetchRoomData}
      />
    </>
  )
}

export default Dashboard