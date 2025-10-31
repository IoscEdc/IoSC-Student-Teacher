import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import ImprovedAttendanceMarking from '../ImprovedAttendanceMarking';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock store
const mockStore = configureStore({
    reducer: {
        user: (state = { currentUser: { role: 'Teacher' } }) => state
    }
});

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

const renderComponent = () => {
    return render(
        <Provider store={mockStore}>
            <BrowserRouter>
                <ImprovedAttendanceMarking />
            </BrowserRouter>
        </Provider>
    );
};

describe('ImprovedAttendanceMarking', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    afterEach(() => {
        localStorage.clear();
    });

    const mockStudents = [
        { _id: '1', name: 'John Doe', rollNum: '001' },
        { _id: '2', name: 'Jane Smith', rollNum: '002' },
        { _id: '3', name: 'Bob Johnson', rollNum: '003' }
    ];

    const mockSessions = [
        { value: 'Lecture 1', label: 'Lecture 1' },
        { value: 'Lecture 2', label: 'Lecture 2' }
    ];

    test('renders attendance marking interface', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        expect(screen.getByText('Mark Attendance')).toBeInTheDocument();
        expect(screen.getByText('AIDS B1 - Data Structures')).toBeInTheDocument();
    });

    test('displays students with correct format (Roll Number - Student Name)', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('001')).toBeInTheDocument();
            expect(screen.getByText('- John Doe')).toBeInTheDocument();
            expect(screen.getByText('002')).toBeInTheDocument();
            expect(screen.getByText('- Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('003')).toBeInTheDocument();
            expect(screen.getByText('- Bob Johnson')).toBeInTheDocument();
        });
    });

    test('individual student attendance controls work independently', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('001')).toBeInTheDocument();
        });

        // Get all checkboxes for the first student (John Doe)
        const studentRows = screen.getAllByRole('row');
        const johnDoeRow = studentRows.find(row => 
            row.textContent.includes('001') && row.textContent.includes('John Doe')
        );
        
        expect(johnDoeRow).toBeInTheDocument();

        // Find checkboxes in John Doe's row
        const johnDoeCheckboxes = johnDoeRow.querySelectorAll('input[type="checkbox"]');
        const [presentCheckbox, absentCheckbox] = johnDoeCheckboxes;

        // Initially, present should be checked (default)
        expect(presentCheckbox).toBeChecked();
        expect(absentCheckbox).not.toBeChecked();

        // Click absent checkbox for John Doe
        fireEvent.click(absentCheckbox);

        // Now absent should be checked and present should be unchecked
        expect(absentCheckbox).toBeChecked();
        expect(presentCheckbox).not.toBeChecked();

        // Verify other students are not affected
        const janeSmithRow = studentRows.find(row => 
            row.textContent.includes('002') && row.textContent.includes('Jane Smith')
        );
        const janeSmithCheckboxes = janeSmithRow.querySelectorAll('input[type="checkbox"]');
        const [janePresent] = janeSmithCheckboxes;
        
        // Jane should still be marked as present (default)
        expect(janePresent).toBeChecked();
    });

    test('visual feedback shows correct colors for attendance status', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('001')).toBeInTheDocument();
        });

        // Check that the summary shows correct colors
        expect(screen.getByText(/Present: 3/)).toHaveStyle({ color: '#4CAF50' });
        expect(screen.getByText(/Absent: 0/)).toHaveStyle({ color: '#F44336' });
    });

    test('attendance submission works correctly', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });
        mockedAxios.post.mockResolvedValueOnce({
            data: { success: true, message: 'Attendance marked successfully' }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('001')).toBeInTheDocument();
        });

        // Select a session
        const sessionSelect = screen.getByLabelText('Session');
        fireEvent.mouseDown(sessionSelect);
        fireEvent.click(screen.getByText('Lecture 1'));

        // Submit attendance
        const submitButton = screen.getByText('Mark Attendance');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.stringContaining('/attendance/mark'),
                expect.objectContaining({
                    classId: '6902126bf91c442b648f6b95',
                    subjectId: '6902126bf91c442b648f6b9c',
                    session: 'Lecture 1',
                    studentAttendance: expect.arrayContaining([
                        expect.objectContaining({
                            studentId: '1',
                            status: 'present'
                        })
                    ])
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token'
                    })
                })
            );
        });
    });

    test('handles API errors gracefully', async () => {
        mockedAxios.get.mockRejectedValueOnce({
            response: { status: 404, data: { message: 'Students not found' } }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/No students found for this class and subject/)).toBeInTheDocument();
        });
    });

    test('prevents submission without session selection', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('001')).toBeInTheDocument();
        });

        // Try to submit without selecting session
        const submitButton = screen.getByText('Mark Attendance');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Please select a session')).toBeInTheDocument();
        });

        expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('updates attendance summary correctly when status changes', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockSessions }
        });
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, data: mockStudents }
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Present: 3')).toBeInTheDocument();
            expect(screen.getByText('Absent: 0')).toBeInTheDocument();
        });

        // Change one student to absent
        const studentRows = screen.getAllByRole('row');
        const johnDoeRow = studentRows.find(row => 
            row.textContent.includes('001') && row.textContent.includes('John Doe')
        );
        const absentCheckbox = johnDoeRow.querySelectorAll('input[type="checkbox"]')[1];
        fireEvent.click(absentCheckbox);

        await waitFor(() => {
            expect(screen.getByText('Present: 2')).toBeInTheDocument();
            expect(screen.getByText('Absent: 1')).toBeInTheDocument();
        });
    });
});