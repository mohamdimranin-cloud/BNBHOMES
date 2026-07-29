import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import React from 'react'

const DropdownMenu = ({ name, data, setData, menuItem, fieldName, children }) => {
  return (
    <>
      <div className='grid grid-cols-3 items-center'>
        <Typography className='text-primary'>
          {name}
        </Typography>
        <FormControl sx={{ width: 300 }}>
          <InputLabel id="labelId">{name}</InputLabel>
          <Select
            labelId="labelId"
            value={data}
            label={name}
            onChange={(e) => setData(prevFormData => ({
              ...prevFormData,
              [fieldName]: e.target.value
            }))
            }
          >
            {
              menuItem.map((item, index) => (
                <MenuItem key={index} value={item} >{item}</MenuItem>
              ))
            }
          </Select>
        </FormControl>

        {
          children
        }
      </div>
    </>
  )
}

export default DropdownMenu