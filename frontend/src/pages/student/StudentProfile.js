import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Avatar, 
  Container, 
  Paper,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { 
  School as SchoolIcon,
  Class as ClassIcon,
  Badge as BadgeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const StudentProfile = () => {
  const { currentUser, response, error } = useSelector((state) => state.user);

  if (response) { console.log(response) }
  else if (error) { console.log(error) }

  const sclassName = currentUser?.sclassName;
  const studentSchool = currentUser?.school;

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Loading profile...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header Card */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Avatar 
                  alt={currentUser.name} 
                  sx={{ 
                    width: 120, 
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    border: '4px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  {String(currentUser.name).charAt(0).toUpperCase()}
                </Avatar>
              </Grid>
              
              <Grid item xs={12} md={9}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {currentUser.name}
                </Typography>
                
                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip 
                    icon={<BadgeIcon />}
                    label={`Roll No: ${currentUser.rollNum}`}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Chip 
                    icon={<ClassIcon />}
                    label={`Class: ${sclassName?.sclassName || 'N/A'}`}
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                </Stack>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SchoolIcon />
                  <Typography variant="h6">
                    {studentSchool?.schoolName || 'School Name'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Account Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Account Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Student Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {currentUser.name}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Roll Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {currentUser.rollNum}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Student ID
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all'
                      }}
                    >
                      {currentUser._id}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Information Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Academic Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Class
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {sclassName?.sclassName || 'Not Assigned'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      School
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {studentSchool?.schoolName || 'School Name'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Class ID
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        wordBreak: 'break-all'
                      }}
                    >
                      {sclassName?._id || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentProfile;