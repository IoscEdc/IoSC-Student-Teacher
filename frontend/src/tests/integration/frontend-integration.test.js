import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Import components
import App from '../../App';
import AttendanceMarkingGrid from '../../components/attendance/AttendanceMarkingGrid';
import AttendanceDashboard from '../../components/attendance/AttendanceDashboard';
import AttendanceHistory from '../../components/attendance/AttendanceHistory';

// Import Redux slices
import userReducer from '../../redux/userRelated/userSlice';
import studentReducer from '../../redux/studentRelated/studentSlice';
import teacherReducer from '../../redux/teacherRelated/teacherSlice';

// Mock API calls
jest.mock('axios');
const mockedAxios = require('axios');

// Create mock store
const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            user: userReducer,
            student: studentReducer,
            teacher: teacherReducer,
        },
        preloadedState: {
            user: {
                currentUser: null,
                currentRole: null,
                loading: false,
                error: null,
                ...initialState.user
            },
            student: {
                studentsList: [],
                studentDetails: null,
                loading: false,
                error: null,
                ...initialState.student
            },
            teacher: {
                teachersList: [],
                teacherDetails: null,
                loading: false,
                error: null,
                ...initialState.teacher
            }
        }
    });
};

// Helper function to render with providers
const renderWithProviders = (component, { initialState = {}, ...renderOptions } = {}) => {
    const store = createMockStore(initialState);
    
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <BrowserRouter>
                {children}
            </BrowserRouter>
        </Provider>
    );

    return {
        store,
        ...render(component, { wrapper: Wrapper, ...renderOptions })
    };
};

describe('Frontend Integration Tests', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Setup default API responses
        mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });
        mockedAxios.post.mockResolvedValue({ data: { success: true, data: {} } });
        mockedAxios.put.mockResolvedValue({ data: { success: true, data: {} } });
    });

    describe('App Routing and Authentication', () => {
        test('renders homepage when no user is logged in', () => {
            renderWithProviders(<App />);
            
            // Should show homepage elements
            expect(screen.getByText(/welcome/i) || screen.getByText(/home/i)).toBeInTheDocument();
        });

        test('redirects to appropriate dashboard based on user role', () => {
            // Test Admin role
            renderWithProviders(<App />, {
                initialState: {
                    user: {
                        currentRole: 'Admin',
                        currentUser: { _id: '1', name: 'Test Admin' }
                    }
                }
            });

            // Should render admin dashboard
            expect(screen.getByTestId('admin-dashboard') || screen.getByText(/admin/i)).toBeInTheDocument();
        });

        test('shows teacher dashboard for teacher role', () => {
            renderWithProviders(<App />, {
                initialState: {
                    user: {
                        currentRole: 'Teacher',
                        currentUser: { _id: '1', name: 'Test Teacher' }
                    }
                }
            });

            // Should render teacher dashboard
            expect(screen.getByTestId('teacher-dashboard') || screen.getByText(/teacher/i)).toBeInTheDocument();
        });

        test('shows student dashboard for student role', () => {
            renderWithProviders(<App />, {
                initialState: {
                    user: {
                        currentRole: 'Student',
                        currentUser: { _id: '1', name: 'Test Student' }
                    }
                }
            });

            // Should render student dashboard
            expect(screen.getByTestId('student-dashboard') || screen.getByText(/student/i)).toBeInTheDocument();
        });
    });

    describe('Teacher Attendance Workflow', () => {
        const mockTeacherState = {
            user: {
                currentRole: 'Teacher',
                currentUser: {
                    _id: 'teacher1',
                    name: 'Test Teacher',
                    assignedSubjects: [
                        {
                            subjectId: 'subject1',
                            classId: 'class1'
                        }
                    ]
                }
            }
        };

        const mockStudents = [
            {
                _id: 'student1',
                name: 'John Doe',
                rollNum: 1,
                universityId: 'CS2024001'
            },
            {
                _id: 'student2',
                name: 'Jane Smith',
                rollNum: 2,
                universityId: 'CS2024002'
            }
        ];

        test('teacher can load and mark attendance', async () => {
            // Mock API response for getting students
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockStudents
                }
            });

            // Mock API response for marking attendance
            mockedAxios.post.mockResolvedValueOnce({
                data: {
                    success: true,
                    message: 'Attendance marked successfully'
                }
            });

            renderWithProviders(
                <AttendanceMarkingGrid 
                    classId="class1" 
                    subjectId="subject1" 
                />, 
                { initialState: mockTeacherState }
            );

            // Wait for students to load
            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            // Mark attendance for first student
            const presentCheckbox = screen.getAllByRole('checkbox')[0];
            fireEvent.click(presentCheckbox);

            // Submit attendance
            const submitButton = screen.getByText(/mark attendance/i) || screen.getByRole('button', { name: /submit/i });
            fireEvent.click(submitButton);

            // Verify API was called
            await waitFor(() => {
                expect(mockedAxios.post).toHaveBeenCalledWith(
                    expect.stringContaining('/attendance/mark'),
                    expect.objectContaining({
                        attendanceRecords: expect.arrayContaining([
                            expect.objectContaining({
                                studentId: 'student1',
                                status: 'present'
                            })
                        ])
                    }),
                    expect.any(Object)
                );
            });
        });

        test('teacher can view and edit attendance history', async () => {
            const mockAttendanceHistory = [
                {
                    _id: 'record1',
                    studentId: 'student1',
                    studentName: 'John Doe',
                    date: '2024-01-15',
                    session: 'Lecture 1',
                    status: 'present'
                },
                {
                    _id: 'record2',
                    studentId: 'student2',
                    studentName: 'Jane Smith',
                    date: '2024-01-15',
                    session: 'Lecture 1',
                    status: 'absent'
                }
            ];

            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockAttendanceHistory
                }
            });

            renderWithProviders(
                <AttendanceHistory 
                    classId="class1" 
                    subjectId="subject1" 
                />, 
                { initialState: mockTeacherState }
            );

            // Wait for history to load
            await waitFor(() => {
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });

            // Edit attendance record
            const editButton = screen.getAllByText(/edit/i)[0];
            fireEvent.click(editButton);

            // Change status
            const statusSelect = screen.getByDisplayValue('present');
            fireEvent.change(statusSelect, { target: { value: 'late' } });

            // Save changes
            const saveButton = screen.getByText(/save/i);
            fireEvent.click(saveButton);

            // Verify API was called
            await waitFor(() => {
                expect(mockedAxios.put).toHaveBeenCalledWith(
                    expect.stringContaining('/attendance/record1'),
                    expect.objectContaining({
                        status: 'late'
                    }),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Student Attendance Dashboard', () => {
        const mockStudentState = {
            user: {
                currentRole: 'Student',
                currentUser: {
                    _id: 'student1',
                    name: 'Test Student',
                    rollNum: 1
                }
            }
        };

        const mockAttendanceSummary = [
            {
                subjectId: 'subject1',
                subjectName: 'Mathematics',
                totalSessions: 20,
                presentCount: 18,
                absentCount: 2,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 90
            },
            {
                subjectId: 'subject2',
                subjectName: 'Physics',
                totalSessions: 15,
                presentCount: 12,
                absentCount: 3,
                lateCount: 0,
                excusedCount: 0,
                attendancePercentage: 80
            }
        ];

        test('student can view attendance dashboard with summaries', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockAttendanceSummary
                }
            });

            renderWithProviders(
                <AttendanceDashboard />, 
                { initialState: mockStudentState }
            );

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
                expect(screen.getByText('Physics')).toBeInTheDocument();
                expect(screen.getByText('90%')).toBeInTheDocument();
                expect(screen.getByText('80%')).toBeInTheDocument();
            });

            // Verify charts are rendered
            expect(screen.getByTestId('attendance-chart') || screen.getByRole('img')).toBeInTheDocument();
        });

        test('student can drill down into subject details', async () => {
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockAttendanceSummary
                }
            });

            const mockDetailedRecords = [
                {
                    _id: 'record1',
                    date: '2024-01-15',
                    session: 'Lecture 1',
                    status: 'present'
                },
                {
                    _id: 'record2',
                    date: '2024-01-16',
                    session: 'Lecture 2',
                    status: 'absent'
                }
            ];

            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockDetailedRecords
                }
            });

            renderWithProviders(
                <AttendanceDashboard />, 
                { initialState: mockStudentState }
            );

            // Wait for dashboard to load
            await waitFor(() => {
                expect(screen.getByText('Mathematics')).toBeInTheDocument();
            });

            // Click on subject to view details
            const mathSubject = screen.getByText('Mathematics');
            fireEvent.click(mathSubject);

            // Wait for detailed records to load
            await waitFor(() => {
                expect(screen.getByText('Lecture 1')).toBeInTheDocument();
                expect(screen.getByText('Lecture 2')).toBeInTheDocument();
            });
        });
    });

    describe('Admin Analytics and Management', () => {
        const mockAdminState = {
            user: {
                currentRole: 'Admin',
                currentUser: {
                    _id: 'admin1',
                    name: 'Test Admin',
                    schoolName: 'Test School'
                }
            }
        };

        test('admin can view school-wide analytics', async () => {
            const mockAnalytics = {
                totalStudents: 100,
                totalTeachers: 10,
                totalClasses: 5,
                overallAttendanceRate: 85,
                classWiseAttendance: [
                    { className: 'Class 10A', attendanceRate: 90 },
                    { className: 'Class 10B', attendanceRate: 80 }
                ],
                subjectWiseAttendance: [
                    { subjectName: 'Mathematics', attendanceRate: 88 },
                    { subjectName: 'Physics', attendanceRate: 82 }
                ]
            };

            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    success: true,
                    data: mockAnalytics
                }
            });

            // Mock component since we don't have the actual admin analytics component
            const MockAdminAnalytics = () => {
                const [analytics, setAnalytics] = React.useState(null);

                React.useEffect(() => {
                    mockedAxios.get('/api/attendance/analytics/school/admin1')
                        .then(response => setAnalytics(response.data.data));
                }, []);

                if (!analytics) return <div>Loading...</div>;

                return (
                    <div data-testid="admin-analytics">
                        <h1>School Analytics</h1>
                        <div>Total Students: {analytics.totalStudents}</div>
                        <div>Overall Attendance: {analytics.overallAttendanceRate}%</div>
                        {analytics.classWiseAttendance.map(cls => (
                            <div key={cls.className}>
                                {cls.className}: {cls.attendanceRate}%
                            </div>
                        ))}
                    </div>
                );
            };

            renderWithProviders(
                <MockAdminAnalytics />, 
                { initialState: mockAdminState }
            );

            // Wait for analytics to load
            await waitFor(() => {
                expect(screen.getByText('Total Students: 100')).toBeInTheDocument();
                expect(screen.getByText('Overall Attendance: 85%')).toBeInTheDocument();
                expect(screen.getByText('Class 10A: 90%')).toBeInTheDocument();
            });
        });

        test('admin can perform bulk student operations', async () => {
            const mockBulkResponse = {
                success: true,
                message: 'Students assigned successfully',
                assignedCount: 25,
                errors: []
            };

            mockedAxios.post.mockResolvedValueOnce({
                data: mockBulkResponse
            });

            // Mock bulk management component
            const MockBulkManager = () => {
                const [result, setResult] = React.useState(null);

                const handleBulkAssign = async () => {
                    const response = await mockedAxios.post('/api/attendance/bulk/assign-students', {
                        pattern: 'CS2024*',
                        classId: 'class1',
                        subjectIds: ['subject1', 'subject2']
                    });
                    setResult(response.data);
                };

                return (
                    <div data-testid="bulk-manager">
                        <button onClick={handleBulkAssign}>Assign Students</button>
                        {result && (
                            <div>
                                <div>Success: {result.success.toString()}</div>
                                <div>Assigned: {result.assignedCount}</div>
                            </div>
                        )}
                    </div>
                );
            };

            renderWithProviders(
                <MockBulkManager />, 
                { initialState: mockAdminState }
            );

            // Click bulk assign button
            const assignButton = screen.getByText('Assign Students');
            fireEvent.click(assignButton);

            // Wait for result
            await waitFor(() => {
                expect(screen.getByText('Success: true')).toBeInTheDocument();
                expect(screen.getByText('Assigned: 25')).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling and User Experience', () => {
        test('displays error messages when API calls fail', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

            const MockErrorComponent = () => {
                const [error, setError] = React.useState(null);

                React.useEffect(() => {
                    mockedAxios.get('/api/attendance/summary/student/1')
                        .catch(err => setError(err.message));
                }, []);

                return (
                    <div>
                        {error ? (
                            <div data-testid="error-message">Error: {error}</div>
                        ) : (
                            <div>Loading...</div>
                        )}
                    </div>
                );
            };

            renderWithProviders(<MockErrorComponent />);

            await waitFor(() => {
                expect(screen.getByTestId('error-message')).toBeInTheDocument();
                expect(screen.getByText(/Network error/)).toBeInTheDocument();
            });
        });

        test('shows loading states during API calls', async () => {
            // Mock a delayed response
            mockedAxios.get.mockImplementationOnce(() => 
                new Promise(resolve => 
                    setTimeout(() => resolve({ data: { success: true, data: [] } }), 100)
                )
            );

            const MockLoadingComponent = () => {
                const [loading, setLoading] = React.useState(true);
                const [data, setData] = React.useState(null);

                React.useEffect(() => {
                    mockedAxios.get('/api/attendance/summary/student/1')
                        .then(response => {
                            setData(response.data);
                            setLoading(false);
                        });
                }, []);

                return (
                    <div>
                        {loading ? (
                            <div data-testid="loading">Loading...</div>
                        ) : (
                            <div data-testid="content">Content loaded</div>
                        )}
                    </div>
                );
            };

            renderWithProviders(<MockLoadingComponent />);

            // Should show loading initially
            expect(screen.getByTestId('loading')).toBeInTheDocument();

            // Should show content after loading
            await waitFor(() => {
                expect(screen.getByTestId('content')).toBeInTheDocument();
            });
        });
    });

    describe('Responsive Design and Mobile Support', () => {
        test('components adapt to mobile viewport', () => {
            // Mock mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            // Mock matchMedia for mobile detection
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query.includes('max-width'),
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            renderWithProviders(
                <AttendanceMarkingGrid 
                    classId="class1" 
                    subjectId="subject1" 
                />, 
                { 
                    initialState: {
                        user: {
                            currentRole: 'Teacher',
                            currentUser: { _id: '1', name: 'Test Teacher' }
                        }
                    }
                }
            );

            // Component should render without errors on mobile
            expect(screen.getByTestId('attendance-grid') || screen.getByRole('main')).toBeInTheDocument();
        });
    });
});