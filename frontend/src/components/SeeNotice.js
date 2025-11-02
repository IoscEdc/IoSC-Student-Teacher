import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotices } from '../redux/noticeRelated/noticeHandle';
import { 
  Paper, 
  Box, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent,
  Chip,
  Stack,
  Divider,
  Grid
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import styled from 'styled-components';

// --- Brand Colors ---
const brandDark = '#0f2b6e';
const brandPrimary = '#2176FF';

const SeeNotice = () => {
  const dispatch = useDispatch();
  
  const { currentUser, currentRole } = useSelector(state => state.user);
  const { noticesList, loading, error, response } = useSelector(state => state.notice);

  useEffect(() => {
    if (currentUser && currentRole === "Admin") {
      dispatch(getAllNotices(currentUser._id, "Notice"));
    } else if (currentUser) {
      dispatch(getAllNotices(null, "Notice"));
    }
  }, [dispatch, currentUser, currentRole]);

  const noticeRows = Array.isArray(noticesList)
    ? noticesList.map((notice) => {
        const date = new Date(notice.date);
        const dateString = date.toString() !== "Invalid Date"
          ? date.toISOString().substring(0, 10)
          : "Invalid Date";
        return {
          title: notice.title,
          details: notice.details,
          date: dateString,
          id: notice._id,
        };
      })
    : [];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if notice is recent (within 7 days)
  const isRecentNotice = (dateString) => {
    const noticeDate = new Date(dateString);
    const now = new Date();
    const diffTime = now - noticeDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <Container>
      {loading ? (
        <LoadingBox>
          <CircularProgress size={40} thickness={4} sx={{ color: brandPrimary }} />
          <Typography sx={{ mt: 2, color: '#666', fontSize: '0.875rem', fontWeight: 500 }}>
            Loading notices...
          </Typography>
        </LoadingBox>
      ) : response || noticeRows.length === 0 ? (
        <EmptyStateBox>
          <EmptyStateIcon>
            <NotificationsIcon sx={{ fontSize: '2.5rem', color: '#99b3ff' }} />
          </EmptyStateIcon>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: '1.1rem',
              color: brandDark,
              fontWeight: 700,
              mb: 1
            }}
          >
            No Notices Available
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#667085', maxWidth: '350px' }}>
            Check back later for updates and announcements.
          </Typography>
        </EmptyStateBox>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2, md: 2.5 }}>
          {noticeRows.map((notice, index) => (
            <Grid item xs={12} sm={6} lg={4} key={notice.id}>
              <NoticeCard elevation={0}>
                <CardHeader>
                  <CategoryBadge>
                    <DescriptionIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                    Announcement
                  </CategoryBadge>
                  {isRecentNotice(notice.date) && (
                    <NewBadge label="New" size="small" />
                  )}
                </CardHeader>
                
                <CardContent sx={{ p: 2, pt: 1.5 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: brandDark,
                      mb: 1.5,
                      lineHeight: 1.3,
                      minHeight: '42px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {notice.title}
                  </Typography>
                  
                  <Divider sx={{ mb: 1.5, borderColor: `rgba(33, 118, 255, 0.15)` }} />
                  
                  <DetailsBox>
                    <Typography 
                      sx={{ 
                        color: '#475467',
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '40px'
                      }}
                    >
                      {notice.details}
                    </Typography>
                  </DetailsBox>
                  
                  <DateBox>
                    <CalendarIcon sx={{ fontSize: '1rem', color: brandPrimary }} />
                    <Typography 
                      sx={{ 
                        color: brandPrimary,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.2px'
                      }}
                    >
                      {formatDate(notice.date)}
                    </Typography>
                  </DateBox>
                </CardContent>
                
                <CardFooter />
              </NoticeCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled(Box)`
  width: 100%;
  padding: 0;
`;

const LoadingBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  min-height: 250px;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 12px;

  @media (max-width: 600px) {
    padding: 40px 20px;
    min-height: 200px;
  }
`;

const EmptyStateBox = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  min-height: 250px;
  text-align: center;
  background: linear-gradient(135deg, #e8f0ff 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px dashed rgba(33, 118, 255, 0.25);

  @media (max-width: 600px) {
    padding: 40px 20px;
    min-height: 200px;
  }
`;

const EmptyStateIcon = styled(Box)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d9e7ff 0%, #ccdeff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    border: 2px dashed rgba(33, 118, 255, 0.25);
  }

  @media (max-width: 600px) {
    width: 70px;
    height: 70px;
    margin-bottom: 12px;
  }
`;

const NoticeCard = styled(Card)`
  border-radius: 12px !important;
  border: 1px solid rgba(33, 118, 255, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: white !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(33, 118, 255, 0.18) !important;
    border-color: rgba(33, 118, 255, 0.4) !important;
  }

  @media (max-width: 600px) {
    border-radius: 10px !important;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const CardHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(33, 118, 255, 0.08) 0%, rgba(15, 43, 110, 0.08) 100%);
  border-bottom: 1px solid rgba(33, 118, 255, 0.15);

  @media (max-width: 600px) {
    padding: 10px 14px;
  }
`;

const CategoryBadge = styled(Box)`
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, ${brandPrimary} 0%, ${brandDark} 100%);
  color: white;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  text-transform: uppercase;

  @media (max-width: 600px) {
    font-size: 0.65rem;
    padding: 4px 8px;
  }
`;

const NewBadge = styled(Chip)`
  background: linear-gradient(135deg, #ff6b9d 0%, #ff3366 100%) !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 0.65rem !important;
  height: 22px !important;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(255, 51, 102, 0.7);
    }
    50% {
      box-shadow: 0 0 0 5px rgba(255, 51, 102, 0);
    }
  }

  @media (max-width: 600px) {
    font-size: 0.6rem !important;
    height: 20px !important;
  }
`;

const DetailsBox = styled(Box)`
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(33, 118, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid ${brandPrimary};

  @media (max-width: 600px) {
    padding: 8px;
    margin-bottom: 10px;
  }
`;

const DateBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(135deg, rgba(33, 118, 255, 0.1) 0%, rgba(33, 118, 255, 0.05) 100%);
  border-radius: 6px;
  margin-top: auto;

  @media (max-width: 600px) {
    padding: 7px 9px;
  }
`;

const CardFooter = styled(Box)`
  height: 3px;
  background: linear-gradient(90deg, ${brandPrimary} 0%, ${brandDark} 100%);
  margin-top: auto;
`;

export default SeeNotice;