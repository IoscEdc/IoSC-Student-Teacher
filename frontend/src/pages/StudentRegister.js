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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    FormHelperText,
    Modal // <-- Already here, good.
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import styled from 'styled-components';
import bgpic from "../assets/designlogin.jpg";
import { IndigoButton } from '../components/buttonStyles';
import Popup from '../components/Popup';
// Removed unused imports (axios)
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
// --- END DESIGN SYNC ---

const StudentRegister = () => {
    const navigate = useNavigate();

    // All of your existing state and logic is preserved
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        school: '',
        sclassName: '',
        rollNum: ''
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [errors, setErrors] = useState({});

    const [schools, setSchools] = useState([]);
    const [schoolLoading, setSchoolLoading] = useState(true);

    const [classes, setClasses] = useState([]);
    const [classLoading, setClassLoading] = useState(false);

    // --- All useEffects are unchanged ---
    useEffect(() => {
        const fetchSchools = async () => {
            setSchoolLoading(true);
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
                setSchoolLoading(false);
            }
        };
        fetchSchools();
    }, []);

    useEffect(() => {
        if (!formData.school) {
            setClasses([]);
            return;
        }
        const fetchClasses = async () => {
            setClassLoading(true);
            try {
                const response = await api.get(`/Sclasses/school/${formData.school}`);
                const classesData = response.data;
                if (Array.isArray(classesData) && classesData.length > 0) {
                    setClasses(classesData);
                } else {
                    setErrors(prev => ({ ...prev, sclassName: "No classes found for this school." }));
                    setClasses([]);
                }
            } catch (err) {
                setErrors(prev => ({ ...prev, sclassName: "Error loading classes." }));
                console.error("Error fetching classes:", err);
            } finally {
                setClassLoading(false);
            }
        };
        fetchClasses();
    }, [formData.school]);

    // --- All handlers are unchanged ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'school') {
                newState.sclassName = '';
                setClasses([]);
                if (errors.sclassName) {
                    setErrors(p => ({ ...p, sclassName: null }));
                }
            }
            return newState;
        });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Full name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        if (!formData.school) newErrors.school = "Please select your school";
        if (!formData.sclassName) newErrors.sclassName = "Please select your class";
        if (!formData.rollNum) newErrors.rollNum = "Enrollment number is required";
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
                school: formData.school,
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
    // --- END DESIGN SYNC ---

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
                            py: { xs: 3, sm: 4 }, // Slightly less vertical padding for longer form
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            // --- Allow scrolling on mobile if form is too long ---
                            maxHeight: { xs: '95vh', sm: 'auto' },
                            overflowY: { xs: 'auto', sm: 'hidden' }
                        }}
                    >
                        
                        {/* --- DESIGN SYNC: Add Mobile Branding --- */}
                        <MobileBranding />

                        {/* --- DESIGN SYNC: Styled Title --- */}
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 0, // Less margin for register
                                fontWeight: 800,
                                color: usArSamvadTheme.palette.primary.dark,
                                letterSpacing: 1,
                            }}
                        >
                            Student Register
                        </Typography>
                        
                        {/* --- DESIGN SYNC: Styled Subtitle --- */}
                        <Typography
                            variant="body2"
                            sx={{ mb: 1, color: usArSamvadTheme.palette.primary.main, fontWeight: 500 }}
                        >
                            Create your student account
                        </Typography>
                        
                        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ width: "100%", mt: 1 }}>
                            {/* All form fields remain identical, they will just inherit the theme */}
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
                                size="small" // --- DESIGN TWEAK: Make fields smaller for more room ---
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
                                size="small"
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
                                                {school.schoolName}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                                {errors.school && (
                                    <FormHelperText>{errors.school}</FormHelperText>
                                )}
                            </FormControl>

                            <FormControl fullWidth margin="normal" required error={!!errors.sclassName} size="small">
                                <InputLabel id="class-label">Class</InputLabel>
                                <Select
                                    labelId="class-label"
                                    id="sclassName"
                                    name="sclassName"
                                    value={formData.sclassName}
                                    label="Class"
                                    onChange={handleInputChange}
                                    disabled={classLoading || !formData.school}
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
                                size="small"
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
                                disabled={loading || schoolLoading || classLoading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                            </IndigoButton>

                            {/* --- DESIGN SYNC: Styled Link --- */}
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account? 
                                    <StyledLink to="/Student/login">
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
                    sm={5} // Matched from LoginPage
                    md={7} // Matched from LoginPage
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
                            Start Your Journey
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#d7efff", fontSize: "1.1rem", opacity: 0.76 }}>
                            "Learning today, leading tomorrow — where every student's potential is unlocked."
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </ThemeProvider>
    );
};

export default StudentRegister;

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