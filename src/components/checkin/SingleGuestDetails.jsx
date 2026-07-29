import { Box, Button, Chip, TextField, Typography } from '@mui/material'
import { CustomeFileOrPhotoUploader, DropdownMenu, ExtraBedSelector } from '../../common';
import { useEffect, useState } from 'react';
import { generateUniqueID } from '../../constants/Functions';
import { Close } from '@mui/icons-material';
import { addEllipsisWithExtension } from '../../constants/constants';

const GuestAndBreakfastDetails = ({ formData, setFormData }) => {

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [guestInfo, setGuestInfo] = useState({
    id: generateUniqueID(),
    name: '',
    mobileNo: '',
    whatsappNo: '',
    emailID: '',
    idType: '',
    otherIdName: '',
    idNo: '',
    idPhotoUrl: null,
    userPhotoUrl: null,
    vehicleType: '',
    vehicleNo: '',
  });

  const handleOpenDoc = () => {
    setIsDialogOpen(true);
  };

  const handleRemoveFile = (id) => {
    setGuestInfo(prevData => ({
      ...prevData,
      userPhotoUrl: id === 1 ? null : prevData.userPhotoUrl,
      idPhotoUrl: id === 2 ? null : prevData.idPhotoUrl
    }))
  }

  useEffect(() => {
    const updateMainGuestDetails = () => {
      setFormData(prev => ({
        ...prev,
        guestDetails: [{ ...guestInfo }],
      }));
    };

    updateMainGuestDetails();
  }, [guestInfo]);

  return (
    <>      
      <div className="my-5 mx-1 grid grid-cols-12 gap-4">
        <div className="col-span-1 flex items-center justify-center bg-primary rounded-lg">
          <span className="transform -rotate-90 text-white text-xl font-bold text-nowrap">Guest Details</span>
        </div>
        <div className='col-span-1' />
        <div className='col-span-10'>
          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>Guest Mobile Number <span className='text-red-500'>*</span></Typography>
            <TextField type='number' label='Guest Mobile Number' variant='outlined' value={guestInfo.mobileNo}
              onChange={(e) => setGuestInfo(prevFormData => ({
                ...prevFormData,
                mobileNo: e.target.value
              }))}
              sx={{
                width: 300,
                '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input': {
                  MozAppearance: 'textfield',
                },
              }}
            />
          </div>
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>Guest Name <span className='text-red-500'>*</span></Typography>
            <TextField label='Guest Name' variant='outlined' sx={{ width: 300 }} value={guestInfo.name}
              onChange={(e) => setGuestInfo(prevFormData => ({
                ...prevFormData,
                name: e.target.value
              }))}
            />
          </div>
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>Guest Whatsapp Number</Typography>
            <TextField type='number' label='Guest Whatsapp Number' variant='outlined' value={guestInfo.whatsappNo}
              onChange={(e) => setGuestInfo(prevFormData => ({
                ...prevFormData,
                whatsappNo: e.target.value
              }))}
              sx={{
                width: 300,
                '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input': {
                  MozAppearance: 'textfield',
                },
              }}
            />
          </div>
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>Guest Email ID</Typography>
            <TextField type='email' label='Guest Email ID' variant='outlined' sx={{ width: 300 }} value={guestInfo.emailID}
              onChange={(e) => setGuestInfo(prevFormData => ({
                ...prevFormData,
                emailID: e.target.value
              }))}
            />
          </div>
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>Extra Bed</Typography>
            <ExtraBedSelector formData={formData} setFormData={setFormData} />
          </div>
          <br />

          <DropdownMenu name="ID Type" data={guestInfo.idType} setData={setGuestInfo} fieldName={"idType"} menuItem={["Aadhar", "Driving License", "Passport", "Voter ID", "Other"]} />
          {
            guestInfo.idType === "Other" &&
            <div className="grid grid-cols-3 items-center mt-5">
              <div />
              <div>
                <TextField label='Other ID Name' variant='outlined' sx={{ width: 300 }} value={guestInfo.otherIdName}
                  onChange={(e) => setGuestInfo(prevFormData => ({
                    ...prevFormData,
                    otherIdName: e.target.value
                  }))}
                />
              </div>
            </div>
          }
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>ID Number</Typography>
            <TextField label='ID Number' variant='outlined' sx={{ width: 300 }} value={guestInfo.idNo}
              onChange={(e) => setGuestInfo(prevFormData => ({
                ...prevFormData,
                idNo: e.target.value
              }))}
            />
          </div>
          <br />

          <div className='grid grid-cols-3 items-center'>
            <Typography className='text-primary'>ID Proof's <span className='text-red-500'>*</span></Typography>
            <div className='flex items-center w-[18.7rem]'>
              {
                (!guestInfo.idPhotoUrl && !guestInfo.userPhotoUrl) ? (
                  <div className='border flex justify-center items-center w-full h-36 rounded-md border-slate-300 cursor-pointer' onClick={handleOpenDoc}>
                    <span className='text-gray-400'>Click to select rooms</span>
                  </div>
                ) : (
                  <div className='border border-slate-300 rounded-lg w-full px-3 py-2'>
                    <div>
                      {guestInfo.userPhotoUrl && (
                        <Box className="flex flex-col gap-1 mb-2 w-fit">
                          <Typography className='text-primary !text-sm'>Guest Photo</Typography>
                          <Chip
                            label={addEllipsisWithExtension(guestInfo.userPhotoUrl)}
                            onDelete={() => handleRemoveFile(1)}
                            deleteIcon={<Close />}
                            color="primary"
                          />
                        </Box>
                      )}
                      {/* File 2 Chip */}
                      {guestInfo.idPhotoUrl && (
                        <Box className="flex flex-col gap-1 mb-2 w-fit">
                          <Typography className='text-primary !text-sm'>ID Photo</Typography>
                          <Chip
                            label={addEllipsisWithExtension(guestInfo.idPhotoUrl)}
                            onDelete={() => handleRemoveFile(2)}
                            deleteIcon={<Close />}
                            color="primary"
                          />
                        </Box>
                      )}
                    </div>
                    <div className='flex items-center justify-end mt-5'>
                      <Button className='' variant='outlined' color='secondary' size='small' sx={{ textTransform: "none" }} onClick={() => setIsDialogOpen(true)}>Reupload Documents</Button>
                    </div>
                  </div>
                )
              }
            </div>
            <CustomeFileOrPhotoUploader isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} guestInfo={guestInfo} setGuestInfo={setGuestInfo} />
          </div>
          <br />

          <DropdownMenu name="Vehicle" data={guestInfo.vehicleType} setData={setGuestInfo} fieldName={"vehicleType"} menuItem={["Car", "Bike", "Other"]} />
          <div className="grid grid-cols-3 items-center mt-5">
            <div />
            <div>
              <TextField label="Vehicle Number" variant='outlined' sx={{ width: 300 }} value={guestInfo.vehicleNo}
                onChange={(e) => setGuestInfo(prevData => ({
                  ...prevData,
                  vehicleNo: e.target.value
                }))}
              />
            </div>
          </div>
          <br />

          <DropdownMenu name="Breakfast" data={formData.breakfast} setData={setFormData} fieldName={"breakfast"} menuItem={["Yes", "No"]} />
        </div >
      </div>
    </>
  )
}

export default GuestAndBreakfastDetails