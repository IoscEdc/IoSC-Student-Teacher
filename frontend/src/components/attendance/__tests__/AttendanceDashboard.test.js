import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import AttendanceDashboard from '../AttendanceDashboard';

// Mock store
const mockStore = configureStore({
    reducer: {
        user: (state = {
            userDetails: {
                attendance: [
                    {
                        subName: 'Mathematics',
                        status: 'Present',
                        date: '2024-01-15',
                        subId: 'math001'
                    },
                    {
                        subName: 'Science',
                        status: 'Absent',
                        date: '2024-01-16',
                        subId: 'sci001'
                    }
                ]
            },
            currentUser: { _id: 'user123' },
            loading: false,
            error: null
        }) => state
    }
});

const renderWithProviders = (component) => {
    return render(
        <Provider store={mockStore}>
            <BrowserRouter>
                {component}
            </BrowserRouter>
        </Provider>
    );
};

describe('AttendanceDashboard', () => {
    test('renders attendance dashboard title', () => {
        renderWithProviders(<AttendanceDashboard />);
        expect(screen.getByText('Attendance Dashboard')).toBeInTheDocument();
    });

    test('displays overall attendance section', () => {
        renderWithProviders(<AttendanceDashboard />);
        expect(screen.getByText('Overall Attendance')).toBeInTheDocument();
    });

    test('shows attendance trends section', () => {
        renderWithProviders(<AttendanceDashboard />);
        expect(screen.getByText('Attendance Trends')).toBeInTheDocument();
    });
});