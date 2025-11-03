import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    FormHelperText // <-- Added this import
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import styled from 'styled-components';
import bgpic from "../assets/designlogin.jpg";
import { IndigoButton } from '../components/buttonStyles';
import Popup from '../components/Popup';
import api from '../api/axiosConfig';

// --- DESIGN SYNC: Copied theme from LoginPage ---
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

const TeacherRegister = () => {
    const navigate = useNavigate();

    // --- All of your existing logic is preserved ---
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
    const [schoolLoading, setSchoolLoading] = useState(true); // Added this state

    // Fetch schools on component mount
    useEffect(() => {
        const fetchSchools = async () => {
            setSchoolLoading(true); // Set loading true at the start
            try {
                const response = await api.get('/Schools');
                const schoolData = response.data.schools || response.data;
                if (Array.isArray(schoolData) && schoolData.length > 0) {
                    setSchools(schoolData);
                } else {
                    setErrors(prev => ({ ...prev, school: "No schools found." }));
                }
            } catch (err) {
                setErrors(prev => ({ ...prev, school: "Error loading schools." }));
                console.error("Error fetching schools:", err);
            } finally {
                setSchoolLoading(false); // Set loading false at the end
            }
        };
        fetchSchools();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '' // Clear error string
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
    // --- End of existing logic ---


    // --- DESIGN SYNC: Copied MobileBranding from LoginPage ---
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
        // --- DESIGN SYNC: Use usArSamvadTheme ---
        <ThemeProvider theme={usArSamvadTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />

                {/* --- DESIGN SYNC: Left Side (Form) --- */}
                <Grid item xs={12} sm={7} md={5}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: usArSamvadTheme.palette.primary.dark, 
                        boxShadow: { md: 6 },
                    }}
                >
                    {/* --- DESIGN SYNC: White Form Box --- */}
                    <Box
                        sx={{
                            width: { xs: "90%", sm: 400 },
                            backgroundColor: "rgba(255,255,255,0.95)",
                            borderRadius: 4,
                            boxShadow: 5,
                            px: { xs: 2, sm: 4 },
                            py: { xs: 3, sm: 4 }, 
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            maxHeight: { xs: '95vh', sm: 'auto' },
                            overflowY: { xs: 'auto', sm: 'hidden' }
                        }}
                    >
                        
                        <MobileBranding />

                        {/* --- DESIGN SYNC: Styled Title --- */}
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 1,
                                fontWeight: 800,
                                color: usArSamvadTheme.palette.primary.dark,
                                letterSpacing: 1,
                            }}
                        >
                            Teacher Registration
                        </Typography>
                        
                        {/* --- DESIGN SYNC: Styled Subtitle --- */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, color: usArSamvadTheme.palette.primary.main, fontWeight: 500 }}
                        >
                            Create your teacher account
                        </Typography>
                        
                        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: "100%", mt: 1 }}>
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
                                size="small"
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
                                size="small"
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
                                size="small"
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

                            <FormControl fullWidth margin="normal" required error={!!errors.school} size="small">
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
                                                {school.schoolName || school.name}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                                {errors.school && <FormHelperText>{errors.school}</FormHelperText>}
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
                                size="small"
                            />

                            {/* --- DESIGN SYNC: Styled Button --- */}
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
                                    background: `linear-gradient(90deg, ${usArSamvadTheme.palette.primary.main} 40%, ${usArSamvadTheme.palette.secondary.main} 100%)`,
                                    '&:hover': {
                                        background: usArSamvadTheme.palette.primary.dark,
                                    },
                                    boxShadow: '0 4px 10px rgba(33, 118, 255, 0.4)',
                                }}
                                disabled={loading || schoolLoading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                            </IndigoButton>

                            {/* --- DESIGN SYNC: Styled Link --- */}
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account? 
                                    <StyledLink to="/Teacher/login">
                                        &nbsp;Sign In
                                    </StyledLink>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
                
                {/* --- DESIGN SYNC: Right Side (Banner) --- */}
                <Grid
                    item
                    xs={false}
                    sm={5}
                    md={7}
                    sx={{
                        backgroundImage: `linear-gradient(135deg, ${usArSamvadTheme.palette.primary.dark} 70%, #1b263b 100%), url(${bgpic})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: { xs: 'none', sm: 'flex' },
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
                            Join Our Faculty
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#d7efff", fontSize: "1.1rem", opacity: 0.76 }}>
                            "Empowering minds, shaping futures — where great teachers make the difference."
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </ThemeProvider>
    );
};

export default TeacherRegister;

// --- DESIGN SYNC: Copied StyledLink from LoginPage ---
const StyledLink = styled(Link)`
    text-decoration: none;
    color: ${usArSamvadTheme.palette.primary.main}; 
    font-weight: 600;
    transition: color 0.3s;
    &:hover {
        color: ${usArSamvadTheme.palette.primary.dark};
    }
`;