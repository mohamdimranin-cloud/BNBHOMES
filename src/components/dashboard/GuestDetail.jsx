import { Backdrop, Box, Button, Card, CardContent, CircularProgress, Divider, Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { roomApi } from '../../api/apiService';

const GuestDetail = () => {

  const navigate = useNavigate();

  const { roomNum } = useParams();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [guestDetails, setGuestDetails] = useState(null);

  useEffect(() => {
    const fetchGuestDetail = async () => {
      try {
        setIsDataLoading(true);
        const res = await roomApi.getGuestDetailByRoomNum(roomNum);

        if (res.status === 200) {
          if (res.data.length === 0) {
            console.log("No data found");
          } else {
            setGuestDetails(res.data[0]);
          }
        }
        setIsDataLoading(false);
      } catch (error) {
        console.error("Guest Details Fetch Error: " + error);
      }
    }

    fetchGuestDetail();
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
          <Typography className='text-white w-1/4' fontSize={25} fontWeight={500}>Guest Detail</Typography>

          <Button variant='contained' color='primary' className='right-0' sx={{ textTransform: "none" }} onClick={() => navigate("/")}>Go Back</Button>
        </div>
      </div >

      {
        (!isDataLoading && guestDetails) && (
          <div className="container mx-auto p-4">
            <Card className="shadow-lg rounded-lg overflow-hidden">
              <CardContent>
                <Typography variant="h4" className="text-center mb-6 font-semibold">
                  Guest Details for Room {roomNum}
                </Typography>

                {/* Guest Info */}
                <Box className="mb-6">
                  <Typography variant="h6" className="text-lg font-medium mb-3">Guest Information</Typography>
                  <Divider className="mb-3" />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Name:</strong> {guestDetails.guest.name}</Typography>
                      <Typography><strong>Mobile:</strong> {guestDetails.guest.mobile_no}</Typography>
                      {guestDetails.guest.whatsapp_no && <Typography><strong>WhatsApp:</strong> {guestDetails.guest.whatsapp_no}</Typography>}
                      {guestDetails.guest.email_id && <Typography><strong>Email:</strong> {guestDetails.guest.email_id}</Typography>}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>ID Type:</strong> {guestDetails.guest.id_type}</Typography>
                      <Typography><strong>ID No:</strong> {guestDetails.guest.id_no}</Typography>
                      {guestDetails.guest.vehicle_type && <Typography><strong>Vehicle:</strong> {guestDetails.guest.vehicle_type} {guestDetails.guest.vehicle_no}</Typography>}
                    </Grid>
                  </Grid>
                </Box>

                {/* Booking Info */}
                <Box className="mb-6">
                  <Typography variant="h6" className="text-lg font-medium mb-3">Booking Information</Typography>
                  <Divider className="mb-3" />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Booking ID:</strong> {guestDetails.booking.id}</Typography>
                      <Typography><strong>Guest Type:</strong> {guestDetails.booking.guest_type}</Typography>
                      <Typography><strong>Total Rooms:</strong> {guestDetails.booking.num_of_rooms}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Check-in:</strong> {new Date(guestDetails.booking.checkInDate).toLocaleDateString()}</Typography>
                      <Typography><strong>Check-out:</strong> {new Date(guestDetails.booking.checkOutDate).toLocaleDateString()}</Typography>
                      <Typography><strong>Payment Method:</strong> {guestDetails.booking.payment_method}</Typography>
                      <Typography><strong>Status:</strong> {guestDetails.booking.booking_status}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Occupancy Info */}
                <Box className="mb-6">
                  <Typography variant="h6" className="text-lg font-medium mb-3">Occupancy Details</Typography>
                  <Divider className="mb-3" />
                  {guestDetails.guestOccupancy.map((occupancy, index) => (
                    <Box key={index} className="mb-3">
                      <Typography><strong>Room {occupancy.room_number}:</strong> {occupancy.num_of_adults} Adults, {occupancy.num_of_children} Children</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Selected Rooms */}
                <Box className="mb-6">
                  <Typography variant="h6" className="text-lg font-medium mb-3">Selected Rooms</Typography>
                  <Divider className="mb-3" />
                  {guestDetails.selectedRooms.map((room, index) => (
                    <Typography key={index}>{room}</Typography>
                  ))}
                </Box>

                {/* Room Bed Types */}
                <Box className="mb-6">
                  <Typography variant="h6" className="text-lg font-medium mb-3">Room Bed Types</Typography>
                  <Divider className="mb-3" />
                  {guestDetails.roomBedTypes.map((bedType, index) => (
                    <Typography key={index}>Room {bedType.room_number}: {bedType.bed_type}</Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </div>
        )
      }

    </>
  )
}

export default GuestDetail