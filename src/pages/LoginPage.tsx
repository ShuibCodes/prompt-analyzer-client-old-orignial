import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { Button } from '@mui/material';
import { AUTH_BASE } from '../config';

interface LoginPageProps {
    onUserLogin: (userId: string, name: string) => void;
}

export default function LoginPage({ onUserLogin }: LoginPageProps) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    const login = useMutation({
        mutationFn: (data: { identifier: string; password: string }) =>
            axios.post(`${AUTH_BASE}/auth/local`, data).then((res) => res.data),
        onSuccess: (data) => {
            onUserLogin(data.user.documentId, data.user.name);
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
        mutationFn: async (userData: { username: string; email: string; password: string, name: string, lastname: string }) => {
            try {
                const data = {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    name: userData.name,
                    lastname: userData.lastname
                };
                
                const response = await axios.post(`${AUTH_BASE}/auth/local/register`, data);
                return response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    console.error('Registration error details:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                }
                throw error;
            }
        },
        onError: (error: unknown) => {
            console.error('Registration failed:', error);
            let errorMessage = 'Failed to register. Please try again.';
            
            if (axios.isAxiosError(error) && error.response?.data) {
                const errorData = error.response.data;
                console.error('Full error response:', errorData);
                
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
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
        onSuccess: (data) => {
            console.log(data.user);
            onUserLogin(data.user.documentId, data.user.name);
            navigate('/dashboard');
        },
    });

    if (isLogin) {
        return (
            <>
                <LoginForm 
                    onSubmit={(data) => login.mutate(data)}
                    onRegisterClick={() => setIsLogin(false)}
                    isLoading={login.isPending}
                    error={login.error ? 'Please check your credentials and try again.' : null}
                />
                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/register')}
                    sx={{
                        textTransform: 'none',
                        color: '#4a5568'
                    }}
                >
                    Don't have an account? Sign up
                </Button>
                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/forgot-password')}
                    sx={{
                        textTransform: 'none',
                        color: '#4a5568',
                        mt: 1
                    }}
                >
                    Forgot your password?
                </Button>
            </>
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