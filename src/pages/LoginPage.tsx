import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import GoogleSignIn from '../components/GoogleSignIn';
import { Button, Box, Divider, Typography, Paper } from '@mui/material';
import { AUTH_BASE, API_BASE } from '../config';

interface LoginPageProps {
    onUserLogin: (userId: string, name: string) => void;
}

export default function LoginPage({ onUserLogin }: LoginPageProps) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // Google OAuth mutation
    const googleSignIn = useMutation({
        mutationFn: async (userData: {
            email: string;
            name: string;
            googleId: string;
        }) => {
            const response = await axios.post(`${API_BASE}/google-signin`, userData);
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                onUserLogin(data.user.id, data.user.name);
                navigate('/dashboard');
                toast.success(`Welcome, ${data.user.name}!`, {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "colored",
                });
            } else {
                toast.error('Failed to authenticate with server');
            }
        },
        onError: (error: unknown) => {
            console.error('Google sign-in error:', error);
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
                ? error.response.data.error 
                : 'Failed to sign in with Google';
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
                theme: "colored",
            });
        },
    });

    const handleGoogleSuccess = (userData: {
        email: string;
        name: string;
        googleId: string;
    }) => {
        googleSignIn.mutate(userData);
    };

    const handleGoogleError = (error: string) => {
        toast.error(error, {
            position: "top-center",
            autoClose: 5000,
            theme: "colored",
        });
    };

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

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={4} sx={{ p: 5, borderRadius: 4, minWidth: 350, maxWidth: 400, width: '100%', boxShadow: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff6600', letterSpacing: 1 }}>Prompt Pal</Typography>
                </Box>
                
                {isLogin ? (
                    <Box>
                        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 3, fontWeight: 700 }}>
                            Welcome back! Please login:
                        </Typography>

                        {/* Google Sign-In Section */}
                        <Box sx={{ mb: 3 }}>
                            <GoogleSignIn
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                            />
                        </Box>

                        {/* Divider */}
                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Or continue with email
                            </Typography>
                        </Divider>

                        {/* Traditional Login Form (form fields only) */}
                        <LoginForm 
                            onSubmit={(data) => login.mutate(data)}
                            onRegisterClick={() => setIsLogin(false)}
                            isLoading={login.isPending}
                            error={login.error ? 'Please check your credentials and try again.' : null}
                            embedded={true}
                        />
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 3, fontWeight: 700 }}>
                            Create your account:
                        </Typography>

                        {/* Google Sign-In Section for Registration */}
                        <Box sx={{ mb: 3 }}>
                            <GoogleSignIn
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                            />
                        </Box>

                        {/* Divider */}
                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Or create account with email
                            </Typography>
                        </Divider>

                        {/* Traditional Registration Form */}
                        <RegisterForm 
                            onSubmit={(data) => register.mutate(data)}
                            onLoginClick={() => setIsLogin(true)}
                            isLoading={register.isPending}
                            error={register.error ? 'Please check your information and try again.' : null}
                            embedded={true}
                        />
                    </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={() => setIsLogin(!isLogin)}
                        sx={{
                            textTransform: 'none',
                            color: '#4a5568'
                        }}
                    >
                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </Button>
                    {isLogin && (
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => navigate('/forgot-password')}
                            sx={{
                                textTransform: 'none',
                                color: '#4a5568'
                            }}
                        >
                            Forgot your password?
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
} 