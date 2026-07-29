import { useEffect, useRef } from 'react';
import { Routes, Route } from "react-router-dom";
import RoomMap from './components/rooms/RoomMap';
import CheckIn from './components/checkin/CheckIn';
import CheckOut from './components/checkout/CheckOut';
import Dashboard from './components/dashboard/Dashboard';
import SignIn from './components/auth/SignIn';
import { useContextProvider } from './context/contextProvider';
import SignUp from './components/auth/SignUp';
import { ToastContainer, Bounce } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TestingCal from './components/TestingCal';
import { AdvanceBooking, AdvanceCalendar, DailyReports, GuestData, GuestDataTable, MaintananceAMC, RoomDetails, Account, Staff, Settings } from './components/additionals';
import EditAdvanceBooking from './components/additionals/advanceBooking/EditAdvanceBooking';
import GuestDetail from './components/dashboard/GuestDetail';
import RoomSelection from './components/Test';

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

const App = () => {
  const { isLoggedIn, setIsLoggedIn, handleLogOut } = useContextProvider();
  const inactivityTimer = useRef(null);

  // 15-minute auto-logout on inactivity
  useEffect(() => {
    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        handleLogOut();
        alert('You have been logged out due to 15 minutes of inactivity.');
      }, INACTIVITY_MS);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // start timer immediately

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const checkIsLoggedIn = async () => {
      // const valid = await verifyUserToken();
      const valid = await localStorage.getItem("userToken");

      if (valid === null) {
        console.log(valid);

        setIsLoggedIn(false);
        // setIsSessionExpired(true);
      }
    }
    checkIsLoggedIn();
  }, []);

  return (
    <div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ width: 400 }}
        transition={Bounce}
      />

      {
        !isLoggedIn ? (
          <div className='bg-primary/30 w-full min-h-screen flex flex-1 items-center justify-center'>
            <Routes>
              <Route path='/' element={<SignIn />} />
              <Route path='/sign-up' element={<SignUp />} />

              <Route path="*" element={<h1>Not Found</h1>} />
            </Routes>
          </div>
        ) : (

          <div className="font-roboto">
            {/* <Dialog
              open={isSessionExpired}
              disableEscapeKeyDown={true}
              onClose={(event, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                  event.stopPropagation();
                } else {
                  setIsSessionExpired(false);
                }
              }}
              aria-labelledby="session-expired-dialog-title"
              aria-describedby="session-expired-dialog-description"
            >
              <DialogTitle id="session-expired-dialog-title">Session Expired</DialogTitle>
              <DialogContent>
                <p>Your session has expired. Please log in again to continue.</p>
              </DialogContent>
              <DialogActions>
                <Button variant='outlined' onClick={() => { setIsSessionExpired(false); navigate("/"); }} color="success">
                  Log In
                </Button>
              </DialogActions>
            </Dialog> */}
            {/* <Header
              toggleDarkMode={toggleDarkMode}
              darkMode={darkMode}
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
            /> */}

            {/* <Sidebar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
            /> */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className=" bg-gray-400"> {/* mt-[4.5rem]*/}
                <div className='min-h-screen shadow-lg mx-3 rounded-md px-3 py-2'>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/room-map" element={<RoomMap />} />
                    <Route path="/check-in/:roomNum" element={<CheckIn />} />
                    <Route path="/check-out/:roomNum" element={<CheckOut />} />
                    <Route path="/guest-detail/:roomNum" element={<GuestDetail />} />
                    <Route path="/guest-data" element={<GuestDataTable />} />
                    <Route path="/guest-data/:booking_id" element={<GuestData />} />
                    <Route path="/advance-booking" element={<AdvanceBooking />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/edit-booking/:id" element={<EditAdvanceBooking />} />

                    <Route path="/maintananceAMC" element={<MaintananceAMC />} />
                    <Route path="/advanceCalendar" element={<AdvanceCalendar />} />
                    <Route path="/dailyReport" element={<DailyReports />} />
                    <Route path="/roomDetails" element={<RoomDetails />} />

                    <Route path="/test" element={<RoomSelection />} />

                    <Route path="*" element={<h1>Not Found</h1>} />
                  </Routes>
                </div>
              </div>
            </LocalizationProvider>
          </div>
        )
      }
    </div>
  )
}

export default App;