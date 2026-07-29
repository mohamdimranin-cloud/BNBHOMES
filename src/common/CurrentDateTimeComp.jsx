import { AccessTime, Event } from '@mui/icons-material'
import { Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'

const CurrentDateTimeComp = () => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}-${now.getFullYear()}`;

      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setDate(formattedDate);
      setTime(formattedTime);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className='flex flex-col items-start gap-3 my-5'>
      <div className='flex items-center gap-2 text-primary'>
        <Event titleAccess='Date' />
        <Typography>Date: {date}</Typography>
      </div>
      <div className='flex items-center gap-2 text-primary'>
        <AccessTime titleAccess='Time' />
        <Typography>Time: {time}</Typography>
      </div>
    </div>
  )
}

export default CurrentDateTimeComp