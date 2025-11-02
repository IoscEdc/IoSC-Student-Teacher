import { useEffect, useState } from 'react';
import { 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Tooltip,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Container,
  CircularProgress,
  Fade
} from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClassIcon from '@mui/icons-material/Class';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from '../../../redux/userRelated/userHandle';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { BlueButton, GreenButton } from '../../../components/buttonStyles';

import PostAddIcon from '@mui/icons-material/PostAdd';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import AddCardIcon from '@mui/icons-material/AddCard';
import SchoolIcon from '@mui/icons-material/School';
import styled from 'styled-components';
import Popup from '../../../components/Popup';

// Brand Colors
const brandDark = '#0f2b6e';
const brandPrimary = '#2176FF';

const ShowClasses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { sclassesList, loading, error, getresponse } = useSelector((state) => state.sclass);
  const { currentUser } = useSelector(state => state.user);

  const adminID = currentUser._id;

  useEffect(() => {
    dispatch(getAllSclasses(adminID, "Sclass"));
  }, [adminID, dispatch]);

  if (error) {
    console.log(error);
  }

  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");

  const deleteHandler = (deleteID, address) => {
    console.log(deleteID);
    console.log(address);
    setMessage("Sorry the delete function has been disabled for now.");
    setShowPopup(true);
  };

  const ClassCard = ({ sclass, index }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const actions = [
      { 
        icon: <PostAddIcon sx={{ color: brandPrimary }} />, 
        name: 'Add Subjects', 
        action: () => {
          handleMenuClose();
          navigate("/Admin/addsubject/" + sclass._id);
        }
      },
      { 
        icon: <PersonAddAlt1Icon sx={{ color: brandPrimary }} />, 
        name: 'Add Student', 
        action: () => {
          handleMenuClose();
          navigate("/Admin/class/addstudents/" + sclass._id);
        }
      },
      { 
        icon: <DeleteIcon sx={{ color: '#ff3366' }} />, 
        name: 'Delete Class', 
        action: () => {
          handleMenuClose();
          deleteHandler(sclass._id, "Sclass");
        }
      },
    ];

    return (
      <Fade in={true} timeout={300 + (index * 100)}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <StyledCard>
            <CardHeader>
              <IconWrapper>
                <ClassIcon sx={{ fontSize: '1.8rem', color: 'white' }} />
              </IconWrapper>
              <Tooltip title="More Actions">
                <IconButton 
                  size="small" 
                  onClick={handleMenuClick}
                  sx={{ 
                    color: brandDark,
                    '&:hover': { 
                      background: 'rgba(33, 118, 255, 0.1)' 
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </CardHeader>

            <CardContent sx={{ p: 2.5, pt: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: brandDark,
                  mb: 2,
                  minHeight: '28px'
                }}
              >
                {sclass.sclassName}
              </Typography>

              <ClassInfoBox>
                <InfoItem>
                  <SchoolIcon sx={{ fontSize: '1rem', color: brandPrimary }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                    Class
                  </Typography>
                </InfoItem>
              </ClassInfoBox>

              <ActionButtonsContainer>
                <ViewButton
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate("/Admin/classes/class/" + sclass._id)}
                  fullWidth
                >
                  View Details
                </ViewButton>
              </ActionButtonsContainer>
            </CardContent>

            <CardFooter />

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  ...styles.styledPaper,
                  minWidth: 200,
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {actions.map((action, idx) => (
                <MenuItem 
                  key={idx} 
                  onClick={action.action}
                  sx={{
                    py: 1.5,
                    '&:hover': {
                      background: 'rgba(33, 118, 255, 0.08)'
                    }
                  }}
                >
                  <ListItemIcon>
                    {action.icon}
                  </ListItemIcon>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {action.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </StyledCard>
        </Grid>
      </Fade>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <HeaderSection>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              color: brandDark,
              fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2rem' },
              mb: 0.5
            }}
          >
            Classes
          </Typography>
          <Typography 
            sx={{ 
              color: '#666',
              fontSize: { xs: '0.875rem', sm: '0.95rem' }
            }}
          >
            Manage all your classes
          </Typography>
        </Box>

        <AddClassButton
          variant="contained"
          startIcon={<AddCardIcon />}
          onClick={() => navigate("/Admin/addclass")}
        >
          Add New Class
        </AddClassButton>
      </HeaderSection>

      {loading ? (
        <LoadingContainer>
          <CircularProgress size={50} thickness={4} sx={{ color: brandPrimary }} />
          <Typography sx={{ mt: 2, color: '#666', fontWeight: 500 }}>
            Loading classes...
          </Typography>
        </LoadingContainer>
      ) : getresponse ? (
        <EmptyStateContainer>
          <EmptyStateIcon>
            <ClassIcon sx={{ fontSize: '3.5rem', color: '#99b3ff' }} />
          </EmptyStateIcon>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700,
              color: brandDark,
              mb: 1,
              fontSize: { xs: '1.2rem', sm: '1.4rem' }
            }}
          >
            No Classes Found
          </Typography>
          <Typography 
            sx={{ 
              color: '#666',
              mb: 3,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Get started by adding your first class
          </Typography>
          <GreenButton 
            variant="contained" 
            startIcon={<AddCardIcon />}
            onClick={() => navigate("/Admin/addclass")}
            sx={{ px: 4, py: 1.5 }}
          >
            Add Class
          </GreenButton>
        </EmptyStateContainer>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {Array.isArray(sclassesList) && sclassesList.length > 0 &&
            sclassesList.map((sclass, index) => (
              <ClassCard key={sclass._id} sclass={sclass} index={index} />
            ))
          }
        </Grid>
      )}

      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </Container>
  );
};

export default ShowClasses;

// Styled Components
const HeaderSection = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1px solid rgba(33, 118, 255, 0.15);
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 600px) {
    padding: 20px 16px;
    margin-bottom: 24px;
  }
`;

const AddClassButton = styled.button`
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(33, 118, 255, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(33, 118, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 600px) {
    padding: 10px 20px;
    font-size: 0.8rem;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 16px !important;
  border: 1px solid rgba(33, 118, 255, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: white !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 32px rgba(33, 118, 255, 0.2) !important;
    border-color: rgba(33, 118, 255, 0.4) !important;
  }

  @media (max-width: 600px) {
    border-radius: 12px !important;
  }
`;

const CardHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(33, 118, 255, 0.08) 0%, rgba(15, 43, 110, 0.08) 100%);
  border-bottom: 1px solid rgba(33, 118, 255, 0.15);

  @media (max-width: 600px) {
    padding: 14px 16px;
  }
`;

const IconWrapper = styled(Box)`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(33, 118, 255, 0.3);

  @media (max-width: 600px) {
    width: 45px;
    height: 45px;
  }
`;

const ClassInfoBox = styled(Box)`
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: rgba(33, 118, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(33, 118, 255, 0.1);
`;

const InfoItem = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const ActionButtonsContainer = styled(Box)`
  display: flex;
  gap: 8px;
  margin-top: auto;
`;

const ViewButton = styled.button`
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  @media (max-width: 600px) {
    padding: 9px 14px;
    font-size: 0.8rem;
  }
`;

const CardFooter = styled(Box)`
  height: 4px;
  background: linear-gradient(90deg, ${brandPrimary} 0%, ${brandDark} 100%);
  margin-top: auto;
`;

const LoadingContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 16px;

  @media (max-width: 600px) {
    padding: 60px 20px;
    min-height: 300px;
  }
`;

const EmptyStateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
  text-align: center;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 16px;
  border: 2px dashed rgba(33, 118, 255, 0.25);

  @media (max-width: 600px) {
    padding: 60px 20px;
    min-height: 300px;
  }
`;

const EmptyStateIcon = styled(Box)`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d9e7ff 0%, #ccdeff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 50%;
    border: 2px dashed rgba(33, 118, 255, 0.25);
  }

  @media (max-width: 600px) {
    width: 80px;
    height: 80px;
  }
`;

const styles = {
  styledPaper: {
    overflow: 'visible',
    filter: 'drop-shadow(0px 2px 8px rgba(33,118,255,0.15))',
    mt: 1.5,
    borderRadius: '12px',
    '& .MuiAvatar-root': {
      width: 32,
      height: 32,
      ml: -0.5,
      mr: 1,
    },
    '&:before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      right: 14,
      width: 10,
      height: 10,
      bgcolor: 'background.paper',
      transform: 'translateY(-50%) rotate(45deg)',
      zIndex: 0,
    },
  }
};