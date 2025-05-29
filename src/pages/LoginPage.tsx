import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';

interface LoginPageProps {
    onUserLogin: (userId: string, name: string) => void;
}

export default function LoginPage({ onUserLogin }: LoginPageProps) {
    const navigate = useNavigate();

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data.id),
        onSuccess: (data) => {
            onUserLogin(data.documentId, data.name);
            navigate('/dashboard');
        },
        onError: (error: unknown) => {
            console.error('User creation failed:', error);
            let errorMessage = 'Failed to create user. Please try again.';
            
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

    return (
        <LoginForm 
            onSubmit={(data) => createUser.mutate(data)}
            onSkip={() => createUser.mutate({ email: 'test@example.com', name: 'Test User' })}
            isLoading={createUser.isPending}
            error={createUser.error ? 'Please check your information and try again.' : null}
        />
    );
} 