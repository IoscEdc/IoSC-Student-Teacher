import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Grid,
  Box,
  Typography,
  Paper,
  TextField,
  CssBaseline,
  IconButton,
  InputAdornment,
  CircularProgress,
  Backdrop,
  Modal
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import styled from 'styled-components';
import bgpic from "../assets/designlogin.jpg";
import { IndigoButton } from '../components/buttonStyles';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';
import axios from 'axios';
import api from '../api/axiosConfig';

const usArSamvadTheme = createTheme({
    palette: {
        primary: {
            main: '#2176FF', // Light Blue (Primary Accent)
            dark: '#0f2b6e', // Dark Blue (Primary Dark)
        },
        secondary: {
            main: '#33A1FD', // A lighter blue accent
        },
        background: {
            default: '#f4f7f9',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif',
    },
});

const LoginPage = ({ role }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, currentUser, response, currentRole } = useSelector(state => state.user);

  const [toggle, setToggle] = useState(false);
  const [loader, setLoader] = useState(false);
  const [guestLoader, setGuestLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    let hasError = false;

    if (!email) {
      setEmailError(true);
      hasError = true;
    } else setEmailError(false);

    if (!password) {
      setPasswordError(true);
      hasError = true;
    } else setPasswordError(false);

    if (hasError) return;

    setLoader(true);
    setLoginError("");
    console.log('🔍 LOGINPAGE DEBUG - Calling loginUser with:', { email, password: '***', role });
    dispatch(loginUser({ email, password, role }));
  };

  const guestModeHandler = () => {
    const password = "zxc";
    let fields = {};
    if (role === "Admin") fields = { email: "yogendra@12", password, role };
    else if (role === "Student") fields = { email: "student@demo.com", password, role };
    else if (role === "Teacher") fields = { email: "tony@12", password, role };
    setGuestLoader(true);
    console.log('🔍 LOGINPAGE DEBUG - Guest login with:', { ...fields, password: '***' });
    dispatch(loginUser(fields));
  };

  const handleForgotPassword = async () => {
    console.log('🔍 FORGOT PASSWORD DEBUG - Step 1: Function called');
    console.log('🔍 FORGOT PASSWORD DEBUG - Step 2: Email:', forgotEmail, 'Role:', role);
    
    if (!forgotEmail) {
      console.log('🚨 FORGOT PASSWORD ERROR - No email provided');
      return;
    }
    
    setForgotLoading(true);
    try {
      let endpoint = '/StudentForgotPassword';
      if (role === 'Teacher') {
        endpoint = '/TeacherForgotPassword';
      } else if (role === 'Admin') {
        endpoint = '/AdminForgotPassword';
      }
      
      console.log('🔍 FORGOT PASSWORD DEBUG - Step 3: Using endpoint:', endpoint);
      console.log('🔍 FORGOT PASSWORD DEBUG - Step 4: Sending request with email:', forgotEmail);
      
      const response = await api.post(endpoint, { email: forgotEmail });
      
      console.log('🔍 FORGOT PASSWORD DEBUG - Step 5: Response received:', response.data);
      
      setMessage("🎉 New password sent to your email! Check your inbox and login with the new password.");
      setShowPopup(true);
      setForgotModalOpen(false);
      setForgotEmail("");
      
      console.log('🔍 FORGOT PASSWORD DEBUG - Step 6: Success - Modal closed and message shown');
    } catch (err) {
      console.error('🚨 FORGOT PASSWORD ERROR - Step 7: Error occurred:', err);
      console.error('🚨 FORGOT PASSWORD ERROR - Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setMessage(err.response?.data?.error || "Failed to send reset email");
      setShowPopup(true);
    } finally {
      setForgotLoading(false);
      console.log('🔍 FORGOT PASSWORD DEBUG - Step 8: Loading state reset');
    }
  };

  useEffect(() => {
    console.log('🔍 LOGINPAGE EFFECT - Status:', status, 'CurrentUser:', !!currentUser, 'CurrentRole:', currentRole);
    
    if (status === 'success' || currentUser !== null) {
      console.log('🔍 LOGINPAGE EFFECT - Login successful, redirecting to success page');
      setLoader(false);
      setGuestLoader(false);
      navigate('/login-success');
    } else if (status === 'failed') {
      console.log('🔍 LOGINPAGE EFFECT - Login failed:', response);
      setLoginError(response || "Login failed");
      setLoader(false);
      setGuestLoader(false);
    } else if (status === 'error') {
      console.log('🔍 LOGINPAGE EFFECT - Login error occurred');
      setLoginError("Network Error");
      setLoader(false);
      setGuestLoader(false);
    }
  }, [status, currentRole, navigate, response, currentUser]);

    const MobileBranding = () => (
    <Box 
        sx={{
            display: { xs: 'flex', sm: 'none' }, // Show only on mobile
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
            pt: 2,
        }}
    >
        <Typography
            variant="h4"
            sx={{
                fontWeight: 900,
                letterSpacing: 2,
                fontSize: "2rem",
                mb: 0.5,
                background: 'linear-gradient(90deg, #2176FF, #33A1FD)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}
        >
            USAR Samvad
        </Typography>
        <Typography
            variant="subtitle1"
            sx={{
                fontWeight: 400,
                fontSize: "0.9rem",
                color: usArSamvadTheme.palette.primary.dark,
                opacity: 0.76,
                letterSpacing: 1.5,
            }}
        >
            powered by IoSC EDC
        </Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={usArSamvadTheme}>
      <Grid container sx={{ height: '100vh' }}>
        <CssBaseline />
        
        {/* Left Side: Login Form (Visible on all screens) */}
        <Grid item xs={12} sm={7} md={5}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Use dark blue for the login panel background
            background: usArSamvadTheme.palette.primary.dark, 
            boxShadow: { md: 6 },
          }}
        >
          <Box sx={{
            width: { xs: "90%", sm: 400 },
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 4,
            boxShadow: 5,
            px: { xs: 2, sm: 4 },
            py: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            
            {/* --- Mobile Branding (FIX HERE) --- */}
            <MobileBranding />

            <Typography
              variant="h4"
              sx={{
                mb: 2,
                fontWeight: 800,
                color: usArSamvadTheme.palette.primary.dark, // Dark blue color
                letterSpacing: 2,
              }}
            >
              {role} Login
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 3, color: usArSamvadTheme.palette.primary.main, fontWeight: 500 }} // Light blue accent
            >
              Welcome back! Please enter your details
            </Typography>
            
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: "100%", mt: 2 }}>
              {/* Email Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Enter your email"
                name="email"
                autoComplete="email"
                autoFocus
                error={emailError || !!loginError}
                helperText={emailError ? "Email is required" : ""}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(false); setLoginError(""); }}
              />
              
              {/* Password Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={toggle ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                error={passwordError || !!loginError}
                helperText={passwordError ? "Password is required" : loginError}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); setLoginError(""); }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setToggle(!toggle)}>
                        {toggle ? <Visibility color="primary" /> : <VisibilityOff color="action" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: 1 }}>
                <Button 
                  variant="text" 
                  onClick={() => setForgotModalOpen(true)} 
                  sx={{ color: usArSamvadTheme.palette.primary.main, fontWeight: 500 }}
                >
                  Forgot password?
                </Button>
              </Box>
              
              {/* Login Button */}
              <IndigoButton 
                type="submit" 
                fullWidth 
                variant="contained" 
                sx={{
                    mt: 3,
                    height: 46,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 2,
                    // Use custom gradient with brand colors
                    background: `linear-gradient(90deg, ${usArSamvadTheme.palette.primary.main} 40%, ${usArSamvadTheme.palette.secondary.main} 100%)`,
                    '&:hover': {
                         background: usArSamvadTheme.palette.primary.dark,
                    },
                    boxShadow: '0 4px 10px rgba(33, 118, 255, 0.4)',
                }}
              >
                {loader ? <CircularProgress size={24} color="inherit" /> : "Login"}
              </IndigoButton>
              
              {/* Guest Login Button */}
              <Button fullWidth onClick={guestModeHandler} variant="outlined" sx={{
                mt: 2, mb: 2,
                color: usArSamvadTheme.palette.primary.dark,
                borderColor: usArSamvadTheme.palette.primary.dark,
                fontWeight: 600,
                borderRadius: 2,
                background: "rgba(33, 118, 255, 0.07)",
                '&:hover': {
                    borderColor: usArSamvadTheme.palette.primary.main,
                    backgroundColor: "rgba(33, 118, 255, 0.15)",
                },
              }}>
                {guestLoader ? <CircularProgress size={24} color="primary" /> : "Login as Guest"}
              </Button>

                {/* StyledLink definition for consistency */}
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Don't have an account? 
                        <StyledLink to="/register">
                            &nbsp;Sign Up
                        </StyledLink>
                    </Typography>
                </Box>
            </Box>
          </Box>
        </Grid>
        
        {/* Right Side: Visual Banner (Hidden on mobile) */}
        <Grid
          item
          xs={false}
          sm={5}
          md={7}
          sx={{
            // Use custom dark gradient for banner
            backgroundImage: `linear-gradient(135deg, ${usArSamvadTheme.palette.primary.dark} 70%, #1b263b 100%), url(${bgpic})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: { xs: 'none', sm: 'flex' }, // Hidden on xs, visible on sm and up
            flexDirection: "column",
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            textAlign: 'center',
            px: { xs: 2, sm: 7 },
          }}
        >
          <Box>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                letterSpacing: 3,
                fontSize: { xs: "2rem", sm: "2.7rem", md: "3.3rem" },
                mb: 1,
                // Gradient for text
                background: 'linear-gradient(90deg, #2176FF, #33A1FD)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: "0 2px 16px rgba(60,100,200,0.27)"
              }}
            >
              USAR Samvad
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                fontSize: "1.05rem",
                color: "#fff",
                opacity: 0.84,
                letterSpacing: 2,
                mb: 4
              }}
            >
              powered by IoSC EDC
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              sx={{ color: "#fff", mb: 2, textShadow: "0 1px 8px rgba(0,0,0,0.13)" }}
            >
              Empowering Education
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#d7efff", fontSize: "1.1rem", opacity: 0.76 }}>
              "Managing today for a smarter tomorrow — where every student matters."
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* Forgot Password Modal */}
      <Modal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 400 },
          bgcolor: 'background.paper',
          borderRadius: 3,
          p: 4,
          boxShadow: 13
        }}>
          <Typography variant="h6" mb={2} sx={{ fontWeight: 700, color: usArSamvadTheme.palette.primary.dark }}>
            Forgot Password
          </Typography>
          <TextField
            fullWidth
            label="Enter your email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              background: `linear-gradient(90deg, ${usArSamvadTheme.palette.primary.main} 40%, ${usArSamvadTheme.palette.secondary.main} 100%)`,
              color: "#fff",
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { background: usArSamvadTheme.palette.primary.dark },
            }}
            onClick={handleForgotPassword}
            disabled={forgotLoading}
          >
            {forgotLoading ? <CircularProgress size={24} color="inherit" /> : "Send Reset Email"}
          </Button>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={guestLoader}>
        <CircularProgress color="primary" />
        <Typography sx={{ ml: 2 }}>Please Wait</Typography>
      </Backdrop>
      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </ThemeProvider>
  );
};

export default LoginPage;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: ${usArSamvadTheme.palette.primary.main}; 
  font-weight: 600;
  transition: color 0.3s;
  &:hover {
    color: ${usArSamvadTheme.palette.primary.dark};
  }
`;