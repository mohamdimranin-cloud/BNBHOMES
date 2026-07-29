import React, { useCallback, useEffect } from 'react';
import { Alert, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { toast } from 'react-toastify';

const ExtraBedSelector = ({ formData, setFormData }) => {
  const handleExtraBedChange = useCallback((roomNum, value) => {
    setFormData((prev) => {
      const intValue = parseInt(value, 10);

      const updatedExtraBed = prev.extraBed.map((room) =>
        room.roomNum === roomNum ? { ...room, extraBed: intValue } : room
      );

      const isRoomExisting = updatedExtraBed.some((room) => room.roomNum === roomNum);
      const finalExtraBed = isRoomExisting
        ? updatedExtraBed
        : [...updatedExtraBed, { roomNum, extraBed: intValue }];

      return {
        ...prev,
        extraBed: finalExtraBed,
      };
    });
  });

  useEffect(() => {
    formData.guestOccupancy.forEach((item) => {
      const existingRoom = formData.extraBed.find((room) => room.roomNum === item.roomNum);
      if (item.numOfAdults !== 3 && existingRoom && existingRoom.extraBed === 1) {
        handleExtraBedChange(item.roomNum, 0); 
        toast.error(`Extra Bed is not allowed for Room-${item.roomNum}`);
      }
    });
  }, [formData.guestOccupancy, formData.extraBed, handleExtraBedChange]);

  return (
    <div className='w-[18.7rem] border border-slate-300 rounded-md p-3 col-span-2 flex flex-col gap-4'>
      {formData.selectedRooms.map((roomNum) => {
        const currentExtraBed =
          formData.extraBed.find((room) => room.roomNum === roomNum)?.extraBed || 0;

        return (
          <div className="flex gap-5" key={roomNum}>
            <TextField size="small" className="w-[60px]" disabled value={roomNum} />

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel id={`roomId-${roomNum}-extraBed`}>Extra Bed</InputLabel>
              <Select
                labelId={`roomId-${roomNum}-extraBed`}
                label="Extra Bed"
                value={currentExtraBed}
                onChange={(e) => handleExtraBedChange(roomNum, e.target.value)}
              >
                {['Yes', 'No'].map((item, index) => (
                  <MenuItem key={index} value={item === 'Yes' ? 1 : 0}>
                    {item}
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

export default ExtraBedSelector;