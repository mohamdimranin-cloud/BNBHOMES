import React from 'react'
import NavLinks from '../../constants/NavLinks'
import { Link, useLocation } from 'react-router-dom';
import { MdLogout } from "react-icons/md";
import { useContextProvider } from '../../context/contextProvider';
import { Logo } from '../../assets';
import { Divider } from '@mui/material';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const { pathname } = useLocation();
  const { handleLogOut } = useContextProvider();

  return (
    <aside className={`fixed top-0 left-0 z-40 w-56 h-screen pt-1 bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700 transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <Link to="/" className='flex gap-2 ms-2 md:me-24 bg-white px-3 py-2 rounded-lg'>
        <img src={Logo} alt="Lgog" className='w-11 h-11' />
        <span className='self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-primary'>
          BnB Homes
        </span>
      </Link>
      <Divider />
      <div className='h-full w-full px-3 pb-4 overflow-y-auto'>
        <ul className='space-y-2 font-medium'>
          {
            NavLinks.map(({ route, icon: Icon, title }, index) => (
              <li key={index}>
                <Link to={route} onClick={toggleSidebar} className={`flex items-center my-2 px-4 p-3 rounded-lg dark:hover:bg-gray-700 ${pathname === route ? "bg-primary text-white" : "text-primary hover:bg-gray-100"}`}>
                  <Icon className="mr-2 w-6 h-6" />
                  <span className='flex-1 me-3'>{title}</span>
                </Link>
              </li>
            ))
          }

          <li className='absolute bottom-0 right-0 left-0 px-3'>
            <Link onClick={handleLogOut} className='flex items-center my-2 py-3 rounded-lg dark:hover:bg-red-300 text-primary hover:bg-red-100'>
              <MdLogout className='w-6 h-6 mx-4' />
              <span className='flex-1 me-3'>Sign Out</span>
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar