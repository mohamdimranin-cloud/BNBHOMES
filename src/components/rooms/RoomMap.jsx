import { Box, Typography } from '@mui/material'
import React from 'react'

const RoomMap = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <div className='shadow-md w-fit mt-2 mb-6 mx-3 py-1 px-4 rounded-md'>
        <Typography sx={{ fontSize: 24, fontWeight: 500 }} className='text-primary'>Rooms Map</Typography>
      </div>
    </Box>
  )
}

export default RoomMap