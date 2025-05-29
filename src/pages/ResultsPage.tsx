import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { Paper } from '@mui/material';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import FinalResults from '../components/FinalResults';
import { convertArrayToObject } from '../utils';

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';

interface ResultsPageProps {
    userId: string;
    name: string;
    onLogout: () => void;
}

export default function ResultsPage({ userId, name, onLogout }: ResultsPageProps) {
    const navigate = useNavigate();

    const tasksQuery = useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/tasks`).then((res) => res.data.data),
        enabled: !!userId,
    });

    const criteriaQuery = useQuery({
        queryKey: ['criteria'],
        queryFn: () => axios.get(`${API_BASE}/criteria`).then((res) => convertArrayToObject(res.data.data, 'id')),
        enabled: true,
    });

    const resultsQuery = useQuery({
        queryKey: ['results', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/results`).then((res) => res.data),
        enabled: !!userId,
    });

    const sendResultsEmail = useMutation({
        mutationFn: () => axios.post(`${API_BASE}/users/${userId}/send-results`),
        onSuccess: () => {
            toast.success('Results have been sent to your email successfully! 🎉', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
                style: {
                    fontSize: '1.1em',
                    fontWeight: 500,
                },
            });
        },
        onError: (error: Error) => {
            console.error("Failed to send results email:", error.message);
            toast.error('Failed to send email. Please try again.');
        }
    });

    const handleRestartQuiz = () => {
        navigate('/dashboard');
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            minHeight: '100vh', 
            bgcolor: '#f4f6fa',
            flexDirection: { xs: 'column', md: 'row' }
        }}>
            <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={onLogout} />
            <Box sx={{ 
                flex: 1, 
                ml: { xs: 0, md: '260px' }, 
                mr: { xs: 0, md: '300px' }, 
                p: { xs: 2, md: 4 }, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'flex-start' 
            }}>
                <Paper elevation={3} sx={{ 
                    width: '100%', 
                    maxWidth: 700, 
                    p: { xs: 2, md: 4 }, 
                    borderRadius: 4, 
                    boxShadow: 3, 
                    bgcolor: '#fff' 
                }}>
                    <FinalResults 
                        tasksMap={tasksQuery.data ? convertArrayToObject(tasksQuery.data, 'id') : null}
                        criteriaData={criteriaQuery.data}
                        resultsData={resultsQuery.data}
                        onSendEmail={() => sendResultsEmail.mutate()}
                        isSendingEmail={sendResultsEmail.isPending}
                        onRestartQuiz={handleRestartQuiz}
                    />
                </Paper>
            </Box>
            <RightSidebar />
        </Box>
    );
} 