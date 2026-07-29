import React, { useState } from 'react'
import { Logo } from '../../assets'
import { Alert, Backdrop, Button, CircularProgress, Divider, FormControl, IconButton, InputAdornment, MenuItem, Select, TextField } from '@mui/material';
import { InputSelectStyle, InputTextFieldStyle } from '../../constants/StyleProperties';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/apiService';

const SignUp = () => {

  const navigate = useNavigate();

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", role: "", password: "", confirmPassword: "" });
  const [isSign_up, setIsSign_up] = useState(false);

  const handleClickShowPassword1 = () => {
    setShowPassword1((prev) => !prev);
  };

  const handleClickShowPassword2 = () => {
    setShowPassword2((prev) => !prev);
  };

  const handleInputchange = (e) => {
    setFormData(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value
    }));
  }

  const handleMatchPassword = () => {
    if (formData.password !== "" && formData.password !== formData.confirmPassword) {
      toast.warn("Password Not Matching");
      setFormData(prevData => ({
        ...prevData,
        confirmPassword: ""
      }));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.warn("Passwords do not match");
      return;
    }

    try {
      setIsSign_up(true);

      const res = await authApi.signup({
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });

      if (res.status === 200 || res.status === 201) {
        setIsSign_up(false);
        toast.success("Account created successfully");
        navigate("/");
      } else if (res.status === 409) {
        setIsSign_up(false);
        toast.error("Username already exists — choose a different username");
      } else {
        setIsSign_up(false);
        toast.error("Registration failed. Try a different username.");
      }
    } catch (error) {
      setIsSign_up(false);
      console.error("Sign-up error: " + error);
      toast.error("Registration failed. Please try again.");
    }
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
        open={isSign_up}
      >
        <div className='flex items-center justify-center gap-4'>
          <CircularProgress />
          <span className='text-blue-500 text-xl font-bold'>Registering In...</span>
        </div>
      </Backdrop>
      <div className='bg-white rounded-lg shadow-lg overflow-y-scroll my-2'>
        <div className='flex items-center justify-center gap-5'>
          <div className='flex flex-col items-center justify-center px-10'>
            <img src={Logo} alt="BnbHome" className='w-44' />
            <span className='text-primary text-2xl font-bold'>BnB Homes</span>
          </div>

          <div className='px-6 shadow-xl'>
            <form className="flex flex-col items-start justify-start gap-3 py-3" onSubmit={handleSubmit}>
              <div className='w-full text-center pb-3'>
                <span className='text-primary text-xl font-medium'>Welcome to My Company</span>
              </div>
              <div className='w-full flex items-center justify-between gap-6'>
                <div className='flex flex-col items-start justify-normal text-primary'>
                  <label>First Name <span className='text-red-500 text-lg'>*</span></label>
                  <TextField
                    type='text'
                    name='firstName'
                    required
                    value={formData.firstName}
                    onChange={handleInputchange}
                    sx={InputTextFieldStyle}
                    InputProps={{
                      style: {
                        height: 40
                      },
                    }}
                  />
                </div>
                <div className='flex flex-col items-start justify-normal text-primary'>
                  <label>Last Name <span className='text-red-500 text-lg'>*</span></label>
                  <TextField
                    type='text'
                    name='lastName'
                    required
                    value={formData.lastName}
                    onChange={handleInputchange}
                    sx={InputTextFieldStyle}
                    InputProps={{
                      style: {
                        height: 40
                      },
                    }}
                  />
                </div>
              </div>
              <div className='w-full flex flex-col items-start justify-normal text-primary'>
                <label>Username <span className='text-red-500 text-lg'>*</span></label>
                <TextField
                  type='text'
                  name='username'
                  required
                  value={formData.username}
                  onChange={handleInputchange}
                  sx={InputTextFieldStyle}
                  InputProps={{
                    style: {
                      height: 40,
                      width: 300
                    },
                  }}
                />
              </div>
              <div className='w-full flex flex-col items-start justify-normal text-primary'>
                <label>Email Address <span className='text-red-500 text-lg'>*</span></label>
                <TextField
                  type='email'
                  name='email'
                  required
                  value={formData.email}
                  onChange={handleInputchange}
                  sx={InputTextFieldStyle}
                  InputProps={{
                    style: {
                      height: 40,
                      width: 300
                    },
                  }}
                />
              </div>
              <div className='w-full flex items-center justify-between gap-6'>
                <div className='w-full flex flex-col items-start justify-normal text-primary'>
                  <label>Phone Number <span className='text-red-500 text-lg'>*</span></label>
                  <TextField
                    type='text'
                    name='phone'
                    required
                    value={formData.phone}
                    onChange={handleInputchange}
                    sx={InputTextFieldStyle}
                    InputProps={{
                      style: {
                        height: 40
                      },
                    }}
                  />
                </div>
                <div className='w-full flex flex-col items-start justify-normal text-primary'>
                  <label>Role <span className='text-red-500 text-lg'>*</span></label>
                  <FormControl fullWidth sx={InputTextFieldStyle} required>
                    <Select
                      fullWidth
                      name='role'
                      value={formData.role}
                      onChange={handleInputchange}
                      sx={{ height: 40 }}
                    >
                      <MenuItem value="audit">Account/Audit</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
              <div className='w-full flex flex-col items-start justify-normal text-primary'>
                <label>Password <span className='text-red-500 text-lg'>*</span></label>
                <TextField
                  required
                  sx={InputTextFieldStyle}
                  name='password'
                  value={formData.password}
                  onChange={handleInputchange}
                  type={showPassword1 ? "text" : "password"}
                  InputProps={{
                    style: {
                      height: 40,
                      width: 300
                    },
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={handleClickShowPassword1}
                          edge="end"
                        >
                          {showPassword1 ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </div>
              <div className='w-full flex flex-col items-start justify-normal text-primary'>
                <label>Confirm Password <span className='text-red-500 text-lg'>*</span></label>
                <TextField
                  required
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleInputchange}
                  sx={InputTextFieldStyle}
                  type={showPassword2 ? "text" : "password"}
                  onBlur={handleMatchPassword}
                  InputProps={{
                    style: {
                      height: 40,
                      width: 300
                    },
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          onClick={handleClickShowPassword2}
                          edge="end"
                        >
                          {showPassword2 ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </div>
              <div className='w-full flex items-center justify-center my-3'>
                <Button type='submit' variant='contained' className='w-2/3 !bg-primary/80 hover:!bg-primary' size='large'>Register</Button>
              </div>
            </form>

            <div className='text-primary text-center text-[14px] -mt-2 mb-4'>
              <label>Already have an account?&nbsp;</label>
              <Link to={"/"} className='hover:underline'>Login</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignUp