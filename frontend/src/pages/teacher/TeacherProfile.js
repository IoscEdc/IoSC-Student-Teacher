import React from 'react';
import { useSelector } from 'react-redux';
import { 
    Box, 
    Typography, 
    Paper, 
    Avatar, 
    Grid, 
    Chip, 
    Stack, 
    Divider, 
    Fade,
    alpha,
    List,           // --- Added for assignments
    ListItem,       // --- Added for assignments
    ListItemText,   // --- Added for assignments
    ListItemIcon    // --- Added for assignments
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import BookIcon from '@mui/icons-material/Book';

// This helper component is still perfect for the "School" item
const ProfileDetailItem = ({ label, value, icon: Icon }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.05) }}>
        <Avatar sx={{ bgcolor: 'primary.main', color: 'white' }}>
            {Icon ? <Icon /> : <PersonIcon />}
        </Avatar>
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
            </Typography>
            <Typography variant="body1" fontWeight="500">
                {value || 'Not Assigned'}
            </Typography>
        </Box>
    </Box>
);


const TeacherProfile = () => {
    const { currentUser } = useSelector((state) => state.user);

    // --- CORRECTED DATA ACCESS ---
    // School is a single object
    const schoolName = currentUser.school?.schoolName;
    
    // Assignments is an array
    const assignments = currentUser.assignedSubjects || [];

    return (
        // Root container with vertical padding only (fits in dashboard)
        <Box sx={{ py: { xs: 1.5, sm: 3, md: 4 } }}>
            
            {/* Modern Header (Unchanged) */}
            <Fade in timeout={600}>
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: { xs: 44, sm: 56 },
                                height: { xs: 44, sm: 56 },
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }}
                        >
                            <PersonIcon sx={{ fontSize: { xs: 24, sm: 32 }, color: 'white' }} />
                        </Box>
                        <Box>
                            <Typography 
                                variant="h4" 
                                fontWeight="800"
                                sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 0.5,
                                    fontSize: { xs: '1.5rem', sm: '2.25rem' } 
                                }}
                            >
                                My Profile
                            </Typography>
                            <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                    fontWeight: 500,
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                            >
                                Your personal and professional information
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Fade>

            {/* Main Profile Card */}
            <Fade in timeout={800}>
                <Paper sx={{ 
                    borderRadius: 3, 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                }}>
                    
                    {/* Profile Header Section (Unchanged) */}
                    <Box sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                            <Avatar
                                sx={{
                                    width: { xs: 80, sm: 100 },
                                    height: { xs: 80, sm: 100 },
                                    fontSize: { xs: '2.5rem', sm: '3rem' },
                                    bgcolor: 'primary.main',
                                    boxShadow: 3
                                }}
                            >
                                {currentUser.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Typography variant="h5" fontWeight="700">
                                    {currentUser.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    {currentUser.email}
                                </Typography>
                                <Chip label={currentUser.role} color="primary" size="small" sx={{ fontWeight: 600 }} />
                            </Box>
                        </Stack>
                    </Box>
                    
                    {/* --- REFACTORED: Profile Details Section --- */}
                    <Box sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                            Details
                        </Typography>
                        
                        {/* School (Single Item) */}
                        <Box sx={{ mb: 3 }}>
                            <ProfileDetailItem label="School" value={schoolName} icon={SchoolIcon} />
                        </Box>

                        {/* Teaching Assignments (List) */}
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                            Teaching Classes
                        </Typography>
                        
                        {assignments.length > 0 ? (
                            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                                <List disablePadding>
                                    {assignments.map((assignment, index) => (
                                        <React.Fragment key={assignment.classId?._id + assignment.subjectId?._id}>
                                            <ListItem>
                                                <ListItemIcon>
                                                    {/* Use different icons for visual separation */}
                                                    {index % 2 === 0 ? <ClassIcon color="primary" /> : <BookIcon color="secondary" />}
                                                </ListItemIcon>
                                                <ListItemText 
                                                    primary={assignment.subjectId?.subName || 'Unassigned Subject'} 
                                                    primaryTypographyProps={{ fontWeight: '500' }}
                                                    secondary={assignment.classId?.sclassName || 'Unassigned Class'}
                                                />
                                            </ListItem>
                                            {index < assignments.length - 1 && <Divider component="li" />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            </Paper>
                        ) : (
                            // Fallback message if no assignments are found
                            <Typography color="text.secondary">
                                No teaching assignments found.
                            </Typography>
                        )}
                    </Box>

                </Paper>
            </Fade>
        </Box>
    );
}

export default TeacherProfile;