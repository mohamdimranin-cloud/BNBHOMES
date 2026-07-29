import React, { useEffect, useState } from 'react';
import { Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select, Tab, Tabs, TextField, Typography, Alert } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { settingsApi } from '../../../api/apiService';

const userRole = () => localStorage.getItem('userRole') || 'employee';

// Generic list manager for a settings category
const SettingsList = ({ category, title, defaultItems }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [adding, setAdding] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getItems(category);
      if (res.status === 200) {
        const dbItems = res.data || [];
        // Merge default items (show them even if not in DB yet)
        const dbValues = dbItems.map(i => i.value);
        const merged = [...dbItems];
        (defaultItems || []).forEach(d => {
          if (!dbValues.includes(d)) merged.unshift({ id: null, value: d, label: d, isDefault: true });
        });
        setItems(merged);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [category]);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setAdding(true);
    try {
      const res = await settingsApi.addItem({ category, value: newValue.trim(), label: newValue.trim() });
      if (res.status === 200 || res.status === 201) {
        toast.success('Added');
        setNewValue('');
        fetch();
      }
    } catch (e) { toast.error('Error adding'); }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!id) { toast.info('Default items cannot be deleted'); return; }
    try {
      await settingsApi.deleteItem(id);
      toast.success('Removed');
      fetch();
    } catch (e) { toast.error('Error'); }
  };

  return (
    <div className='border rounded-lg p-4 mb-4'>
      <Typography variant='subtitle2' fontWeight={700} className='mb-3'>{title}</Typography>
      <div className='flex flex-wrap gap-2 mb-3'>
        {loading ? <CircularProgress size={20} /> : items.map((item, idx) => (
          <Chip
            key={idx}
            label={item.label || item.value}
            onDelete={userRole() === 'admin' ? () => handleDelete(item.id) : undefined}
            deleteIcon={<Delete fontSize='small' />}
            variant={item.isDefault ? 'outlined' : 'filled'}
            color={item.isDefault ? 'default' : 'primary'}
          />
        ))}
        {items.length === 0 && !loading && <span className='text-gray-400 text-sm'>No items</span>}
      </div>
      {userRole() === 'admin' && (
        <div className='flex gap-2 items-center'>
          <TextField size='small' placeholder={'Add new ' + title.toLowerCase()} value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <Button variant='contained' size='small' startIcon={adding ? <CircularProgress size={14} /> : <Add />}
            onClick={handleAdd} disabled={adding || !newValue.trim()}>Add</Button>
        </div>
      )}
    </div>
  );
};

const BOOKING_REFS_DEFAULT = ['Direct Check in', 'Direct Advance', 'Booking.com', 'MMT'];

// User Management (admin only)
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'employee' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getUsers();
      if (res.status === 200) setUsers(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.username.trim() || !form.password.trim()) { toast.warn('Username and password required'); return; }
    setSaving(true);
    try {
      const res = await settingsApi.createUser(form);
      if (res.status === 200 || res.status === 201) {
        toast.success('User created'); setOpen(false);
        setForm({ username: '', password: '', role: 'employee' }); fetch();
      } else if (res.response && res.response.status === 409) {
        toast.error('Username already exists — choose a different username');
      } else {
        toast.error('Failed to create user');
      }
    } catch (e) { toast.error('Error creating user'); }
    setSaving(false);
  };

  const handleDelete = async (id, uname) => {
    if (uname === 'admin') { toast.error('Cannot delete the admin user'); return; }
    if (!window.confirm('Delete user ' + uname + '?')) return;
    try { await settingsApi.deleteUser(id); toast.success('User deleted'); fetch(); } catch (e) { toast.error('Error'); }
  };

  const ROLE_COLORS = { admin: 'error', account: 'warning', audit: 'info', employee: 'default' };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between items-center'>
        <Typography variant='subtitle1' fontWeight={700}>User Management</Typography>
        <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)}>Add User</Button>
      </div>
      {loading ? <CircularProgress /> : (
        <table className='w-full text-sm border rounded-lg'>
          <thead className='bg-gray-100'>
            <tr>{['Username', 'Role', ''].map(h => <th key={h} className='text-left py-2 px-3'>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className='border-t'>
                <td className='py-2 px-3 font-medium'>{u.username}</td>
                <td className='py-2 px-3'>
                  <Chip label={u.role} size='small' color={ROLE_COLORS[u.role] || 'default'} />
                </td>
                <td className='py-2 px-3'>
                  <IconButton size='small' color='error' onClick={() => handleDelete(u.id, u.username)}>
                    <Delete fontSize='small' />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent className='flex flex-col gap-3 pt-2'>
          <TextField size='small' label='Username' value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} fullWidth />
          <TextField size='small' label='Password' type='password' value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} fullWidth />
          <FormControl size='small' fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label='Role' value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <MenuItem value='admin'>Admin</MenuItem>
              <MenuItem value='account'>Account</MenuItem>
              <MenuItem value='audit'>Audit</MenuItem>
              <MenuItem value='employee'>Employee</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreate} disabled={saving}>{saving ? <CircularProgress size={18} /> : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};const EXPENSE_CATS_DEFAULT = ['Vendor Payment', '20 Ltr Bottle', 'Bislery Water', 'Breakfast', 'GST', 'Booking.com', 'Laundry', 'Services', 'KSEB', 'Corporation Water', 'Petty Cash', 'Cleaner Food', 'HNG Items', 'Care 4 Items', 'Auditor', 'Weekly Incentive', 'Staff Salary'];
const ALERT_TYPES_DEFAULT = ['Cleaning Report', 'All Reports', 'AMC Reports'];
const MATERIAL_ITEMS_DEFAULT = [];
const LAUNDRY_ITEMS_DEFAULT = [];
const BREAKFAST_ITEMS_DEFAULT = [];

const TABS = [
  { label: 'Booking References', category: 'booking_ref',       defaults: BOOKING_REFS_DEFAULT,   title: 'Booking Reference Types',    component: null },
  { label: 'Expense Categories', category: 'expense_category',  defaults: EXPENSE_CATS_DEFAULT,   title: 'Expense Entry Categories',   component: null },
  { label: 'Alerts',             category: 'alert_type',        defaults: ALERT_TYPES_DEFAULT,    title: 'Alert Types',                component: null },
  { label: 'Material Stock',     category: 'material_stock',    defaults: MATERIAL_ITEMS_DEFAULT, title: 'Material Stock Items',       component: null },
  { label: 'Laundry Items',      category: 'laundry_item',      defaults: LAUNDRY_ITEMS_DEFAULT,  title: 'Laundry Items',              component: null },
  { label: 'Breakfast Items',    category: 'breakfast_item',    defaults: BREAKFAST_ITEMS_DEFAULT, title: 'Breakfast Items',           component: null },
  { label: 'User Management',    category: null,                defaults: [],                     title: 'User Management',            component: UserManagement },
];

const Settings = () => {
  const navigate = useNavigate();
  const role = userRole();
  const [tab, setTab] = useState(0);

  if (role === 'employee') {
    return (
      <div className='p-6'>
        <Alert severity='error'>Access Denied. Settings are only available to Admin and Account/Audit users.</Alert>
        <Button className='mt-4' variant='outlined' onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  const activeTab = TABS[tab];

  return (
    <>
      <div className='bg-white my-2 px-5 py-4 rounded-lg shadow'>
        <div className='bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between'>
          <Typography className='text-white' fontSize={25} fontWeight={500}>Settings</Typography>
          <Button variant='contained' color='primary' sx={{ textTransform: 'none' }} onClick={() => navigate('/')}>
            Go Back
          </Button>
        </div>
      </div>

      {role !== 'admin' && (
        <Alert severity='info' className='mb-2'>You have read-only access to settings. Contact Admin to add/remove items.</Alert>
      )}

      <div className='bg-white rounded-lg shadow mb-2'>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant='scrollable' scrollButtons='auto'
          sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {TABS.map((t, i) => <Tab key={i} label={t.label} sx={{ textTransform: 'none', fontWeight: 500 }} />)}
        </Tabs>
      </div>

      <div className='bg-white rounded-lg shadow p-4'>
        {activeTab.component ? (
          <activeTab.component />
        ) : (
          <SettingsList
            key={activeTab.category}
            category={activeTab.category}
            title={activeTab.title}
            defaultItems={activeTab.defaults}
          />
        )}
      </div>
    </>
  );
};

export default Settings;
