import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import bgpic from "../assets/designlogin.jpg";
import { IndigoButton } from '../components/buttonStyles';
import Popup from '../components/Popup';
import api from '../api/axiosConfig';

const defaultTheme = createTheme();

const StudentRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    sclassName: '',
    sbatchName: '',
    rollNum: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const classOptions = [
    { value: 'AIDS B1', label: 'AIDS B1' },
    { value: 'AIDS B2', label: 'AIDS B2' },
    { value: 'AIML B1', label: 'AIML B1' },
    { value: 'AIML B2', label: 'AIML B2' },
    { value: 'AR B1', label: 'AR B1' },
    { value: 'AR B2', label: 'AR B2' },
    { value: 'IIOT B1', label: 'IIOT B1' },
    { value: 'IIOT B2', label: 'IIOT B2' },
  ];

  const batchOptions = [
    { value: '2022-2026', label: '2022-2026' },
    { value: '2023-2027', label: '2023-2027' },
    { value: '2024-2028', label: '2024-2028' },
    { value: '2025-2029', label: '2025-2029' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!formData.email.endsWith('@ipu.ac.in') && (!formData.email.endsWith('@std.ggsipu.ac.in'))) {
      newErrors.email = "Email must end with @std.ggsipu.ac.in or @ipu.ac.in";
    }

    // Batch validation
    if (!formData.sbatchName) {
      newErrors.sbatchName = "Batch is required";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Class validation
    if (!formData.sclassName) {
      newErrors.sclassName = "Please select your class";
    }

    // Enrollment number validation
    if (!formData.rollNum) {
      newErrors.rollNum = "Enrollment number is required";
    } else if (formData.rollNum.length < 5) {
      newErrors.rollNum = "Please enter a valid enrollment number";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase(),
        password: formData.password,
        sbatchName: formData.sbatchName,
        sclassName: formData.sclassName,
        rollNum: formData.rollNum,
        role: 'Student'
      };

      const response = await api.post('/StudentReg', registrationData);
      
      if (response.data.success || response.data._id) {
        setMessage("Registration successful! You can now login with your credentials.");
        setShowPopup(true);
        setTimeout(() => {
          navigate('/Student/login');
        }, 2000);
      } else {
        setMessage(response.data.message || "Registration failed");
        setShowPopup(true);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err.response?.data?.error || "Registration failed");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, color: "#2c2143" }}>
              Student Registration
            </Typography>
            <Typography variant="h7">Create your student account to get started</Typography>
            
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email || "Must end with @std.ggsipu.ac.in or @ipu.ac.in"}
                placeholder="yourname@std.ac.in"
              />

              <FormControl fullWidth margin="normal" required error={!!errors.sclassName}>
                <InputLabel id="class-label">Class</InputLabel>
                <Select
                  labelId="class-label"
                  id="sclassName"
                  name="sclassName"
                  value={formData.sclassName}
                  label="Class"
                  onChange={handleInputChange}
                >
                  {classOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.sclassName && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.sclassName}
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth margin="normal" required error={!!errors.sbatchName}>
                <InputLabel id="class-label">Batch</InputLabel>
                <Select
                  labelId="class-label"
                  id="sbatchName"
                  name="sbatchName"
                  value={formData.sbatchName}
                  label="Class"
                  onChange={handleInputChange}
                >
                  {batchOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.sbatchName && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {errors.sbatchName}
                  </Typography>
                )}
              </FormControl>
              

              <TextField
                margin="normal"
                required
                fullWidth
                id="rollNum"
                label="Enrollment Number"
                name="rollNum"
                value={formData.rollNum}
                onChange={handleInputChange}
                error={!!errors.rollNum}
                helperText={errors.rollNum}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <IndigoButton
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </IndigoButton>

              <Grid container justifyContent="center">
                <Grid item>
                  <Button
                    onClick={() => navigate('/Student/login')}
                    sx={{ textTransform: 'none' }}
                  >
                    Already have an account? Sign In
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={false} sm={4} md={7} sx={{
          backgroundImage: `linear-gradient(rgba(25, 118, 210, 0.6), rgba(25, 118, 210, 0.6)), url(${bgpic})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#1976d2',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          textAlign: 'center',
          padding: 4
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>Start Your Journey</Typography>
            <Typography variant="subtitle1">"Learning today, leading tomorrow — where every student's potential is unlocked."</Typography>
          </Box>
        </Grid>
      </Grid>
      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </ThemeProvider>
  );
};

export default StudentRegister;