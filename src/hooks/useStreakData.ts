import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { SecureAuth } from '../components/SecureAuth';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastActivity: string | null;
    isActiveToday: boolean;
    completedTasks: number;
    totalTasks: number;
    streakPercentage: number;
}

export const useStreakData = () => {
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchStreakData = async () => {
        try {
            setLoading(true);
            setError(null);

            const authData = SecureAuth.getAuth();
            if (!authData) {
                console.warn('🔐 No auth data found for streak fetch');
                setError('User not authenticated');
                setStreakData(null);
                setCurrentUserId(null);
                setLoading(false);
                return;
            }

            // Check if user has changed
            if (currentUserId && currentUserId !== authData.userId) {
                console.log('👤 User changed, clearing previous streak data');
                setStreakData(null);
            }

            setCurrentUserId(authData.userId);
            console.log('📊 Fetching streak data for user:', authData.userId);

            // Fetch streak data
            const [streakResponse, completedTasksResponse] = await Promise.all([
                axios.get(`${API_BASE}/users/${authData.userId}/streak`),
                axios.get(`${API_BASE}/users/${authData.userId}/completed-tasks`)
            ]);

            console.log('🏆 Streak API Response:', streakResponse.data);
            console.log('✅ Completed Tasks API Response:', completedTasksResponse.data);

            const streak = streakResponse.data.data || {
                currentStreak: 0,
                longestStreak: 0,
                lastActivity: null,
                isActiveToday: false
            };

            const completedTasks = completedTasksResponse.data.data || [];
            const completedCount = Array.isArray(completedTasks) ? completedTasks.length : 0;

            // Calculate streak percentage (current vs longest)
            const streakPercentage = streak.longestStreak > 0 
                ? Math.round((streak.currentStreak / streak.longestStreak) * 100)
                : 0;

            const newStreakData = {
                currentStreak: streak.currentStreak || 0,
                longestStreak: streak.longestStreak || 0,
                lastActivity: streak.lastActivity,
                isActiveToday: streak.isActiveToday || false,
                completedTasks: completedCount,
                totalTasks: 0, // We can calculate this if needed
                streakPercentage
            };

            console.log('📈 Setting new streak data:', newStreakData);
            setStreakData(newStreakData);

        } catch (err) {
            console.error('❌ Error fetching streak data:', err);
            setError('Failed to load streak data');
            
            // Set default data on error
            setStreakData({
                currentStreak: 0,
                longestStreak: 0,
                lastActivity: null,
                isActiveToday: false,
                completedTasks: 0,
                totalTasks: 0,
                streakPercentage: 0
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStreakData();
    }, []); // Initial fetch

    // Add a periodic check to detect user changes
    useEffect(() => {
        const checkUserChange = () => {
            const authData = SecureAuth.getAuth();
            const newUserId = authData?.userId || null;
            
            if (currentUserId !== newUserId) {
                console.log('🔄 User change detected, refreshing streak data');
                fetchStreakData();
            }
        };

        // Check for user changes every 2 seconds
        const interval = setInterval(checkUserChange, 2000);
        
        return () => clearInterval(interval);
    }, [currentUserId]);

    const refreshStreakData = () => {
        console.log('🔄 Refreshing streak data...');
        fetchStreakData();
    };

    return {
        streakData,
        loading,
        error,
        refreshStreakData
    };
};

export default useStreakData; 