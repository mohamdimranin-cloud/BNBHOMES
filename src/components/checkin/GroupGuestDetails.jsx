import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel } from '@mui/material';

const GroupGuestDetails = () => {
  const [userRecords, setUserRecords] = useState([]); // State to hold user records
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to manage dialog visibility
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    phoneno: '',
    whatsapno: '',
    emailID: '',
    idType: '',
    idNo: '',
    idPhotoUrl: '',
    usePhoto: false,
    vehicleNo: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle dialog submit
  const handleSubmit = () => {
    setUserRecords((prev) => [...prev, { ...newUser, id: Date.now().toString() }]);
    setNewUser({
      id: '',
      name: '',
      phoneno: '',
      whatsapno: '',
      emailID: '',
      idType: '',
      idNo: '',
      idPhotoUrl: '',
      usePhoto: false,
      vehicleNo: '',
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">User Management</h1>

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setIsDialogOpen(true)}
      >
        + Add User
      </button>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          {['name', 'phoneno', 'whatsapno', 'emailID', 'idType', 'idNo', 'idPhotoUrl', 'vehicleNo'].map((field) => (
            <TextField
              key={field}
              margin="dense"
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              name={field}
              value={newUser[field]}
              onChange={handleChange}
              fullWidth
              variant="outlined"
            />
          ))}
          <FormControlLabel
            control={
              <Checkbox
                checked={newUser.usePhoto}
                onChange={handleChange}
                name="usePhoto"
              />
            }
            label="Use Photo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">User Records</h2>
        {userRecords.length > 0 ? (
          <ul className="list-disc pl-6">
            {userRecords.map((user) => (
              <li key={user.id} className="mb-2">
                {user.name} - {user.phoneno}
              </li>
            ))}
          </ul>
        ) : (
          <p>No users added yet.</p>
        )}
      </div>
    </div>
  );
};

export default GroupGuestDetails;