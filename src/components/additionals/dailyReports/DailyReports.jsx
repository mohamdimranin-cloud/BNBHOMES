import { Backdrop, Button, CircularProgress, Paper, Typography } from '@mui/material'
import { DataGrid, } from '@mui/x-data-grid';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'


const DailyReports = () => {

  const navigate = useNavigate();

  const [isDataLoading, setIsDataLoading] = useState(false);

  const columns = [
    { field: "id", headerName: "Sl.No", width: 100, align: "center", headerAlign: 'center'},
    { field: "report", headerName: "BnB Daily Reports", flex: 2 },
    { field: "period", headerName: "Period", flex: 1 },
    { field: "time", headerName: "Time", flex: 1 },
    { field: "auditing", headerName: "Auditing", flex: 1 },
  ];

  const rows = [
    { id: 1, report: "Room Service Report", period: "Every Day", time: "10:00 AM", auditing: "" },
    { id: 2, report: "Guest Arrival Report", period: "Every Day", time: "11:00 AM", auditing: "" },
    { id: 3, report: "Updated Service Report", period: "Every Day", time: "6:00 PM", auditing: "" },
    { id: 4, report: "Updated Service Report", period: "Every Day", time: "6:00 PM", auditing: "" },
    { id: 5, report: "Guest Requests Report", period: "Every Day", time: "11:00 AM", auditing: "" },
  ];

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
            Daily Reports
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

export default DailyReports