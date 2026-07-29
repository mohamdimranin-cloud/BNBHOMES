import { Button, Dialog } from '@mui/material';
import { Fragment, useState, useRef } from 'react'
import CheckInReceipt from '../../common/CheckInReceipt';
import ReactToPrint from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { useContextProvider } from '../../context/contextProvider';
import { Save } from '@mui/icons-material';

const Attachment = ({ formData, handleClear, btnDisable, boockingId }) => {
  const [open, setOpen] = useState(false);

  const { isSavingCheckIn } = useContextProvider();
  
  const navigate = useNavigate();

  const componentRef = useRef();

  const handleClosecheckIn = () => {
    localStorage.removeItem("userImg");
    handleClear();
    navigate("/");
  }

  return (
    <>
      <div className='mb-5 mt-8 mx-1 flex flex-col md:flex-row  items-center justify-center gap-10'>
        <div className='flex items-center justify-center gap-10'>
          <Button
            type='submit'
            className='w-fit'
            variant="contained"
            disabled={btnDisable || isSavingCheckIn}
            loading={isSavingCheckIn}
            loadingPosition='start'
            startIcon={<Save />}
          >
            {
              isSavingCheckIn ? "Saving.." : btnDisable ? "Saved" : "Save"
            }
          </Button>
          <Button type='button' className='w-fit' variant="contained" onClick={() => setOpen(true)}>
            Receipt Preview
          </Button>
        </div>
        <div className='flex items-center justify-center gap-10'>
          <Button type='button' className='w-fit' variant="contained">
            Share /Confirm Check in
          </Button>
          <Button type='button' className='w-fit' variant="contained" onClick={handleClosecheckIn}>
            Close Check in
          </Button>
        </div>
      </div>

      <Fragment>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="lg"
        >
          <CheckInReceipt formData={formData} ref={componentRef} boockingId={boockingId} />

          <div className='pt-2 pb-4 flex justify-center'>
            <ReactToPrint
              trigger={() =>
                <Button
                  variant='contained'
                  className='w-fit'
                >Print Receipt</Button>
              }
              content={() => componentRef.current}
              documentTitle={`CheckInReceipt-${formData.bookingRef}`}
              onAfterPrint={() => setOpen(false)}
            />
          </div>
        </Dialog>
      </Fragment >
    </>
  )
}

export default Attachment