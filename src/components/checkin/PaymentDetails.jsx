import { Button, FormControl, Input, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select, TextField, Typography } from '@mui/material'
import { DropdownMenu } from '../../common/index'
import { PriceCalculator } from '../../constants/PriceCalculator'
import { useEffect } from 'react'
import { caluculatePaymentAmounts } from './PriceCalulator'

const PaymentDetails = ({ formData, setFormData }) => {

  // useEffect(() => { 
  //   caluculatePaymentAmounts({formData, setFormData});
  // }, [formData]);
  return (
    <div className="my-5 mx-1 grid grid-cols-12 gap-4">
      <div className="col-span-1 flex items-center justify-center bg-primary rounded-lg">
        <span className="transform -rotate-90 text-white text-xl font-bold text-nowrap">Payment Details</span>
      </div>
      <div className='col-span-1' />
      <div className='col-span-10'>
        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Any Discount</Typography>
          <FormControl sx={{ width: 150 }}>
            <InputLabel>Discount Amount</InputLabel>
            <OutlinedInput
              sx={{ width: 300 }}
              type='number'
              label="Discount Amount"
              startAdornment={<InputAdornment position="start">₹</InputAdornment>}
              value={formData.anyDiscountAmt}
              onChange={(e) => setFormData(prevData => ({
                ...prevData,
                anyDiscountAmt: e.target.value
              }))}
              inputProps={{ step: "0.01" }}
            />
          </FormControl>
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <div />
          <TextField
            label="Discount Reason"
            value={formData.anyDiscountCmt}
            sx={{ width: 300 }}
            onChange={(e) => setFormData(prevData => ({
              ...prevData,
              anyDiscountCmt: e.target.value
            }))}
          />
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Room Amount</Typography>
          {
            (formData.guestType === "Online" || formData.guestType === "Corporate Guest") ? (
              <FormControl sx={{ width: 150 }}>
                <InputLabel>Room Amount</InputLabel>
                <OutlinedInput
                  sx={{ width: 300 }}
                  type='number'
                  label="Room Amount"
                  startAdornment={<InputAdornment position="start">₹</InputAdornment>}
                  value={formData.roomAmount}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData,
                    roomAmount: e.target.value
                  }))}
                />
              </FormControl>
            ) : (
              <FormControl sx={{ width: 150 }} disabled={true}>
                <InputLabel>Room Amount</InputLabel>
                <OutlinedInput
                  sx={{ width: 300 }}
                  label="Room Amount"
                  startAdornment={<InputAdornment position="start" disableTypography>₹</InputAdornment>}
                  value={formData.roomAmount}
                />
              </FormControl>
            )
          }
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>GST</Typography>
          {
            formData.guestType !== "DG" ? (
              <FormControl sx={{ width: 150 }} disabled>
                <InputLabel>GST</InputLabel>
                <OutlinedInput
                  sx={{ width: 300 }}
                  type='number'
                  label="GST"
                  startAdornment={<InputAdornment disableTypography position="start">₹</InputAdornment>}
                  value={formData.gst}
                />
              </FormControl>
            ) : (
              <TextField
                label="GST"
                value="Not Applicatble"
                sx={{ width: 300 }}
                disabled
              />
            )
          }
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Advance Amount</Typography>
          {
            formData.bookingRef !== "direct-advance" ? (
              <FormControl sx={{ width: 150 }}>
                <InputLabel>Advance Amount</InputLabel>
                <OutlinedInput
                  sx={{ width: 300 }}
                  type='number'
                  label="Advance Amount"
                  startAdornment={<InputAdornment position="start">₹</InputAdornment>}
                  value={formData.advanceAmount}
                  onChange={(e) => setFormData(prevData => ({
                    ...prevData,
                    advanceAmount: e.target.value
                  }))}
                />
              </FormControl>
            ) : (
              <FormControl sx={{ width: 150 }} disabled={true}>
                <InputLabel>Advance Amount</InputLabel>
                <OutlinedInput
                  sx={{ width: 300 }}
                  label="Advance Amount"
                  startAdornment={<InputAdornment position="start" disableTypography>₹</InputAdornment>}
                  value={formData.advanceAmount}
                />
              </FormControl>
            )
          }
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Net Payable</Typography>
          <FormControl sx={{ width: 150 }} disabled>
            <InputLabel>Net Payable</InputLabel>
            <OutlinedInput
              sx={{ width: 300 }}
              type='number'
              label="Net Payable"
              startAdornment={<InputAdornment disableTypography position="start">₹</InputAdornment>}
              value={formData.netPayable}
            />
          </FormControl>
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Payment Amount <span className='text-red-500'>*</span></Typography>
          <FormControl sx={{ width: 150 }}>
            <InputLabel>Payment Amount <span className='text-red-500'>*</span></InputLabel>
            <OutlinedInput
              sx={{ width: 300 }}
              type='number'
              label="Payment Amount"
              startAdornment={<InputAdornment position="start">₹</InputAdornment>}
              value={formData.paymentAmount}
              onChange={(e) => setFormData(prevData => ({
                ...prevData,
                paymentAmount: e.target.value
              }))}
            />
          </FormControl>
        </div>
        <br />

        <div className='grid grid-cols-3 items-center'>
          <Typography className='text-primary'>Payment Method</Typography>
          <FormControl sx={{ width: 300 }}>
            <InputLabel id="labelId">Payment Method"</InputLabel>
            <Select
              labelId="labelId"
              value={formData.paymentMethod}
              label="Payment Method"
              onChange={(e) => setFormData(prevFormData => ({
                ...prevFormData,
                paymentMethod: e.target.value
              }))
              }
            >
              <MenuItem value="Cash" >Cash</MenuItem>
              {formData.guestType === "DG" && <MenuItem value="cash-dg" >Cash DG</MenuItem>}
              <MenuItem value="UPI" >UPI</MenuItem>
              {formData.guestType === "DG" && <MenuItem value="other-account-dg" >Other Account DG</MenuItem>}
              <MenuItem value="Debit Card" >Debit Card</MenuItem>
              <MenuItem value="Credit Card" >Credit Card</MenuItem>
            </Select>
          </FormControl>
        </div>
        <br />
      </div>
    </div>
  )
}

export default PaymentDetails