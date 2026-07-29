import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

const NumberOfPersons = ({ selectedRooms, setFormData, formData, roomData }) => {
  const handleOccupancyChange = (roomNum, type, value) => {
    setFormData(prev => {
      const existingOccupancy = prev.guestOccupancy.find(room => room.roomNum === roomNum);

      if (existingOccupancy) {
        // Update the existing room data
        return {
          ...prev,
          guestOccupancy: prev.guestOccupancy.map(room =>
            room.roomNum === roomNum
              ? { ...room, [type]: value }
              : room
          ),
        };
      } else {
        // Add new room data
        return {
          ...prev,
          guestOccupancy: [
            ...prev.guestOccupancy,
            { roomNum, numOfAdults: type === 'numOfAdults' ? value : '', numOfChildren: type === 'numOfChildren' ? value : '' },
          ],
        };
      }
    });
  };

  return selectedRooms.length < 1 ? (
    <TextField
      value={0}
      sx={{
        width: 300,
      }}
      disabled
    />
  ) : (
    <div className='w-max border border-slate-300 rounded-md p-3 col-span-2 flex flex-col gap-4'>
      {selectedRooms?.map(roomNum => {
        // Find room occupancy in the array or initialize default
        const roomOccupancy =
          formData.guestOccupancy.find(room => room.roomNum === roomNum) || {
            roomNum,
            numOfAdults: "",
            numOfChildren: "",
          };

        const selectedRoomType = Object.values(roomData)
          .flat()
          .find(room => room.room_number === roomNum)?.room_type;

        const menuItems =
          selectedRoomType && ['SK', 'ST', 'VIP', 'SB'].includes(selectedRoomType)
            ? [1, 2]
            : selectedRoomType && ['SU', 'FM', 'SL'].includes(selectedRoomType)
            ? [1, 2, 3]
            : [];

        return (
          <div className='flex gap-4 items-center' key={roomNum}>
            <span className='text-sm font-medium text-primary w-12 text-center'>{roomNum}</span>
            <FormControl size='small' sx={{ width: 90 }}>
              <InputLabel id={`roomId-${roomNum}-adults`}>Adults</InputLabel>
              <Select
                labelId={`roomId-${roomNum}-adults`}
                label="Adults"
                value={roomOccupancy.numOfAdults}
                onChange={e =>
                  handleOccupancyChange(roomNum, 'numOfAdults', e.target.value)
                }
              >
                {menuItems.map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ width: 100 }}>
              <InputLabel id={`roomId-${roomNum}-children`}>Children</InputLabel>
              <Select
                labelId={`roomId-${roomNum}-children`}
                label="Children"
                value={roomOccupancy.numOfChildren}
                onChange={e =>
                  handleOccupancyChange(roomNum, 'numOfChildren', e.target.value)
                }
              >
                {menuItems.map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        );
      })}
    </div>
  );
};

export default NumberOfPersons;