import React, { useState, useEffect } from 'react';
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
  FormHelperText
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
    school: '', // <-- ADDED
    sclassName: '',
    rollNum: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // State for fetched schools
  const [schools, setSchools] = useState([]);
  const [schoolLoading, setSchoolLoading] = useState(true); // Start true

  // State for fetched classes
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false); // Start false

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      setSchoolLoading(true);
      try {
        // --- NOTE: Make sure this endpoint exists on your backend ---
        // This should return an array of school objects, e.g., [{ _id: "123", schoolName: "My School" }]
        // Based on your schema, this might be an '/Admins' route. I'll use '/Schools'
        const response = await api.get('/Schools');
        
        const schoolData = response.data.schools || response.data; // Handle { success: true, schools: [] } or just []

        if (Array.isArray(schoolData) && schoolData.length > 0) {
          setSchools(schoolData);
        } else {
          setErrors(prev => ({ ...prev, school: "No schools found." }));
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, school: "Error loading schools." }));
        console.error("Error fetching schools:", err);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchSchools();
  }, []);

  // Fetch classes *when school changes*
  useEffect(() => {
    // Don't fetch if no school is selected
    if (!formData.school) {
      setClasses([]); // Clear any existing classes
      return;
    }

    const fetchClasses = async () => {
      setClassLoading(true);
      try {
        // --- NOTE: Make sure this endpoint exists on your backend ---
        // This should return classes filtered by the school ID
        const response = await api.get(`/Sclasses/school/${formData.school}`);
        
        const classesData = response.data;

        if (Array.isArray(classesData) && classesData.length > 0) {
          setClasses(classesData);
        } else {
          setErrors(prev => ({ ...prev, sclassName: "No classes found for this school." }));
          setClasses([]); // Ensure class list is empty
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, sclassName: "Error loading classes." }));
        console.error("Error fetching classes:", err);
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, [formData.school]); // This effect depends on the selected school

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const newState = { ...prev, [name]: value };

      // If user changes school, reset the class selection
      if (name === 'school') {
        newState.sclassName = '';
        setClasses([]); // Clear the class list
        if (errors.sclassName) {
          setErrors(p => ({ ...p, sclassName: null })); // Clear class error
        }
      }
      return newState;
    });

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
    
    // ... (Name, Email, Password validations are unchanged) ...
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";


    // School validation
    if (!formData.school) {
      newErrors.school = "Please select your school";
    }

    // Class validation
    if (!formData.sclassName) {
      newErrors.sclassName = "Please select your class";
    }

    // Enrollment number validation
    if (!formData.rollNum) {
      newErrors.rollNum = "Enrollment number is required";
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
        school: formData.school, // <-- ADDED (this is the school _id)
        sclassName: formData.sclassName, // This is the class _id
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
              {/* ... (Name and Email TextFields are unchanged) ... */}
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

              {/* --- NEW SCHOOL DROPDOWN --- */}
              <FormControl fullWidth margin="normal" required error={!!errors.school}>
                <InputLabel id="school-label">School</InputLabel>
                <Select
                  labelId="school-label"
                  id="school"
                  name="school"
                  value={formData.school}
                  label="School"
                  onChange={handleInputChange}
                  disabled={schoolLoading}
                >
                  {schoolLoading ? (
                    <MenuItem value="" disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Loading schools...</Typography>
                      </Box>
                    </MenuItem>
                  ) : (
                    schools.map((school) => (
                      <MenuItem key={school._id} value={school._id}>
                        {school.schoolName} {/* Assuming 'schoolName' field */}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.school && (
                  <FormHelperText>{errors.school}</FormHelperText>
                )}
              </FormControl>

              {/* --- MODIFIED CLASS DROPDOWN --- */}
              <FormControl fullWidth margin="normal" required error={!!errors.sclassName}>
                <InputLabel id="class-label">Class</InputLabel>
                <Select
                  labelId="class-label"
                  id="sclassName"
                  name="sclassName"
                  value={formData.sclassName}
                  label="Class"
                  onChange={handleInputChange}
                  disabled={classLoading || !formData.school} // Disabled if loading or no school selected
                >
                  {classLoading ? (
                    <MenuItem value="" disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2">Loading classes...</Typography>
                      </Box>
                    </MenuItem>
                  ) : !formData.school ? (
                    <MenuItem value="" disabled>
                      Please select a school first
                    </MenuItem>
                  ) : (
                    classes.map((option) => (
                      <MenuItem key={option._id} value={option._id}>
                        {option.sclassName}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.sclassName && (
                  <FormHelperText>{errors.sclassName}</FormHelperText>
                )}
              </FormControl>
              
              {/* ... (RollNum, Password, Confirm Password TextFields are unchanged) ... */}
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
                disabled={loading || schoolLoading || classLoading} // Disable if any data is loading
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
        {/* ... (Right side image Grid is unchanged) ... */}
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