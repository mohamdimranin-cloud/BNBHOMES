import { Button, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { addtionalApi } from '../../../api/apiService';

const AdvanceBookingTable = () => {

  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("check_in_date");
  const [filterValue, setFilterValue] = useState("");

  const handleEdit = (id) => {
    navigate(`/edit-booking/${id}`);
  };

  const filterOptions = [
    { value: "check_in_date",  label: "Check-in Date",  type: "date" },
    { value: "check_out_date", label: "Check-out Date", type: "date" },
    { value: "guest_name",     label: "Guest Name",     type: "text" },
    { value: "guest_mobile",   label: "Contact Number", type: "text" },
    { value: "room_type",      label: "Room Type",      type: "text" },
  ];

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
    setFilterValue("");
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!filterValue) return true;
    const val = (booking[selectedFilter] ?? '').toString().toLowerCase();
    return val.includes(filterValue.toLowerCase());
  });

  const columns = [
    { field: "booking_ref",    headerName: "Booking Ref",    flex: 0.8 },
    { field: "check_in_date",  headerName: "Check-in Date",  flex: 0.9 },
    { field: "check_out_date", headerName: "Check-out Date", flex: 0.9 },
    { field: "number_of_nights", headerName: "Nights",       flex: 0.5 },
    { field: "guest_type",     headerName: "Guest Type",     flex: 0.6 },
    { field: "guest_name",     headerName: "Guest Name",     flex: 1 },
    { field: "guest_mobile",   headerName: "Contact",        flex: 0.9 },
    { field: "room_type",      headerName: "Room Type",      flex: 0.7 },
    { field: "number_of_rooms", headerName: "Rooms",         flex: 0.5 },
    { field: "rate_per_room",  headerName: "Rate/Room",      flex: 0.7 },
    { field: "total_amount",   headerName: "Total Amount",   flex: 0.7 },
    { field: "advance_amount", headerName: "Advance",        flex: 0.7 },
    { field: "balance_amount", headerName: "Balance",        flex: 0.7 },
    { field: "remarks",        headerName: "Remarks",        flex: 1, renderCell: (params) => params.value || "-" },
    {
      field: "edit",
      headerName: "Edit",
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <Button variant="contained" color="primary" size="small" onClick={() => handleEdit(params.row.id)}>
          Edit
        </Button>
      ),
    },
  ];

  useEffect(() => {
    const fetchAdvanceBooking = async () => {
      try {
        const res = await addtionalApi.getAllAdvanceBookings();
        if (res.status === 200) {
          setBookings(res.data ?? []);
        }
      } catch (error) {
        console.error("Advance Booking Table Fetch error: " + error);
      }
    };
    fetchAdvanceBooking();  // ← was declared but never called
  }, []);

  return (
    <Paper className="p-4 shadow-lg my-4 !rounded-lg">
      <div className="mb-4 flex items-center gap-4">
        <Select value={selectedFilter} onChange={handleFilterChange} size="small" className='w-60'>
          {filterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>

        <TextField
          fullWidth
          size="small"
          type={filterOptions.find((opt) => opt.value === selectedFilter)?.type || "text"}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          placeholder={`Filter by ${filterOptions.find((opt) => opt.value === selectedFilter)?.label}`}
        />
      </div>

      <DataGrid
        rows={filteredBookings}
        columns={columns}
        autoHeight
        pageSizeOptions={[5, 10, 20]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        rowCount={filteredBookings.length}
        disableColumnMenu
        disableSelectionOnClick
        getRowId={(row) => row.id}
      />
    </Paper>
  )
}

export default AdvanceBookingTable