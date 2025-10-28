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
    CircularProgress
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
        school: '',
        teachSubject: '',
        teachSclass: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});



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
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!formData.school.trim()) newErrors.school = 'School is required';
        if (!formData.teachSclass.trim()) newErrors.teachSclass = 'Teaching class is required';

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
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
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

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="school"
                                label="School ID"
                                name="school"
                                value={formData.school}
                                onChange={handleInputChange}
                                error={!!errors.school}
                                helperText={errors.school || "Enter the school ID you'll be teaching at"}
                            />

                            <TextField
                                margin="normal"
                                fullWidth
                                id="teachSubject"
                                label="Teaching Subject (Optional)"
                                name="teachSubject"
                                value={formData.teachSubject}
                                onChange={handleInputChange}
                                helperText="Enter the subject you'll be teaching"
                            />

                            <TextField
                                margin="normal"
                                fullWidth
                                id="teachSclass"
                                label="Teaching Class"
                                required
                                name="teachSclass"
                                value={formData.teachSclass}
                                onChange={handleInputChange}
                                helperText="Enter the class ID you'll be teaching"
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