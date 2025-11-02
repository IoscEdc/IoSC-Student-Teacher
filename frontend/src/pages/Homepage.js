import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import studentImage from '../assets/student.jpg';

const Homepage = () => {
  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: { xs: '100vh', md: 'auto' },
          position: 'relative',
        }}
      >
        {/* Content Section */}
        <Box
          sx={{
            flex: { xs: '1', md: '0 0 50%' },
            display: 'flex',
            flexDirection: 'column',
            // UPDATED: Changed justifyContent for mobile
            justifyContent: { xs: 'flex-start', md: 'center' },
            padding: { xs: '40px 24px', sm: '60px 40px', md: '0 60px', lg: '0 80px' },
            backgroundColor: { xs: 'transparent', md: '#ffffff' },
            position: 'relative',
            zIndex: 10,
            minHeight: { xs: '100vh', md: 'auto' },
          }}
        >
          {/* Brand Section */}
          <Box sx={{
            // ADDED: More top margin for mobile to push content down a bit
            marginTop: { xs: '100px', md: '0' },
            marginBottom: { xs: '30px', md: '40px' },
            textAlign: { xs: 'center', md: 'left' },
          }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                fontWeight: 900,
                letterSpacing: '1px',
                lineHeight: 1,
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #2176FF 0%, #33A1FD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 3px 8px rgba(33, 118, 255, 0.15)',
              }}
            >
              USAR Samvad
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#888',
                fontWeight: 500,
                letterSpacing: '2px',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            >
              powered by IoSC EDC
            </Typography>
          </Box>

          {/* Welcome Title */}
          <Typography
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 800,
              color: '#1b263b',
              lineHeight: 1.2,
              marginBottom: '16px',
              textAlign: { xs: 'center', md: 'left' },
            }}
          >
            Welcome to the <br />
            <Box
              component="span"
              sx={{
                color: '#0f2b6e',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '3px',
                  background: 'linear-gradient(90deg, #2176FF, #33A1FD)',
                  borderRadius: '2px',
                }
              }}
            >
              Management System
            </Box>
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#495057',
              marginBottom: { xs: '40px', md: '50px' },
              lineHeight: 1.6,
              textAlign: { xs: 'center', md: 'left' },
              maxWidth: { md: '90%' },
            }}
          >
            Streamline your school's processes with one integrated platform. Seamlessly admit students and staff, track attendance, keep tabs on academic performance, and automate communication—all in one location.
          </Typography>

          {/* Buttons */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: { xs: '100%', md: '70%' },
            alignSelf: { xs: 'center', md: 'flex-start' },
          }}>
            <Button
              component={Link}
              to="/choose"
              variant="contained"
              fullWidth
              startIcon={<LoginIcon />}
              sx={{
                backgroundColor: '#2176FF',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.1rem' },
                padding: '14px 32px',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(33, 118, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: '#0f2b6e',
                  boxShadow: '0 12px 32px rgba(15, 43, 110, 0.4)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              Login
            </Button>

            <Button
              component={Link}
              to="/register"
              variant="outlined"
              fullWidth
              startIcon={<HowToRegIcon />}
              sx={{
                borderColor: '#0f2b6e',
                borderWidth: '2px',
                color: '#0f2b6e',
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.1rem' },
                padding: '14px 32px',
                borderRadius: '12px',
                textTransform: 'none',
                backgroundColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(15, 43, 110, 0.08)',
                  borderColor: '#2176FF',
                  borderWidth: '2px',
                  color: '#2176FF',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(33, 118, 255, 0.15)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              Register
            </Button>
          </Box>
        </Box>

        {/* Image Section */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: { xs: '0', md: '0 0 50%' },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${studentImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: { xs: 'brightness(0.3)', md: 'brightness(0.85)' },
              zIndex: 1,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: {
                xs: 'linear-gradient(180deg, rgba(15, 43, 110, 0.7) 0%, rgba(33, 118, 255, 0.5) 100%)',
                md: 'linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, transparent 15%, rgba(15, 43, 110, 0.3) 100%)',
              },
              zIndex: 2,
            },
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: '20%', md: '30%' },
              right: { xs: '10%', md: '15%' },
              width: { xs: '150px', md: '200px' },
              height: { xs: '150px', md: '200px' },
              background: 'linear-gradient(135deg, rgba(33, 118, 255, 0.2), rgba(51, 161, 253, 0.1))',
              borderRadius: '50%',
              filter: 'blur(40px)',
              zIndex: 3,
              display: { xs: 'none', md: 'block' },
            }}
          />
        </Box>
      </Box>

      {/* Mobile Background Image Overlay */}
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0, 
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${studentImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
          },
        }}
      />
    </Box>
  );
};

export default Homepage;