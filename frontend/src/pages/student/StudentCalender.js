import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    IconButton,
    Card,
    CardContent,
    Chip,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Badge,
    Tooltip,
    InputAdornment,
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    CalendarToday,
    Search,
    FilterList,
} from '@mui/icons-material';
import axios from 'axios';

const StudentCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewMode, setViewMode] = useState('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');


    const [eventsData, setEventData] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/Calender/")
            .then(res => {
                setEventData(res.data.calender);
            })
            .catch(err => console.error(err));
    }, []);


    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getEventsForDate = (dateStr) => {
        return eventsData.filter(event => event.date === dateStr);
    };

    const isToday = (day) => {
        const today = new Date();
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return checkDate.toDateString() === today.toDateString();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(clickedDate);
        const events = getEventsForDate(dateStr);
        if (events.length > 0) {
            setSelectedDate({ date: clickedDate, events });
        }
    };

    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<Box key={`empty-${i}`} sx={{ p: 2 }} />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            const dayEvents = getEventsForDate(dateStr);
            const filteredEvents = filterType === 'all'
                ? dayEvents
                : dayEvents.filter(e => e.type.toLowerCase() === filterType);

            const hasHoliday = filteredEvents.some(e => e.type === 'Holiday');
            const hasEvent = filteredEvents.some(e => e.type === 'Event');

            days.push(
                <Tooltip
                    key={day}
                    title={filteredEvents.map(e => e.title).join(', ') || ''}
                    arrow
                >
                    <Box
                        onClick={() => handleDateClick(day)}
                        sx={{
                            p: 2,
                            minHeight: '80px',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: filteredEvents.length > 0 ? 'pointer' : 'default',
                            bgcolor: isToday(day) ? 'action.selected' : 'background.paper',
                            position: 'relative',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'action.hover',
                                transform: filteredEvents.length > 0 ? 'scale(1.02)' : 'none',
                            },
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: isToday(day) ? 'bold' : 'normal',
                                color: isToday(day) ? 'primary.main' : 'text.primary',
                            }}
                        >
                            {day}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {hasHoliday && (
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: 'error.main',
                                    }}
                                />
                            )}
                            {hasEvent && (
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                    }}
                                />
                            )}
                        </Box>
                        {filteredEvents.length > 0 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    mt: 0.5,
                                    fontSize: '0.65rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {filteredEvents[0].title}
                            </Typography>
                        )}
                    </Box>
                </Tooltip>
            );
        }

        return days;
    };

    const renderYearView = () => {
        return months.map((month, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={month}>
                <Paper elevation={2} sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}>
                        {month}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                        {daysOfWeek.map(day => (
                            <Typography key={day} variant="caption" sx={{ textAlign: 'center', fontSize: '0.6rem' }}>
                                {day[0]}
                            </Typography>
                        ))}
                        {(() => {
                            const monthDate = new Date(currentDate.getFullYear(), idx, 1);
                            const daysInMonth = getDaysInMonth(monthDate);
                            const firstDay = getFirstDayOfMonth(monthDate);
                            const miniDays = [];

                            for (let i = 0; i < firstDay; i++) {
                                miniDays.push(<Box key={`empty-${i}`} />);
                            }

                            for (let day = 1; day <= daysInMonth; day++) {
                                const dateStr = formatDate(new Date(currentDate.getFullYear(), idx, day));
                                const dayEvents = getEventsForDate(dateStr);
                                const hasEvents = dayEvents.length > 0;

                                miniDays.push(
                                    <Box
                                        key={day}
                                        sx={{
                                            textAlign: 'center',
                                            fontSize: '0.65rem',
                                            p: 0.3,
                                            bgcolor: hasEvents ? (dayEvents[0].type === 'Holiday' ? 'error.light' : 'primary.light') : 'transparent',
                                            borderRadius: '50%',
                                            cursor: hasEvents ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            setCurrentDate(new Date(currentDate.getFullYear(), idx, day));
                                            setViewMode('month');
                                        }}
                                    >
                                        {day}
                                    </Box>
                                );
                            }

                            return miniDays;
                        })()}
                    </Box>
                </Paper>
            </Grid>
        ));
    };

    const filteredEventsData = eventsData.filter(event => {
        const matchesFilter = filterType === 'all' || event.type.toLowerCase() === filterType;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Academic Calendar
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                    >
                        <ToggleButton value="month">Month</ToggleButton>
                        <ToggleButton value="year">Year</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper elevation={3} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <IconButton onClick={handlePrevMonth}>
                                <ChevronLeft />
                            </IconButton>

                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                {viewMode === 'month'
                                    ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                                    : currentDate.getFullYear()
                                }
                            </Typography>

                            <IconButton onClick={handleNextMonth}>
                                <ChevronRight />
                            </IconButton>
                        </Box>

                        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <TextField
                                size="small"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flexGrow: 1, minWidth: '200px' }}
                            />

                            <ToggleButtonGroup
                                value={filterType}
                                exclusive
                                onChange={(e, newFilter) => newFilter && setFilterType(newFilter)}
                                size="small"
                            >
                                <ToggleButton value="all">All</ToggleButton>
                                <ToggleButton value="holiday">Holidays</ToggleButton>
                                <ToggleButton value="event">Events</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {viewMode === 'month' ? (
                            <>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
                                    {daysOfWeek.map(day => (
                                        <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            {day}
                                        </Typography>
                                    ))}
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                                    {renderMonthView()}
                                </Box>
                            </>
                        ) : (
                            <Grid container spacing={2}>
                                {renderYearView()}
                            </Grid>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'error.main' }} />
                                <Typography variant="caption">Holiday</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                <Typography variant="caption">Event</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, bgcolor: 'action.selected' }} />
                                <Typography variant="caption">Today</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            {selectedDate ? 'Event Details' : 'Upcoming Events'}
                        </Typography>

                        <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {selectedDate ? (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                        {selectedDate.date.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </Typography>
                                    {selectedDate.events.map((event, idx) => (
                                        <Card key={idx} sx={{ mb: 2, bgcolor: event.type === 'Holiday' ? 'error.light' : 'primary.light' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="h6">{event.title}</Typography>
                                                    <Chip
                                                        label={event.type}
                                                        size="small"
                                                        color={event.type === 'Holiday' ? 'error' : 'primary'}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {event.description}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <IconButton
                                        onClick={() => setSelectedDate(null)}
                                        sx={{ mt: 1 }}
                                        size="small"
                                    >
                                        ← Back to all events
                                    </IconButton>
                                </>
                            ) : (
                                filteredEventsData.map((event, idx) => (
                                    <Card key={idx} sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                    {event.title}
                                                </Typography>
                                                <Chip
                                                    label={event.type}
                                                    size="small"
                                                    color={event.type === 'Holiday' ? 'error' : 'primary'}
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                {new Date(event.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Typography>
                                            <Typography variant="body2">
                                                {event.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentCalendar;