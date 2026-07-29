import React, { useState } from 'react';
import { Tab, Tabs, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StaffDetails from './StaffDetails';
import DutySchedule from './DutySchedule';
import StaffSalary from './StaffSalary';
import CleanerSalary from './CleanerSalary';

const TABS = [
  { label: 'Staff Details',    component: StaffDetails },
  { label: 'Duty Schedule',    component: DutySchedule },
  { label: 'Salary & Payslip', component: StaffSalary },
  { label: 'Cleaner Salary',   component: CleanerSalary },
];

const Staff = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const ActiveComponent = TABS[tab].component;

  return (
    <>
      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow'>
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between'>
          <Typography className='text-white' fontSize={25} fontWeight={500}>Staff Management</Typography>
          <Button variant='contained' color='primary' sx={{ textTransform: 'none' }} onClick={() => navigate('/')}>
            Go Back
          </Button>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow mb-2'>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map((t, i) => (
            <Tab key={i} label={t.label} sx={{ textTransform: 'none', fontWeight: 500 }} />
          ))}
        </Tabs>
      </div>

      <div className='bg-white rounded-lg shadow p-4'>
        <ActiveComponent />
      </div>
    </>
  );
};

export default Staff;
