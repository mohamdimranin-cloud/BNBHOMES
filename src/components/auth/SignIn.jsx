import React, { useState } from 'react'
import { Logo } from '../../assets'
import { Backdrop, Button, CircularProgress, IconButton, InputAdornment, TextField } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import { useContextProvider } from '../../context/contextProvider'
import { InputTextFieldStyle } from '../../constants/StyleProperties'
import { toast } from 'react-toastify'
import { authApi } from '../../api/apiService'

const SignIn = () => {

  const navigate = useNavigate();
  const { setIsLoggedIn } = useContextProvider();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isSign_in, setIsSign_in] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const clearFormData = () => {
    setFormData({
      username: "",
      password: ""
    });
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (formData.username !== "" && formData.password !== "") {
      try {
        setIsSign_in(true);
        const res = await authApi.login(formData);        

        if (res.status === 200) {
          clearFormData();
          // generateUserToken(res?.data?.user);
          localStorage.setItem("userToken", res?.data?.user?.username);
          localStorage.setItem("userRole", res?.data?.user?.role || 'employee');
          setIsLoggedIn(true);
          setIsSign_in(false);
          navigate("/");
        } else {
          clearFormData();
          setIsSign_in(false);
          toast.error("Invalid Username or Password");
        }
      } catch (error) {
        setIsSign_in(false);
        console.log("Login Error: " + error);
        clearFormData();
        toast.error("Invalid Username or Password");
      }
    }
    else
      toast.error("Both field needed...");
  }

  return (
    <>
      <Backdrop
        sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}
        open={isSign_in}
      >
        <div className='flex items-center justify-center gap-4'>
          <CircularProgress />
          <span className='text-blue-500 text-xl font-bold'>Singing In...</span>
        </div>
      </Backdrop>

      <div className='w-[28rem]'>
        <div className='flex items-center justify-center'>
          <img src={Logo} alt="BnBHomes Logo" className='w-20' />
          <h4 className='text-primary text-4xl font-bold'>BnB Homes</h4>
        </div>
        <div className="bg-white shadow-lg rounded-md flex flex-col items-center justify-center gap-10 px-8 py-6">
          <h2 className='text-primary text-2xl font-medium'>Sign in to your account</h2>
          <form onSubmit={handleFormSubmit} className='w-full flex flex-col items-start justify-start gap-5 px-6'>
            <div className='flex flex-col w-full gap-1'>
              <label className='text-[18px] text-primary'>Username</label>
              <TextField
                size='small'
                variant='outlined'
                type='text'
                name='username'
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                sx={InputTextFieldStyle}
                InputProps={{
                  style: {
                    height: 45,
                  }
                }}
              />
            </div>
            <div className='flex flex-col w-full gap-1'>
              <label className='text-[18px] text-primary'>Password</label>
              <TextField
                size='small'
                variant='outlined'
                name='password'
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                type={showPassword ? "text" : "password"}
                sx={InputTextFieldStyle}
                InputProps={{
                  style: {
                    height: 45
                  },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <div className='w-full flex justify-end'>
                <Link to="/forgotPassword" className='hover:underline text-primary text-[15px]'>Forgot Password</Link>
              </div>
            </div>
            <div className='w-full flex items-center justify-center mt-2'>
              <Button type='submit' variant='contained' className='w-2/3 !bg-primary/80 hover:!bg-primary' size='large'>Login</Button>
            </div>
          </form>

          <div className='text-primary text-[14px]'>
            <label>Don't have an account yet?&nbsp;</label>
            <Link to={"/sign-up"} className='hover:underline'>Register</Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignIn