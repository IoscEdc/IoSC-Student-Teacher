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
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import bgpic from "../assets/designlogin.jpg";
import { IndigoButton } from '../components/buttonStyles';
import Popup from '../components/Popup';
import api from '../api/axiosConfig';

const defaultTheme = createTheme();

const TeacherRegister = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Teacher',
        department: '',
        school: '' // School/Admin ID
    });

    const [schools, setSchools] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    // Fetch schools on component mount
    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const response = await api.get('/schools'); // Adjust endpoint as needed
            console.log('Fetched schools:', response.data);
            setSchools(response.data || []);
        } catch (error) {
            console.error('Error fetching schools:', error);
        }
    };

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
                [name]: false
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        
        if (!formData.school) newErrors.school = 'Please select a school';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await api.post('/TeacherReg', formData);

            if (response.data.success) {
                setMessage('Registration successful! You can now login.');
                setShowPopup(true);
                setTimeout(() => {
                    navigate('/Teacher/login');
                }, 2000);
            } else {
                setMessage(response.data.message || 'Registration failed');
                setShowPopup(true);
            }
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed');
            setShowPopup(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ overflowY: 'auto' }}>
                    <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ mb: 2, color: "#2c2143" }}>
                            Teacher Registration
                        </Typography>
                        <Typography variant="h7">Create your teacher account to get started</Typography>

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
                                helperText={errors.email}
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

                            <FormControl fullWidth margin="normal" required error={!!errors.school}>
                                <InputLabel id="school-label">School</InputLabel>
                                <Select
                                    labelId="school-label"
                                    id="school"
                                    name="school"
                                    value={formData.school}
                                    label="School"
                                    onChange={handleInputChange}
                                >
                                    {schools.map((school) => (
                                        <MenuItem key={school._id} value={school._id}>
                                            {school.schoolName || school.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.school && <Typography variant="caption" color="error">{errors.school}</Typography>}
                            </FormControl>

                            <TextField
                                margin="normal"
                                fullWidth
                                id="department"
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                placeholder="e.g., Mathematics, Science"
                            />

                            <IndigoButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                            </IndigoButton>

                            <Grid container justifyContent="center">
                                <Grid item>
                                    <Button
                                        onClick={() => navigate('/Teacher/login')}
                                        sx={{ color: '#2c2143' }}
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
                        <Typography variant="h4" fontWeight="bold" gutterBottom>Join Our Faculty</Typography>
                        <Typography variant="subtitle1">"Empowering minds, shaping futures — where great teachers make the difference."</Typography>
                    </Box>
                </Grid>
            </Grid>

            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </ThemeProvider>
    );
};

export default TeacherRegister;