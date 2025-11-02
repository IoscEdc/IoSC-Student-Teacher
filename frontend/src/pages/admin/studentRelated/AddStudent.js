import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../../redux/userRelated/userHandle';
import Popup from '../../../components/Popup';
import { underControl } from '../../../redux/userRelated/userSlice';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import {
    Box,
    TextField,
    Button,
    Typography,
    Container,
    Paper,
    CircularProgress,
    MenuItem,
    InputAdornment,
    IconButton,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    PersonOutline,
    SchoolOutlined,
    NumbersOutlined,
    LockOutlined,
    Visibility,
    VisibilityOff,
    AddCircleOutline
} from '@mui/icons-material';

const AddStudent = ({ situation }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();

    const userState = useSelector(state => state.user);
    const { status, currentUser, response, error } = userState;
    const { sclassesList } = useSelector((state) => state.sclass);

    const [name, setName] = useState('');
    const [rollNum, setRollNum] = useState('');
    const [universityId, setUniversityId] = useState('');
    const [password, setPassword] = useState('');
    const [className, setClassName] = useState('');
    const [sclassName, setSclassName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const adminID = currentUser._id;
    const role = "Student";
    const attendance = [];

    useEffect(() => {
        if (situation === "Class") {
            setSclassName(params.id);
        }
    }, [params.id, situation]);

    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");
    const [loader, setLoader] = useState(false);

    useEffect(() => {
        dispatch(getAllSclasses(adminID, "Sclass"));
    }, [adminID, dispatch]);

    const changeHandler = (event) => {
        if (event.target.value === 'Select Class') {
            setClassName('Select Class');
            setSclassName('');
        } else {
            const selectedClass = sclassesList.find(
                (classItem) => classItem.sclassName === event.target.value
            );
            setClassName(selectedClass.sclassName);
            setSclassName(selectedClass._id);
        }
    };

    const fields = { name, rollNum, universityId: rollNum, password, sclassName, adminID, role, attendance };

    const submitHandler = (event) => {
        event.preventDefault();
        if (sclassName === "") {
            setMessage("Please select a classname");
            setShowPopup(true);
        } else {
            setLoader(true);
            dispatch(registerUser(fields, role));
        }
    };

    useEffect(() => {
        if (status === 'added') {
            dispatch(underControl());
            navigate(-1);
        } else if (status === 'failed') {
            setMessage(response);
            setShowPopup(true);
            setLoader(false);
        } else if (status === 'error') {
            setMessage("Network Error");
            setShowPopup(true);
            setLoader(false);
        }
    }, [status, navigate, error, response, dispatch]);

    return (
        <>
            <Box
                sx={{
                    minHeight: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: { xs: 3, sm: 4, md: 6 },
                    px: { xs: 2, sm: 3 }
                }}
            >
                <Container maxWidth="sm">
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        {/* Header */}
                        <Box
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                p: { xs: 3, sm: 4 },
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: { xs: 60, sm: 70 },
                                    height: { xs: 60, sm: 70 },
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 2,
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <AddCircleOutline sx={{ fontSize: { xs: 30, sm: 36 }, color: 'white' }} />
                            </Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: { xs: '1.5rem', sm: '2rem' }
                                }}
                            >
                                Add New Student
                            </Typography>
                            <Typography
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    mt: 1,
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }}
                            >
                                Fill in the student details below
                            </Typography>
                        </Box>

                        {/* Form */}
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Box component="form" onSubmit={submitHandler}>
                                {/* Name Field */}
                                <TextField
                                    fullWidth
                                    label="Student Name"
                                    placeholder="Enter student's full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutline color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                            }
                                        }
                                    }}
                                />

                                {/* Class Selection (conditional) */}
                                {situation === "Student" && (
                                    <TextField
                                        fullWidth
                                        select
                                        label="Class"
                                        value={className}
                                        onChange={changeHandler}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SchoolOutlined color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            mb: 3,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: '#667eea',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#667eea',
                                                }
                                            }
                                        }}
                                    >
                                        <MenuItem value="Select Class">Select Class</MenuItem>
                                        {sclassesList?.map((classItem, index) => (
                                            <MenuItem key={index} value={classItem.sclassName}>
                                                {classItem.sclassName}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}

                                {/* Roll Number Field */}
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Roll Number"
                                    placeholder="Enter student's roll number"
                                    value={rollNum}
                                    onChange={(e) => setRollNum(e.target.value)}
                                    required
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <NumbersOutlined color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                            }
                                        }
                                    }}
                                />

                                {/* Password Field */}
                                <TextField
                                    fullWidth
                                    type={showPassword ? 'text' : 'password'}
                                    label="Password"
                                    placeholder="Enter student's password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        mb: 4,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            '&:hover fieldset': {
                                                borderColor: '#667eea',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#667eea',
                                            }
                                        }
                                    }}
                                />

                                {/* Submit Button */}
                                <Button
                                    fullWidth
                                    type="submit"
                                    variant="contained"
                                    disabled={loader}
                                    sx={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        py: { xs: 1.5, sm: 1.75 },
                                        fontSize: { xs: '1rem', sm: '1.1rem' },
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)',
                                            transform: 'translateY(-2px)'
                                        },
                                        '&:disabled': {
                                            background: '#ccc'
                                        },
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {loader ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Add Student'
                                    )}
                                </Button>

                                {/* Cancel Button */}
                                <Button
                                    fullWidth
                                    variant="text"
                                    onClick={() => navigate(-1)}
                                    sx={{
                                        mt: 2,
                                        color: 'text.secondary',
                                        textTransform: 'none',
                                        fontSize: { xs: '0.875rem', sm: '1rem' },
                                        '&:hover': {
                                            bgcolor: 'action.hover'
                                        }
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </>
    );
};

export default AddStudent;