import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../../assets/index';
import { Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tab, Tabs } from '@mui/material';
import { AccountCircle, Logout, Settings } from '@mui/icons-material';
import { useContextProvider } from '../../context/contextProvider';
import NavLinks from '../../constants/NavLinks';

const Header = ({ darkMode, toggleDarkMode, toggleSidebar, isSidebarOpen }) => {

  const { pathname } = useLocation();
  const { handleLogOut } = useContextProvider();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [navLink, setNavLink] = useState(0);

  return (
    <nav className='fixed top-0 z-50 w-full bg-white border-b border-t-gray-200 dark:bg-gray-800 dark:border-gray-700'>
      <div className='px-3 py-4 lg:px-5 lg:pl-3'>
        <div className='flex items-center justify-between gap-10'>
          <div className='flex items-center justify-start'>
            <Link to="/" className='flex gap-2 bg-white px-3 rounded-lg'>
              <img src={Logo} alt="Lgog" className='w-11 h-11' />
              <span className='self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-primary'>
                BnB Homes
              </span>
            </Link>
          </div>

          <div className="w-full">
            <ul className="flex items-center justify-center gap-10">
              {
                NavLinks.map(({ route, icon: Icon, title }, idx) => (
                  <li key={idx}>
                    <Link
                      to={route}
                      className={`relative group ${pathname === route ? "text-primary font-bold" : "text-blue-400"}`}
                    >
                      <span>{title}</span>
                      {pathname === route && (
                        <span className="absolute top-5 left-0 bottom-0 w-full h-0.5 bg-current rounded-full group-hover:h-1 transition-all"></span>
                      )}
                    </Link>
                  </li>
                ))
              }
            </ul>
          </div>

          <Fragment>
            <IconButton
              onClick={handleClick}
              size='small'
            >
              {/* <img src={Prof} alt="" /> */}
              <Avatar sx={{ width: 32, height: 32 }}>T</Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              {/* <MenuItem onClick={() => { handleClose(); toggleDarkMode(); }}>
                <ListItemIcon>
                  {darkMode ? <FaSun /> : <FaMoon />}
                </ListItemIcon>
                {!darkMode ? "Dark Mode" : "Light Mode"}
              </MenuItem> */}
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); handleLogOut(); }}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Fragment>
        </div>
      </div>
    </nav>
  )
}

export default Header