/**
 * Test script to verify the useStudentAttendance hook is working
 * This is a temporary test file to debug the hook
 */

// Mock data to simulate what the hook should return
const mockAttendanceData = {
    overallPercentage: 85.5,
    subjects: [
        {
            subject: 'Mathematics',
            subjectId: '507f1f77bcf86cd799439011',
            present: 17,
            total: 20,
            percentage: 85,
            absent: 3,
            late: 0,
            excused: 0,
            records: [
                { date: '2024-01-15', session: 'Morning', status: 'present' },
                { date: '2024-01-14', session: 'Morning', status: 'present' },
                { date: '2024-01-13', session: 'Morning', status: 'absent' }
            ]
        },
        {
            subject: 'Science',
            subjectId: '507f1f77bcf86cd799439012',
            present: 18,
            total: 20,
            percentage: 90,
            absent: 2,
            late: 0,
            excused: 0,
            records: [
                { date: '2024-01-15', session: 'Afternoon', status: 'present' },
                { date: '2024-01-14', session: 'Afternoon', status: 'present' },
                { date: '2024-01-13', session: 'Afternoon', status: 'present' }
            ]
        }
    ],
    totalSessions: 40,
    totalPresent: 35,
    totalAbsent: 5,
    lastUpdated: new Date()
};

console.log('Expected attendance data structure:', JSON.stringify(mockAttendanceData, null, 2));

// Test the data transformation logic
function testDataTransformation() {
    console.log('Testing data transformation...');
    
    // Mock API response structure
    const mockApiResponse = [
        {
            _id: '507f1f77bcf86cd799439013',
            studentId: '507f1f77bcf86cd799439010',
            subjectId: {
                _id: '507f1f77bcf86cd799439011',
                subName: 'Mathematics',
                subCode: 'MATH101'
            },
            classId: '507f1f77bcf86cd799439014',
            totalSessions: 20,
            presentCount: 17,
            absentCount: 3,
            lateCount: 0,
            excusedCount: 0,
            attendancePercentage: 85
        },
        {
            _id: '507f1f77bcf86cd799439015',
            studentId: '507f1f77bcf86cd799439010',
            subjectId: {
                _id: '507f1f77bcf86cd799439012',
                subName: 'Science',
                subCode: 'SCI101'
            },
            classId: '507f1f77bcf86cd799439014',
            totalSessions: 20,
            presentCount: 18,
            absentCount: 2,
            lateCount: 0,
            excusedCount: 0,
            attendancePercentage: 90
        }
    ];

    const mockRecords = {
        '507f1f77bcf86cd799439011': [
            { date: '2024-01-15T00:00:00.000Z', session: 'Morning', status: 'present' },
            { date: '2024-01-14T00:00:00.000Z', session: 'Morning', status: 'present' },
            { date: '2024-01-13T00:00:00.000Z', session: 'Morning', status: 'absent' }
        ],
        '507f1f77bcf86cd799439012': [
            { date: '2024-01-15T00:00:00.000Z', session: 'Afternoon', status: 'present' },
            { date: '2024-01-14T00:00:00.000Z', session: 'Afternoon', status: 'present' },
            { date: '2024-01-13T00:00:00.000Z', session: 'Afternoon', status: 'present' }
        ]
    };

    // Simulate the transformation logic
    let totalSessions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    const subjects = mockApiResponse.map(summary => {
        totalSessions += summary.totalSessions || 0;
        totalPresent += summary.presentCount || 0;
        totalAbsent += summary.absentCount || 0;

        const subjectId = summary.subjectId?._id || summary.subjectId;
        const subjectRecords = mockRecords[subjectId] || [];

        return {
            subject: summary.subjectId?.subName || 'Unknown Subject',
            subjectId: subjectId,
            present: summary.presentCount || 0,
            total: summary.totalSessions || 0,
            percentage: summary.attendancePercentage || 0,
            absent: summary.absentCount || 0,
            late: summary.lateCount || 0,
            excused: summary.excusedCount || 0,
            records: subjectRecords.map(record => ({
                date: record.date,
                session: record.session,
                status: record.status
            }))
        };
    });

    const overallPercentage = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;

    const transformedData = {
        overallPercentage,
        subjects,
        totalSessions,
        totalPresent,
        totalAbsent,
        lastUpdated: new Date()
    };

    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    
    return transformedData;
}

// Run the test
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testDataTransformation, mockAttendanceData };
} else {
    // Browser environment
    testDataTransformation();
}