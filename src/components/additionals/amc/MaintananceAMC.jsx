import { Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataGrid } from '@mui/x-data-grid'
import { columns, rows } from "./constantAMC";

const MaintananceAMC = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className="bg-white my-2 px-5 py-4 rounded-lg shadow relative">
        <div className="bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between gap-10">
          <Typography className="text-white w-1/4" fontSize={25} fontWeight={500}>
            Maintanance/AMC Data
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
  );
};

export default MaintananceAMC;