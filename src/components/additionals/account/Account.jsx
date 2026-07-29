import React, { useState } from 'react';
import { Tab, Tabs, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ExpenseEntry from './ExpenseEntry';
import PendingPayments from './PendingPayments';
import InvoiceGeneration from './InvoiceGeneration';
import AccountBalance from './AccountBalance';
import CreditCard from './CreditCard';
import GuestReturn from './GuestReturn';
import TransactionReport from './TransactionReport';

const TABS = [
  { label: 'Expense Entry',       component: ExpenseEntry },
  { label: 'Pending Payments',    component: PendingPayments },
  { label: 'Invoice',             component: InvoiceGeneration },
  { label: 'Account Balance',     component: AccountBalance },
  { label: 'Credit Card',         component: CreditCard },
  { label: 'Guest Return',        component: GuestReturn },
  { label: 'Transaction Report',  component: TransactionReport },
];

const Account = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const ActiveComponent = TABS[tab].component;

  return (
    <>
      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow'>
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between'>
          <Typography className='text-white' fontSize={25} fontWeight={500}>Accounts</Typography>
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

export default Account;
