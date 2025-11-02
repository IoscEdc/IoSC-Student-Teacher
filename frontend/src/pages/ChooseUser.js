import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Grid,
  Paper,
  Box,
  Container,
  CircularProgress,
  Backdrop,
  Typography,
  useTheme,
  Button
} from '@mui/material';
import { AccountCircle, School, Group } from '@mui/icons-material';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/userRelated/userHandle';
import Popup from '../components/Popup';

const ChooseUser = ({ visitor }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const password = 'zxc';

  const { status, currentUser, currentRole } = useSelector((state) => state.user);

  const [loader, setLoader] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState('');

  const navigateHandler = (user) => {
    if (user === 'Admin') {
      if (visitor === 'guest') {
        const email = 'yogendra@12';
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Adminlogin');
      }
    } else if (user === 'Student') {
      if (visitor === 'guest') {
        const rollNum = '1';
        const studentName = 'Dipesh Awasthi';
        const fields = { rollNum, studentName, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Studentlogin');
      }
    } else if (user === 'Teacher') {
      if (visitor === 'guest') {
        const email = 'tony@12';
        const fields = { email, password };
        setLoader(true);
        dispatch(loginUser(fields, user));
      } else {
        navigate('/Teacherlogin');
      }
    }
  };

  useEffect(() => {
    if (status === 'success' || currentUser !== null) {
      if (currentRole === 'Admin') {
        navigate('/Admin/dashboard');
      } else if (currentRole === 'Student') {
        navigate('/Student/dashboard');
      } else if (currentRole === 'Teacher') {
        navigate('/Teacher/dashboard');
      }
    } else if (status === 'error') {
      setLoader(false);
      setMessage('Network Error');
      setShowPopup(true);
    }
  }, [status, currentRole, navigate, currentUser]);

    const brandDark = '#0f2b6e';
  const brandPrimary = '#2176FF';
  const brandAccent = '#33A1FD';

  const CardStyle = {
    p: 4,
    textAlign: 'center',
    borderRadius: 3,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    backgroundColor: 'white',
    boxShadow: `0 8px 20px rgba(0, 0, 0, 0.4)`,
    border: '1px solid transparent',
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: `0 15px 30px rgba(33, 118, 255, 0.3)`,
      borderColor: brandPrimary,
    },
  };

  const IconCircleStyle = {
    background: `linear-gradient(135deg, ${brandPrimary}, ${brandDark})`,
    width: 70,
    height: 70,
    margin: '0 auto 20px auto',
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 15px rgba(33, 118, 255, 0.6)`,
    mb: 3,
  };

  return (
    <Box
      sx={{
        // Full screen dark gradient background
        background: `linear-gradient(145deg, ${brandDark} 0%, #1b263b 100%)`,
        minHeight: '100vh', 
        p: { xs: 4, sm: 8 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:{md:'-5rem', xs:'0'}
      }}
    >
      <Container maxWidth="md">
        {/* --- Branding Header --- */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: 4,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
              mb: 1,
              // Gradient for text
              background: `linear-gradient(90deg, ${brandAccent}, #fff)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 3px 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            USAR Samvad
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '0.9rem', sm: '1.2rem' },
              color: '#fff',
              opacity: 0.84,
              letterSpacing: 2,
            }}
          >
            Choose Your Role
          </Typography>
        </Box>

        {/* --- Role Selection Grid --- */}
        <Grid container spacing={4} justifyContent="center">
          
          {/* Admin Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper onClick={() => navigateHandler('Admin')} sx={CardStyle}>
              <Box sx={IconCircleStyle}>
                <AccountCircle sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" sx={{ color: brandDark, fontWeight: 800, mb: 1.5 }}>
                Admin
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Log in as an administrator to manage and oversee school operations.
              </Typography>
            </Paper>
          </Grid>
          
          {/* Student Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper onClick={() => navigateHandler('Student')} sx={CardStyle}>
              <Box sx={IconCircleStyle}>
                <School sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" sx={{ color: brandDark, fontWeight: 800, mb: 1.5 }}>
                Student
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Access learning materials, view attendance, and track your progress.
              </Typography>
            </Paper>
          </Grid>
          
          {/* Teacher Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper onClick={() => navigateHandler('Teacher')} sx={CardStyle}>
              <Box sx={IconCircleStyle}>
                <Group sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" sx={{ color: brandDark, fontWeight: 800, mb: 1.5 }}>
                Teacher
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your classes, assignments, and student performance.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Footer Branding
      <Box sx={{ position: 'fixed', bottom: 15, width: '100%', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#aaa', fontWeight: 500 }}>
          Made with <span role="img" aria-label="heart" style={{ color: '#FF4136' }}>❤️</span> by IoSC-EDC
        </Typography>
      </Box> */}

      {/* Backdrop and Popup (UNCHANGED) */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loader}>
        <CircularProgress color="inherit" />
        <Typography sx={{ ml: 2 }}>Please Wait</Typography>
      </Backdrop>
      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </Box>
  );
};

export default ChooseUser;