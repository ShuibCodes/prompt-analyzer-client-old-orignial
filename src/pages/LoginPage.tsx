import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const API_BASE = 'http://localhost:1337/api';

interface LoginPageProps {
    onUserLogin: (userId: string, name: string) => void;
}

export default function LoginPage({ onUserLogin }: LoginPageProps) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    const login = useMutation({
        mutationFn: (data: { identifier: string; password: string }) =>
            axios.post(`${API_BASE}/auth/local`, data).then((res) => res.data),
        onSuccess: (data) => {
            onUserLogin(data.user.documentId, data.user.username);
            navigate('/dashboard');
        },
        onError: (error: unknown) => {
            console.error('Login failed:', error);
            let errorMessage = 'Failed to login. Please check your credentials.';
            
            if (typeof error === 'object' && error && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
                if (axiosError.response?.data?.error?.message) {
                    errorMessage = axiosError.response.data.error.message;
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        },
    });

    const register = useMutation({
        mutationFn: (data: { username: string; email: string; password: string }) =>
            axios.post(`${API_BASE}/auth/local/register`, data).then((res) => res.data),
        onSuccess: (data) => {
            onUserLogin(data.user.documentId, data.user.username);
            navigate('/dashboard');
        },
        onError: (error: unknown) => {
            console.error('Registration failed:', error);
            let errorMessage = 'Failed to register. Please try again.';
            
            if (typeof error === 'object' && error && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
                if (axiosError.response?.data?.error?.message) {
                    errorMessage = axiosError.response.data.error.message;
                } else if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        },
    });

    if (isLogin) {
        return (
            <LoginForm 
                onSubmit={(data) => login.mutate(data)}
                onRegisterClick={() => setIsLogin(false)}
                isLoading={login.isPending}
                error={login.error ? 'Please check your credentials and try again.' : null}
            />
        );
    }

    return (
        <RegisterForm 
            onSubmit={(data) => register.mutate(data)}
            onLoginClick={() => setIsLogin(true)}
            isLoading={register.isPending}
            error={register.error ? 'Please check your information and try again.' : null}
        />
    );
} 