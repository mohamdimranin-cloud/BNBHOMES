import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useNavigate } from 'react-router-dom';

const AlertDialog = ({ isAlerDialogtOpen, setIsAlerDialogtOpen, dialogTitle, dialogDescription }) => {

  const navigate = useNavigate();

  const handleClose = () => {
    setIsAlerDialogtOpen(false);
    navigate("/");
  };

  return (
    <Dialog
      color='error'
      disableEscapeKeyDown={true}
      open={isAlerDialogtOpen}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          event.stopPropagation();
        } else {
          handleClose();
        }
      }}
    >
      <DialogTitle>
        {dialogTitle}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {dialogDescription}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>

  )
}

export default AlertDialog