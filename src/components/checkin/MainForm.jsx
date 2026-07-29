import React, { useEffect } from 'react'
import { Attachment, GuestAndBreakfastDetails, PaymentDetails, RoomDetails } from './index';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const MainForm = ({ activeStep, formData, setFormData }) => {

  const handleCheckInSubmit = (e) => {
    e.preventDefault();

    console.log(formData);    
  }

  useEffect(() => { 
    window.scrollTo(0, 0);
  }, [activeStep]);

  return (
    <div className='bg-white my-2 p-2 rounded-lg shadow'>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form onSubmit={handleCheckInSubmit}>
          {
            activeStep === 0 ? (
              <RoomDetails formData={formData} setFormData={setFormData} />
            ) : activeStep === 1 ? (
              <GuestAndBreakfastDetails formData={formData} setFormData={setFormData} />
            ) : activeStep === 2 ? (
              <PaymentDetails formData={formData} setFormData={setFormData} />
            ) : activeStep === 3 ? (
              <Attachment formData={formData} setFormData={setFormData} />
            ) : <RoomDetails formData={formData} setFormData={setFormData} />
          }
        </form>
      </LocalizationProvider>
    </div>
  )
}

export default MainForm