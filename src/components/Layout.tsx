import { useState, useEffect, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import BaseLayout from './BaseLayout';

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';

// Security improvements
const AUTH_STORAGE_KEY = 'promptPalAuth';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthData {
    userId: string;
    name: string;
    timestamp: number;
}

interface AuthenticatedLayoutProps {
    userId: string;
    name: string;
    onLogout: () => void;
}

interface UnauthenticatedLayoutProps {
    userId: string;
    name: string;
    onLogout: () => void;
    onUserLogin: (userId: string, name: string) => void;
}

interface LayoutProps {
    children: (props: AuthenticatedLayoutProps | UnauthenticatedLayoutProps) => ReactNode;
}

// Security utilities
const getStoredAuth = (): AuthData | null => {
    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!stored) return null;
        
        const authData: AuthData = JSON.parse(stored);
        const now = Date.now();
        
        // Check if session has expired
        if (now - authData.timestamp > SESSION_TIMEOUT) {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            return null;
        }
        
        return authData;
    } catch (error) {
        console.error('Error reading auth data:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
};

const setStoredAuth = (userId: string, name: string): void => {
    const authData: AuthData = {
        userId,
        name,
        timestamp: Date.now()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
};

const clearStoredAuth = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

export default function Layout({ children }: LayoutProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const location = useLocation();

    // Initialize auth state on mount
    useEffect(() => {
        const authData = getStoredAuth();
        if (authData) {
            setUserId(authData.userId);
            setName(authData.name);
        }
        setIsInitialized(true);
    }, []);

    // Verify user exists in backend
    useEffect(() => {
        if (userId && !name) {
            axios.get(`${API_BASE}/users/${userId}`)
                .then(res => {
                    const userName = res.data.name;
                    setName(userName);
                    setStoredAuth(userId, userName);
                })
                .catch(() => {
                    // If user doesn't exist, clear the stored auth
                    handleLogout();
                });
        }
    }, [userId, name]);

    // Auto-logout on session timeout
    useEffect(() => {
        if (!userId) return;

        const checkSession = () => {
            const authData = getStoredAuth();
            if (!authData) {
                handleLogout();
            }
        };

        // Check session every 5 minutes
        const interval = setInterval(checkSession, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userId]);

    // Auto-logout on tab visibility change (optional security measure)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) return;
            
            // When user returns to tab, verify session is still valid
            const authData = getStoredAuth();
            if (userId && !authData) {
                handleLogout();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [userId]);

    const handleUserLogin = (newUserId: string, newName: string) => {
        setUserId(newUserId);
        setName(newName);
        setStoredAuth(newUserId, newName);
    };

    const handleLogout = () => {
        setUserId(null);
        setName('');
        clearStoredAuth();
    };

    // Don't render anything until initialization is complete
    if (!isInitialized) {
        return null;
    }

    // If not authenticated and trying to access protected routes
    if (!userId && !['/', '/login', '/forgot-password', '/reset-password'].includes(location.pathname)) {
        return <Navigate to="/" replace />;
    }

    // If authenticated and on login page, redirect to dashboard
    if (userId && ['/', '/login'].includes(location.pathname)) {
        return <Navigate to="/dashboard" replace />;
    }

    // For login page
    if (!userId) {
        return (
            <>
                {children({ 
                    userId: '', 
                    name: '', 
                    onLogout: handleLogout,
                    onUserLogin: handleUserLogin 
                } as UnauthenticatedLayoutProps)}
            </>
        );
    }

    // For protected routes
    return (
        <BaseLayout name={name} onLogout={handleLogout}>
            {children({ 
                userId, 
                name, 
                onLogout: handleLogout 
            } as AuthenticatedLayoutProps)}
        </BaseLayout>
    );
} 