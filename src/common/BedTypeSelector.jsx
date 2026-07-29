import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import React, { useEffect, useState } from 'react'

const BedTypeSelector = ({ checkinType, selectedRooms, setFormData, formData }) => {

  const LSTBeds = ["102", "103", "202", "203", "302", "303", "402", "403"];

  const [roomBedType, setRoomBedType] = useState(formData.roomBedType);

  useEffect(() => {
    if (selectedRooms.length === 0)
      setRoomBedType([]);

    if (selectedRooms.length === 1) {
      setRoomBedType([{
        roomNum: selectedRooms[0],
        bedType: LSTBeds.includes(selectedRooms[0]) ?
          "large" :
          "single"
      }]);
    } else {
      setRoomBedType((prevState) => {
        return selectedRooms.map(room => {
          const prevRoom = prevState.find(item => item.roomNum === room);
          return prevRoom || {
            roomNum: room,
            bedType: "",
          };
        });
      });
    }
  }, [selectedRooms]);

  useEffect(() => {
    setFormData((prevData) => {
      return {
        ...prevData,
        roomBedType: roomBedType
      };
    });
  }, [roomBedType]);

  const handleChangeMultiRoomSelector = (event) => {
    const { name, value } = event.target;
    setRoomBedType(prevState => {
      return prevState.map(item =>
        item.roomNum === name
          ? { ...item, bedType: value }
          : item
      );
    });
  };

  return (
    selectedRooms.length <= 1 ? (
      <FormControl sx={{ width: 300 }} disabled>
        <TextField value={
          (roomBedType[0]?.bedType === "single" && "Single Bed") ||
          (roomBedType[0]?.bedType === "large" && "Large Single/Twin") || ""
        } label="Bed Type" disabled />
      </FormControl>
    ) : (
      <div className='border border-slate-300 rounded-md p-3 flex flex-col gap-4 w-[18.7rem]'>
        {
          roomBedType.map((room, idx) => (
            <div className='flex gap-2' key={idx}>
              <TextField size='small' className='w-[60px]' disabled value={room.roomNum} />
              <FormControl sx={{ width: 200 }} size='small'>
                <InputLabel id={`bed-type-${room.roomNum}`}>Bed Type</InputLabel>
                <Select
                  labelId={`bed-type-${room.roomNum}`}
                  value={room.bedType}
                  label="Bed Type"
                  name={room.roomNum}
                  onChange={handleChangeMultiRoomSelector}
                >
                  <MenuItem value={"single"}>Single Bed</MenuItem>
                  <MenuItem value={"large"}>Large Single/Twin</MenuItem>
                </Select>
              </FormControl>
            </div>
          ))
        }
      </div>
    )
  )
}

export default BedTypeSelector