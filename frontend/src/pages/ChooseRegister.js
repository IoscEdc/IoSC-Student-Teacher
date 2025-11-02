import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Box,
  Container,
  Typography,
} from '@mui/material';
import { School, Group } from '@mui/icons-material';

const ChooseRegister = () => {
  const navigate = useNavigate();

  const navigateHandler = (user) => {
    if (user === 'Student') {
      navigate('/Studentregister');
    } else if (user === 'Teacher') {
      navigate('/Teacherregister');
    }
  };

  // --- Style Constants (from ChooseUser.js) ---
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
        marginTop: { md: '-5rem', xs: '0' }
      }}
    >
      <Container maxWidth="md">
        {/* --- Branding Header --- */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              letterSpacing: { xs: 1, md: 2 },
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.5rem' },
              mb: 1,
              lineHeight: 1.2,
              // Gradient for text
              background: `linear-gradient(90deg, ${brandAccent}, #fff)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 3px 10px rgba(255, 255, 255, 0.2)',
            }}
          >
            Choose Your Registration Type
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              fontSize: { xs: '0.9rem', sm: '1.2rem' },
              color: '#fff',
              opacity: 0.84,
              letterSpacing: 1,
            }}
          >
            Select whether you want to register as a student or teacher
          </Typography>
        </Box>

        {/* --- Role Selection Grid --- */}
        <Grid container spacing={4} justifyContent="center">
          
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
                Register as a student to access courses, assignments, and track your academic progress.
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
                Register as a teacher to manage classes, create assignments, and track student progress.
              </Typography>
            </Paper>
          </Grid>
          
        </Grid>
      </Container>
    </Box>
  );
};

export default ChooseRegister;