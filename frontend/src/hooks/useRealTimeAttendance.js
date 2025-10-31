import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getUserDetails } from '../redux/userRelated/userHandle';

/**
 * Custom hook for real-time attendance updates
 * Polls for attendance data changes at specified intervals
 */
const useRealTimeAttendance = (userId, userType = "Student", intervalMs = 30000) => {
    const dispatch = useDispatch();
    const intervalRef = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    useEffect(() => {
        if (!userId) return;

        const fetchUpdates = () => {
            // Only fetch if it's been more than the interval since last update
            const now = Date.now();
            if (now - lastUpdateRef.current >= intervalMs) {
                dispatch(getUserDetails(userId, userType));
                lastUpdateRef.current = now;
            }
        };

        // Set up polling interval
        intervalRef.current = setInterval(fetchUpdates, intervalMs);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [userId, userType, intervalMs, dispatch]);

    // Manual refresh function
    const refreshAttendance = () => {
        if (userId) {
            dispatch(getUserDetails(userId, userType));
            lastUpdateRef.current = Date.now();
        }
    };

    // Stop real-time updates
    const stopRealTimeUpdates = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Start real-time updates
    const startRealTimeUpdates = () => {
        if (!intervalRef.current && userId) {
            intervalRef.current = setInterval(() => {
                dispatch(getUserDetails(userId, userType));
            }, intervalMs);
        }
    };

    return {
        refreshAttendance,
        stopRealTimeUpdates,
        startRealTimeUpdates
    };
};

export default useRealTimeAttendance;