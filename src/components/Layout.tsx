import { useState, useEffect, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';

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

export default function Layout({ children }: LayoutProps) {
    const [userId, setUserId] = useState<string | null>(
        localStorage.getItem('promptPalUserId')
    );
    const [name, setName] = useState(
        localStorage.getItem('promptPalUserName') || ''
    );
    const location = useLocation();

    useEffect(() => {
        if (userId && !name) {
            axios.get(`${API_BASE}/users/${userId}`)
                .then(res => {
                    const userName = res.data.name;
                    setName(userName);
                    localStorage.setItem('promptPalUserName', userName);
                })
                .catch(() => {
                    // If user doesn't exist, clear the stored userId
                    handleLogout();
                });
        }
    }, [userId, name]);

    const handleUserLogin = (newUserId: string, newName: string) => {
        setUserId(newUserId);
        setName(newName);
        localStorage.setItem('promptPalUserId', newUserId);
        localStorage.setItem('promptPalUserName', newName);
    };

    const handleLogout = () => {
        setUserId(null);
        setName('');
        localStorage.removeItem('promptPalUserId');
        localStorage.removeItem('promptPalUserName');
    };

    // If not authenticated and trying to access protected routes
    if (!userId && location.pathname !== '/') {
        return <Navigate to="/" replace />;
    }

    // If authenticated and on login page, redirect to dashboard
    if (userId && location.pathname === '/') {
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
        <>
            {children({ 
                userId, 
                name, 
                onLogout: handleLogout 
            } as AuthenticatedLayoutProps)}
        </>
    );
} 