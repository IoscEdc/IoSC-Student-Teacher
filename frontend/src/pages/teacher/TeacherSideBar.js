import * as React from 'react';
import { Divider, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Collapse, List } from '@mui/material'; // Added Collapse and List
import { Link, useLocation } from 'react-router-dom';

import HomeIcon from '@mui/icons-material/Home';
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AnnouncementOutlinedIcon from '@mui/icons-material/AnnouncementOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import NotificationsIcon from '@mui/icons-material/Notifications';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import { ExpandLess, ExpandMore } from '@mui/icons-material'; // Added Expand icons
import { useSelector } from 'react-redux';

const TeacherSideBar = ({ open }) => { // Pass 'open' prop
    const { currentUser } = useSelector((state) => state.user);
    const location = useLocation();

    // State for the collapsible class list
    const [openClasses, setOpenClasses] = React.useState(true);

    const handleClassesClick = () => {
        setOpenClasses(!openClasses);
    };

    // Get the list of assignments from the user object
    // Ensure assignedSubjects is populated, otherwise default to empty array
    const assignments = currentUser.assignedSubjects || [];

    return (
        <>
            <React.Fragment>
                <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                        <HomeIcon
                            color={
                                (location.pathname === '/' || location.pathname.startsWith('/Teacher/dashboard'))
                                    ? 'primary'
                                    : 'inherit'
                            }
                        />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                </ListItemButton>

                {/* --- NEW COLLAPSIBLE MENU --- */}
                <ListItemButton onClick={handleClassesClick} sx={{
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Keep parent selected
                    },
                }}
                selected={location.pathname.startsWith("/Teacher/class")}
                >
                    <ListItemIcon>
                        <ClassOutlinedIcon color={location.pathname.startsWith("/Teacher/class") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="My Classes" />
                    {openClasses ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openClasses} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {assignments.length > 0 ? (
                            assignments.map((item) => {
                                // Ensure data is populated
                                const classId = item.classId?._id;
                                const className = item.classId?.sclassName || '...';
                                const subjectName = item.subjectId?.subName || '...';
                                
                                // Don't render if data is missing
                                if (!classId) return null; 
                                
                                const linkPath = `/Teacher/class/${classId}`;

                                return (
                                    <ListItemButton
                                        key={classId}
                                        component={Link}
                                        to={linkPath}
                                        sx={{ 
                                            pl: open ? 4 : 2, // Indent nested items
                                            justifyContent: open ? 'initial' : 'center',
                                        }}
                                        selected={location.pathname === linkPath} // Highlight if active
                                    >
                                        <ListItemIcon sx={{
                                            minWidth: 0,
                                            mr: open ? 2 : 'auto',
                                            justifyContent: 'center',
                                        }}>
                                            <div style={{ // Dot icon
                                                width: 6, 
                                                height: 6, 
                                                backgroundColor: location.pathname === linkPath ? 'white' : 'grey', 
                                                borderRadius: '50%' 
                                            }} />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={`${className}`}
                                            secondary={`${subjectName}`}
                                            secondaryTypographyProps={{ style: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' } }}
                                        />
                                    </ListItemButton>
                                );
                            })
                        ) : (
                            <ListItemButton sx={{ pl: open ? 4 : 2, justifyContent: open ? 'initial' : 'center' }} disabled>
                                <ListItemText primary="No classes assigned" sx={{ opacity: 0.7 }} />
                            </ListItemButton>
                        )}
                    </List>
                </Collapse>
                {/* --- END OF COLLAPSIBLE MENU --- */}

                <ListItemButton component={Link} to="/Teacher/notices">
                    <ListItemIcon>
                        <NotificationsIcon color={location.pathname.startsWith("/Teacher/notices") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Notices" />
                </ListItemButton>
                {/* <ListItemButton component={Link} to="/Teacher/attendance/mark">
                    <ListItemIcon>
                        <GroupsIcon color={location.pathname.startsWith("/Teacher/attendance/mark") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Mark Attendance" />
                </ListItemButton>
                <ListItemButton component={Link} to="/Teacher/attendance/history">
                    <ListItemIcon>
                        <HistoryIcon color={location.pathname.startsWith("/Teacher/attendance/history") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Attendance History" />
                </ListItemButton> */}
                {/* <ListItemButton component={Link} to="/Teacher/complain">
                    <ListItemIcon>
                        <AnnouncementOutlinedIcon color={location.pathname.startsWith("/Teacher/complain") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Complain" />
                </ListItemButton> */}
            </React.Fragment>
            <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <React.Fragment>
                <ListSubheader component="div" inset={open}>
                    User
                </ListSubheader>
                <ListItemButton component={Link} to="/Teacher/profile">
                    <ListItemIcon>
                        <AccountCircleOutlinedIcon color={location.pathname.startsWith("/Teacher/profile") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Profile" />
                </ListItemButton>
                <ListItemButton component={Link} to="/logout">
                    <ListItemIcon>
                        <ExitToAppIcon color={location.pathname.startsWith("/logout") ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItemButton>
            </React.Fragment>
        </>
    )
}

export default TeacherSideBar;