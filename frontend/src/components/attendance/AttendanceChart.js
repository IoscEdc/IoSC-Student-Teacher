import React from 'react';
import {
    Box,
    Typography,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

const AttendanceChart = ({ data, type = 'bar' }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    if (!data || data.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No data available for chart
                </Typography>
            </Box>
        );
    }
    
    // Prepare data for charts
    const chartData = data.map(subject => ({
        name: subject.subject.length > 15 ? 
              subject.subject.substring(0, 15) + '...' : 
              subject.subject,
        fullName: subject.subject,
        percentage: subject.percentage || 0,
        present: subject.present || 0,
        absent: subject.absent || 0,
        total: subject.total || 0
    }));
    
    // Colors for different attendance levels
    const getColor = (percentage) => {
        if (percentage >= 85) return '#4caf50'; // Green
        if (percentage >= 75) return '#ff9800'; // Orange
        if (percentage >= 65) return '#f44336'; // Red
        return '#d32f2f'; // Dark Red
    };
    
    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Box sx={{
                    backgroundColor: 'white',
                    p: 2,
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    boxShadow: 2
                }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {data.fullName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Attendance: {data.percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Present: {data.present}/{data.total}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Absent: {data.absent}
                    </Typography>
                </Box>
            );
        }
        return null;
    };
    
    // Bar Chart
    const renderBarChart = () => (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <BarChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={isMobile ? 10 : 12}
                />
                <YAxis 
                    domain={[0, 100]}
                    fontSize={isMobile ? 10 : 12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                    dataKey="percentage" 
                    name="Attendance %"
                    fill={(entry) => getColor(entry.percentage)}
                    radius={[4, 4, 0, 0]}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.percentage)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
    
    // Pie Chart for overall distribution
    const renderPieChart = () => {
        const pieData = [
            {
                name: 'Excellent (≥85%)',
                value: chartData.filter(d => d.percentage >= 85).length,
                color: '#4caf50'
            },
            {
                name: 'Good (75-84%)',
                value: chartData.filter(d => d.percentage >= 75 && d.percentage < 85).length,
                color: '#ff9800'
            },
            {
                name: 'Warning (65-74%)',
                value: chartData.filter(d => d.percentage >= 65 && d.percentage < 75).length,
                color: '#f44336'
            },
            {
                name: 'Critical (<65%)',
                value: chartData.filter(d => d.percentage < 65).length,
                color: '#d32f2f'
            }
        ].filter(item => item.value > 0);
        
        return (
            <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
                <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={isMobile ? 80 : 120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        );
    };
    
    // Line Chart for trend (if historical data available)
    const renderLineChart = () => (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <LineChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={isMobile ? 10 : 12}
                />
                <YAxis 
                    domain={[0, 100]}
                    fontSize={isMobile ? 10 : 12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                    name="Attendance %"
                />
            </LineChart>
        </ResponsiveContainer>
    );
    
    // Render based on type
    const renderChart = () => {
        switch (type) {
            case 'pie':
                return renderPieChart();
            case 'line':
                return renderLineChart();
            case 'bar':
            default:
                return renderBarChart();
        }
    };
    
    return (
        <Box sx={{ width: '100%' }}>
            {renderChart()}
            
            {/* Chart Statistics */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Quick Stats:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="caption">
                        Subjects: {chartData.length}
                    </Typography>
                    <Typography variant="caption">
                        Avg Attendance: {(chartData.reduce((sum, item) => sum + item.percentage, 0) / chartData.length).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        Best: {Math.max(...chartData.map(d => d.percentage)).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption">
                        Lowest: {Math.min(...chartData.map(d => d.percentage)).toFixed(1)}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default AttendanceChart;