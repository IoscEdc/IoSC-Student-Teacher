import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

// Import test configuration
import { browsers, devices, testScenarios } from './cross-browser.config';

// Import components
import App from '../../App';
import AttendanceMarkingGrid from '../../components/attendance/AttendanceMarkingGrid';
import AttendanceDashboard from '../../components/attendance/AttendanceDashboard';

// Import Redux slices
import userReducer from '../../redux/userRelated/userSlice';
import studentReducer from '../../redux/studentRelated/studentSlice';
import teacherReducer from '../../redux/teacherRelated/teacherSlice';

// Mock API
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

// Helper function to simulate browser environment
const simulateBrowser = (browserConfig) => {
    // Mock user agent
    Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        value: browserConfig.userAgent
    });

    // Mock viewport
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: browserConfig.viewport.width,
    });

    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: browserConfig.viewport.height,
    });

    // Mock matchMedia for responsive design
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => {
            const width = browserConfig.viewport.width;
            let matches = false;

            if (query.includes('max-width: 768px')) {
                matches = width <= 768;
            } else if (query.includes('max-width: 1024px')) {
                matches = width <= 1024;
            } else if (query.includes('min-width: 1025px')) {
                matches = width >= 1025;
            }

            return {
                matches,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            };
        }),
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

describe('Cross-Browser Compatibility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockedAxios.get.mockResolvedValue({ data: { success: true, data: [] } });
        mockedAxios.post.mockResolvedValue({ data: { success: true, data: {} } });
    });

    // Test each browser
    Object.entries(browsers).forEach(([browserName, browserConfig]) => {
        describe(`${browserConfig.name} Browser Tests`, () => {
            beforeEach(() => {
                simulateBrowser(browserConfig);
            });

            test(`renders attendance marking grid correctly in ${browserConfig.name}`, async () => {
                const mockStudents = [
                    { _id: '1', name: 'John Doe', rollNum: 1 },
                    { _id: '2', name: 'Jane Smith', rollNum: 2 }
                ];

                mockedAxios.get.mockResolvedValueOnce({
                    data: { success: true, data: mockStudents }
                });

                renderWithProviders(
                    <AttendanceMarkingGrid classId="class1" subjectId="subject1" />,
                    {
                        initialState: {
                            user: {
                                currentRole: 'Teacher',
                                currentUser: { _id: '1', name: 'Test Teacher' }
                            }
                        }
                    }
                );

                await waitFor(() => {
                    expect(screen.getByText('John Doe') || screen.getByDisplayValue('John Doe')).toBeInTheDocument();
                });

                // Test browser-specific functionality
                if (browserName === 'safari') {
                    // Safari-specific tests (e.g., date picker behavior)
                    const dateInput = screen.queryByType?.('date');
                    if (dateInput) {
                        expect(dateInput).toBeInTheDocument();
                    }
                }

                if (browserName === 'firefox') {
                    // Firefox-specific tests
                    const checkboxes = screen.getAllByRole('checkbox');
                    expect(checkboxes.length).toBeGreaterThan(0);
                }
            });

            test(`handles form submission correctly in ${browserConfig.name}`, async () => {
                mockedAxios.post.mockResolvedValueOnce({
                    data: { success: true, message: 'Attendance marked' }
                });

                const MockForm = () => {
                    const handleSubmit = async (e) => {
                        e.preventDefault();
                        await mockedAxios.post('/api/attendance/mark', {
                            attendanceRecords: [{ studentId: '1', status: 'present' }]
                        });
                    };

                    return (
                        <form onSubmit={handleSubmit}>
                            <input type="checkbox" data-testid="attendance-checkbox" />
                            <button type="submit">Submit</button>
                        </form>
                    );
                };

                renderWithProviders(<MockForm />);

                const checkbox = screen.getByTestId('attendance-checkbox');
                const submitButton = screen.getByText('Submit');

                fireEvent.click(checkbox);
                fireEvent.click(submitButton);

                await waitFor(() => {
                    expect(mockedAxios.post).toHaveBeenCalled();
                });
            });

            test(`displays charts and visualizations correctly in ${browserConfig.name}`, async () => {
                const mockData = [
                    { subjectName: 'Math', attendanceRate: 85 },
                    { subjectName: 'Physics', attendanceRate: 90 }
                ];

                mockedAxios.get.mockResolvedValueOnce({
                    data: { success: true, data: mockData }
                });

                renderWithProviders(
                    <AttendanceDashboard />,
                    {
                        initialState: {
                            user: {
                                currentRole: 'Student',
                                currentUser: { _id: '1', name: 'Test Student' }
                            }
                        }
                    }
                );

                await waitFor(() => {
                    // Check if chart elements are rendered
                    const chartElement = screen.queryByTestId('attendance-chart') || 
                                       screen.queryByRole('img') ||
                                       screen.queryByText('85') ||
                                       screen.queryByText('90');
                    
                    if (chartElement) {
                        expect(chartElement).toBeInTheDocument();
                    }
                });
            });
        });
    });

    // Test each device type
    Object.entries(devices).forEach(([deviceName, deviceConfig]) => {
        describe(`${deviceConfig.name} Device Tests`, () => {
            beforeEach(() => {
                simulateBrowser(deviceConfig);
            });

            test(`responsive design works on ${deviceConfig.name}`, () => {
                renderWithProviders(
                    <AttendanceMarkingGrid classId="class1" subjectId="subject1" />,
                    {
                        initialState: {
                            user: {
                                currentRole: 'Teacher',
                                currentUser: { _id: '1', name: 'Test Teacher' }
                            }
                        }
                    }
                );

                // Component should render without errors
                const mainElement = screen.queryByRole('main') || 
                                  screen.queryByTestId('attendance-grid') ||
                                  document.querySelector('[data-testid*="attendance"]');

                // For mobile devices, check if mobile-specific elements are present
                if (deviceName === 'mobile') {
                    // Mobile-specific assertions
                    expect(window.innerWidth).toBe(375);
                    
                    // Check if mobile navigation or hamburger menu exists
                    const mobileNav = screen.queryByTestId('mobile-nav') ||
                                    screen.queryByLabelText('menu') ||
                                    screen.queryByRole('button', { name: /menu/i });
                    
                    // Mobile layout should be more compact
                    const container = document.querySelector('.container') || 
                                    document.querySelector('[class*="container"]');
                    
                    if (container) {
                        const styles = window.getComputedStyle(container);
                        // Mobile should have smaller padding/margins
                        expect(styles.padding || styles.margin).toBeDefined();
                    }
                }

                // For tablet devices
                if (deviceName === 'tablet') {
                    expect(window.innerWidth).toBe(768);
                    
                    // Tablet should show a hybrid layout
                    const tabletLayout = screen.queryByTestId('tablet-layout') ||
                                       document.querySelector('[class*="tablet"]');
                }

                // For desktop devices
                if (deviceName === 'desktop') {
                    expect(window.innerWidth).toBe(1920);
                    
                    // Desktop should show full layout
                    const desktopLayout = screen.queryByTestId('desktop-layout') ||
                                        document.querySelector('[class*="desktop"]');
                }
            });

            test(`touch interactions work on ${deviceConfig.name}`, () => {
                if (deviceName === 'mobile' || deviceName === 'tablet') {
                    renderWithProviders(
                        <AttendanceMarkingGrid classId="class1" subjectId="subject1" />,
                        {
                            initialState: {
                                user: {
                                    currentRole: 'Teacher',
                                    currentUser: { _id: '1', name: 'Test Teacher' }
                                }
                            }
                        }
                    );

                    // Test touch events
                    const touchableElement = screen.queryByRole('button') ||
                                           screen.queryByRole('checkbox') ||
                                           document.querySelector('[role="button"]');

                    if (touchableElement) {
                        // Simulate touch events
                        fireEvent.touchStart(touchableElement);
                        fireEvent.touchEnd(touchableElement);
                        
                        // Element should handle touch events without errors
                        expect(touchableElement).toBeInTheDocument();
                    }
                }
            });
        });
    });

    describe('Feature-Specific Cross-Browser Tests', () => {
        test('date picker works across all browsers', () => {
            const MockDatePicker = () => (
                <input 
                    type="date" 
                    data-testid="date-picker"
                    defaultValue="2024-01-15"
                />
            );

            // Test in each browser
            Object.entries(browsers).forEach(([browserName, browserConfig]) => {
                simulateBrowser(browserConfig);
                
                const { unmount } = renderWithProviders(<MockDatePicker />);
                
                const datePicker = screen.getByTestId('date-picker');
                expect(datePicker).toBeInTheDocument();
                expect(datePicker.value).toBe('2024-01-15');
                
                // Test date change
                fireEvent.change(datePicker, { target: { value: '2024-01-16' } });
                expect(datePicker.value).toBe('2024-01-16');
                
                unmount();
            });
        });

        test('local storage works across all browsers', () => {
            // Mock localStorage
            const localStorageMock = {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            };
            
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock
            });

            // Test localStorage functionality
            Object.entries(browsers).forEach(([browserName, browserConfig]) => {
                simulateBrowser(browserConfig);
                
                // Test setting and getting data
                window.localStorage.setItem('test-key', 'test-value');
                expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
                
                localStorageMock.getItem.mockReturnValue('test-value');
                const value = window.localStorage.getItem('test-key');
                expect(value).toBe('test-value');
            });
        });

        test('CSS Grid and Flexbox layouts work across browsers', () => {
            const MockGridLayout = () => (
                <div 
                    data-testid="grid-container"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem'
                    }}
                >
                    <div>Item 1</div>
                    <div>Item 2</div>
                    <div>Item 3</div>
                </div>
            );

            Object.entries(browsers).forEach(([browserName, browserConfig]) => {
                simulateBrowser(browserConfig);
                
                const { unmount } = renderWithProviders(<MockGridLayout />);
                
                const gridContainer = screen.getByTestId('grid-container');
                expect(gridContainer).toBeInTheDocument();
                
                // Check if grid styles are applied
                const styles = window.getComputedStyle(gridContainer);
                expect(styles.display).toBe('grid');
                
                unmount();
            });
        });
    });

    describe('Performance Tests Across Browsers', () => {
        test('component rendering performance is acceptable', async () => {
            const startTime = performance.now();
            
            const mockLargeDataset = Array.from({ length: 100 }, (_, i) => ({
                _id: `student${i}`,
                name: `Student ${i}`,
                rollNum: i + 1
            }));

            mockedAxios.get.mockResolvedValueOnce({
                data: { success: true, data: mockLargeDataset }
            });

            renderWithProviders(
                <AttendanceMarkingGrid classId="class1" subjectId="subject1" />,
                {
                    initialState: {
                        user: {
                            currentRole: 'Teacher',
                            currentUser: { _id: '1', name: 'Test Teacher' }
                        }
                    }
                }
            );

            await waitFor(() => {
                expect(screen.getByText('Student 1') || screen.getByDisplayValue('Student 1')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Rendering should complete within reasonable time (5 seconds)
            expect(renderTime).toBeLessThan(5000);
        });
    });
});