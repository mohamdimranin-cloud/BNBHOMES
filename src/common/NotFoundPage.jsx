import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react'
import { useNavigate } from 'react-router-dom';

const NotFoundPage = ({ isNotFound, setIsNotFound }) => {
  const navigate = useNavigate();
  return (
    <div>
      <Dialog
        open={isNotFound}
        disableEscapeKeyDown={true}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            event.stopPropagation();
          } else {
            setIsNotFound(false);
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
          <Button variant='outlined' onClick={() => { setIsNotFound(false); navigate("/sign-in"); }} color="success">
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default NotFoundPage