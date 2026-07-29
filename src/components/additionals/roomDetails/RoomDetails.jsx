import { Backdrop, Button, CircularProgress, Paper, Typography, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { columns, rows } from './constant';
import { useRole } from '../../../hooks/useRole';

const RoomDetails = () => {

  const navigate = useNavigate();
  const { canAccessRoomDetails } = useRole();
  const [isDataLoading, setIsDataLoading] = useState(false);

  if (!canAccessRoomDetails) {
    return (
      <div className='p-6 flex flex-col gap-4'>
        <Alert severity='error'>Access Denied. Room Details are only available to Admin users.</Alert>
        <Button variant='outlined' onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  return (
    <>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isDataLoading}>
        <div className="flex items-center justify-center gap-4">
          <CircularProgress />
          <span className="text-blue-500 text-xl font-bold">Loading...</span>
        </div>
      </Backdrop>

      <div className="bg-white my-2 px-5 py-4 rounded-lg shadow relative">
        <div className="bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between gap-10">
          <Typography className="text-white w-1/4" fontSize={25} fontWeight={500}>
            Room Details
          </Typography>
          <div className="flex items-center gap-4">
            <Button
              variant="contained"
              color="primary"
              sx={{ textTransform: "none" }}
              onClick={() => navigate("/")}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full items-center flex justify-center">
        <Paper sx={{ width: '85%', padding: 2, backgroundColor: '#fff', boxShadow: 3, borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableSelectionOnClick
            disableColumnResize
            disableColumnSorting
            hideFooter
            sx={{
              border: 0,
              '& .MuiDataGrid-row:hover': { backgroundColor: '#f0f0f0', cursor: 'pointer' },
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#000', color: '#333', fontSize: 15 },
              '& .MuiDataGrid-cell': { fontSize: 14, color: '#333' },
            }}
          />
        </Paper>
      </div>
    </>
  )
}

export default RoomDetails