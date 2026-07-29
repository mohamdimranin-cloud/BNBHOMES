import { Stack, Typography } from '@mui/material';
import { IoCheckmarkDone } from "react-icons/io5";
import React from 'react'
import { roomStatusBg } from '../constants/constants';

const RoomsCard = ({ name, rooms, setSelectedRooms, setRoomDetails, formData }) => {

  const handleRoomToggle = (curRoom) => {

    const { room_number: roomNumber} = curRoom;
    
    setRoomDetails(prevRooms => {
      const updatedRooms = { ...prevRooms };
      Object.keys(updatedRooms).forEach(floor => {
        const updatedFloorRooms = updatedRooms[floor].map(room =>
          room.room_number === curRoom.room_number
            ? { ...room, selected: !room.selected }
            : room
        );
        updatedRooms[floor] = updatedFloorRooms;
      });
  
      return updatedRooms;
    });

    setSelectedRooms((prevSelectedRooms) => {
      if (prevSelectedRooms.includes(roomNumber)) {
        return prevSelectedRooms.filter((room) => room !== roomNumber);
      } else {
        return [...prevSelectedRooms, roomNumber];
      }
    });
  };

  return (
    <div className='flex items-center border px-4 py-2 rounded-md w-full h-20'>
      <Typography className='w-36 text-primary'>{name}</Typography>
      <div className='flex gap-2'>
        {
          rooms?.map((room, index) => (
            <Stack className='flex-row gap-1 text-center' key={index}>
              <button
                className={`border flex items-center justify-center w-20 px-4 py-2 rounded-lg ${room.status === "Vacant" && "!cursor-pointer"} ${roomStatusBg(room.status)} !text-white !font-medium`}
                disabled={room.status !== "Vacant"}
                onClick={() => handleRoomToggle(room)}>
                {(room.selected || formData.selectedRooms.includes(room.room_number)) && <IoCheckmarkDone className='mr-1' />}
                {room.room_number}
              </button>
              <span className='text-xs text-primary'>{room.room_type}</span>
            </Stack>
          ))
        }
      </div>
    </div>
  )
}

export default RoomsCard