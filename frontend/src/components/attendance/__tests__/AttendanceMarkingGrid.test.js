import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AttendanceMarkingGrid from '../AttendanceMarkingGrid';

describe('AttendanceMarkingGrid', () => {
    const mockStudents = [
        { _id: '1', name: 'John Doe', rollNum: '001', universityId: 'U001' },
        { _id: '2', name: 'Jane Smith', rollNum: '002', universityId: 'U002' },
        { _id: '3', name: 'Bob Johnson', rollNum: '003', universityId: 'U003' }
    ];

    const mockOnAttendanceChange = jest.fn();
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders student list with correct format', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Check that students are displayed with roll number first, then name
        expect(screen.getByText('001')).toBeInTheDocument();
        expect(screen.getByText('- John Doe')).toBeInTheDocument();
        expect(screen.getByText('002')).toBeInTheDocument();
        expect(screen.getByText('- Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('003')).toBeInTheDocument();
        expect(screen.getByText('- Bob Johnson')).toBeInTheDocument();
    });

    test('radio buttons provide mutual exclusivity', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Find radio buttons for the first student
        const presentRadios = screen.getAllByLabelText('Present');
        const absentRadios = screen.getAllByLabelText('Absent');
        
        const firstStudentPresent = presentRadios[0];
        const firstStudentAbsent = absentRadios[0];

        // Initially, present should be selected (default)
        expect(firstStudentPresent).toBeChecked();
        expect(firstStudentAbsent).not.toBeChecked();

        // Click absent radio
        fireEvent.click(firstStudentAbsent);

        // Now absent should be selected and present should not be
        expect(firstStudentAbsent).toBeChecked();
        expect(firstStudentPresent).not.toBeChecked();
    });

    test('individual student controls work independently', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        const absentRadios = screen.getAllByLabelText('Absent');
        
        // Click absent for first student
        fireEvent.click(absentRadios[0]);

        // Check that only the first student's attendance changed
        expect(mockOnAttendanceChange).toHaveBeenCalledWith({
            '1': 'absent',
            '2': 'present',
            '3': 'present'
        });
    });

    test('visual feedback shows correct colors for attendance status', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Check that summary chips have correct colors
        const presentChip = screen.getByText(/Present: 3/);
        const absentChip = screen.getByText(/Absent: 0/);

        expect(presentChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
        expect(absentChip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
    });

    test('bulk actions work correctly', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Click "Mark All Absent" button
        const markAllAbsentButton = screen.getByText('Mark All Absent');
        fireEvent.click(markAllAbsentButton);

        // Check that all students are marked as absent
        expect(mockOnAttendanceChange).toHaveBeenCalledWith({
            '1': 'absent',
            '2': 'absent',
            '3': 'absent'
        });
    });

    test('submit button calls onSubmit with correct data', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Click submit button
        const submitButton = screen.getByText('Submit Attendance');
        fireEvent.click(submitButton);

        // Check that onSubmit was called with attendance data and summary
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                '1': 'present',
                '2': 'present',
                '3': 'present'
            }),
            expect.objectContaining({
                present: 3,
                absent: 0
            })
        );
    });

    test('handles loading state correctly', () => {
        render(
            <AttendanceMarkingGrid
                students={[]}
                loading={true}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByText('Loading students...')).toBeInTheDocument();
        expect(screen.queryByText('Submit Attendance')).not.toBeInTheDocument();
    });

    test('handles empty student list', () => {
        render(
            <AttendanceMarkingGrid
                students={[]}
                loading={false}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByText('No students found for this class. Please ensure students are enrolled.')).toBeInTheDocument();
    });

    test('disables controls when disabled prop is true', () => {
        render(
            <AttendanceMarkingGrid
                students={mockStudents}
                disabled={true}
                onAttendanceChange={mockOnAttendanceChange}
                onSubmit={mockOnSubmit}
            />
        );

        // Check that radio buttons are disabled
        const presentRadios = screen.getAllByLabelText('Present');
        expect(presentRadios[0]).toBeDisabled();

        // Check that bulk action buttons are disabled
        const markAllPresentButton = screen.getByText('Mark All Present');
        expect(markAllPresentButton).toBeDisabled();

        // Check that submit button is disabled
        const submitButton = screen.getByText('Submit Attendance');
        expect(submitButton).toBeDisabled();
    });
});