import {
  Backdrop,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid'
import { useGlobalProvider } from "../../../context/globalProvider";

const columns = [
  { field: 'id', headerName: 'Booking ID', flex: 1, minWidth: 100, headerAlign: 'center', align: 'center' },
  { field: 'guest_name', headerName: 'Guest Name', flex: 1, minWidth: 200 },
  { field: 'email_id', headerName: 'Email Address', flex: 1, minWidth: 200 },
  { field: 'check_in_date', headerName: 'Check-In Date', flex: 1, minWidth: 150 },
  { field: 'check_out_date', headerName: 'Check-Out Date', flex: 1, minWidth: 150 },
  { field: 'booking_status', headerName: 'Booking Status', flex: 1, minWidth: 130 },
];

const paginationModel = { page: 0, pageSize: 10 };

const GuestDataTable = () => {
  const navigate = useNavigate();

  const { guestDataList, isDataLoading } = useGlobalProvider();

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
            All Guest Data
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

      {guestDataList && (
        <Paper sx={{ height: 'calc(100vh - 140px)', width: '100%', padding: 2, backgroundColor: '#fff', boxShadow: 3, borderRadius: 2 }}>
          <DataGrid
            rows={guestDataList}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[10, 20, 50, 100]}
            disableSelectionOnClick
            disableColumnResize
            onRowClick={(params) => navigate(`/guest-data/${params.row.id}`)}
            sx={{
              border: 0,
              '& .MuiDataGrid-row:hover': { backgroundColor: '#f0f0f0', cursor: 'pointer' },
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#000', color: '#333', fontSize: 15 },
              '& .MuiDataGrid-cell': { fontSize: 14, color: '#333' },
            }}
          />
        </Paper>
      )
      }
    </>
  );
};

export default GuestDataTable;
