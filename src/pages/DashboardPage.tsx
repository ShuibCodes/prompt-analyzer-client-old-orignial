import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Paper } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import TaskImage from '../components/TaskImage';
import TaskHint from '../components/TaskHint';
import TaskResults from '../components/TaskResults';
import TaskSubmission from '../components/TaskSubmission';
import { convertArrayToObject } from '../utils';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import type { CriteriaData } from '../types';
import type { Image } from '../components/types';

interface CriterionResult {
    criterionId: string;
    score: number;
    subquestionResults: Array<{
        subquestionId: string;
        score: number;
        feedback: string;
    }>;
}

interface TaskResult {
    taskId: string;
    score: number;
    criterionResults: CriterionResult[];
}

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';

interface DashboardPageProps {
    userId: string;
    name: string;
    onLogout: () => void;
}

export default function DashboardPage({ userId, name, onLogout }: DashboardPageProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [userSolutions, setUserSolutions] = useState<Record<string, string>>({});
    const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
    const [taskAttempts, setTaskAttempts] = useState<Record<string, number>>({});
    const [taskScores, setTaskScores] = useState<Record<string, number[]>>({});
    const [showHint, setShowHint] = useState<Record<string, boolean>>({});
    const [showResults, setShowResults] = useState<Record<string, boolean>>({});
    const previousTaskResultsRef = useRef<Record<string, TaskResult>>({});
    const [runTutorial, setRunTutorial] = useState(false);

    const steps: Step[] = [
        {
            target: 'body',
            content: 'Welcome to Prompt Pal! Let\'s take a quick tour of how to use this platform.',
            placement: 'center' as const,
            disableBeacon: true,
        },
        {
            target: '.task-content',
            content: 'Here you\'ll see the task description and any associated images. Read them carefully!',
            placement: 'bottom' as const,
        },
        {
            target: '.solution-input',
            content: 'This is where you\'ll write your prompt solution. Be as detailed and specific as possible!',
            placement: 'top' as const,
        },
        {
            target: '.submit-button',
            content: 'Click here to submit your solution and get feedback.',
            placement: 'top' as const,
        },
        {
            target: 'body',
            content: 'After submission, you\'ll see detailed feedback and scores here. Your performance will be evaluated based on multiple criteria.',
            placement: 'center' as const,
            disableBeacon: true,
        },
        {
            target: 'body',
            content: 'If you\'re struggling, hints will become available after multiple attempts. Don\'t worry if you don\'t get it right the first time!',
            placement: 'center' as const,
            disableBeacon: true,
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRunTutorial(false);
        }
    };

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

    const submitSolution = useMutation({
        mutationFn: ({ taskId, solutionPrompt }: { taskId: string; solutionPrompt: string }) =>
            axios.post(`${API_BASE}/users/${userId}/submissions`, { taskId, solutionPrompt }),
        onSuccess: () => {
            console.log("Solution submitted successfully. Waiting for results...");
        },
        onError: (error: unknown) => {
            console.error('Submission failed:', error);
            setEvaluatingTaskId(null);
            
            let errorMessage = 'Failed to submit your solution. Please try again.';
            
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

    const resultsQuery = useQuery({
        queryKey: ['results', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/results`).then((res) => res.data),
        enabled: !!userId && (!!evaluatingTaskId),
        refetchInterval: () => evaluatingTaskId ? 2000 : false,
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (!evaluatingTaskId || !resultsQuery.data) return;
      
        const newResult = resultsQuery.data.taskResults.find(
            (r: TaskResult) => r.taskId === evaluatingTaskId
        );
        const oldResult = previousTaskResultsRef.current[evaluatingTaskId];

        if (!newResult || (oldResult && JSON.stringify(newResult) === JSON.stringify(oldResult))) {
            console.log(`Waiting for an updated result for ${evaluatingTaskId}…`);
            return;
        }
        
        console.log(`Results received for task ${evaluatingTaskId}. Processing score.`);

        if (newResult) {
            const totalScore = newResult.criterionResults.reduce(
                (sum: number, criterion: CriterionResult) => sum + criterion.score, 0
            );
            const maxPossibleScore = newResult.criterionResults.length * 5;
            const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
            
            setTaskAttempts(prev => ({
                ...prev,
                [evaluatingTaskId]: (prev[evaluatingTaskId] || 0) + 1
            }));
            
            setTaskScores(prev => ({
                ...prev,
                [evaluatingTaskId]: [...(prev[evaluatingTaskId] || []), percentageScore]
            }));
            
            setShowResults(prev => ({
                ...prev,
                [evaluatingTaskId]: true
            }));

            setEvaluatingTaskId(null);
        }
    }, [resultsQuery.data, evaluatingTaskId]);

    useEffect(() => {
        if (userId && !name) {
            axios.get(`${API_BASE}/users/${userId}`)
                .then(() => {
                    // Handle name update if needed
                });
        }
    }, [userId, name]);

    // Check if all tasks are completed and redirect to results
    useEffect(() => {
        if (tasksQuery.data && currentTaskIndex >= tasksQuery.data.length) {
            navigate('/results');
        }
    }, [currentTaskIndex, tasksQuery.data, navigate]);

    // Start tutorial for new users
    useEffect(() => {
        setRunTutorial(true);
    }, []);

    const handleSolutionSubmit = () => {
        if (!userId) return;
        const task = tasksQuery.data?.[currentTaskIndex];
        if (!task) return;
      
        const id = task.id;
        const previousResult = resultsQuery.data?.taskResults.find((r: TaskResult) => r.taskId === id);
        previousTaskResultsRef.current[id] = previousResult;
      
        queryClient.removeQueries({ queryKey: ['results', userId] });
      
        setShowHint(prev => ({ ...prev, [id]: false }));
        setShowResults(prev => ({ ...prev, [id]: false }));
      
        setEvaluatingTaskId(id);
      
        submitSolution.mutate(
            {
                taskId: id,
                solutionPrompt: userSolutions[id] || ''
            },
            {
                onSuccess: () => console.log(`Submitted task ${id}, polling for new results…`),
            }
        );
    };

    const handleRestartQuiz = () => {
        setCurrentTaskIndex(0);
        setUserSolutions({});
        setShowHint({});
        setShowResults({});
        setTaskAttempts({});
        setTaskScores({});
        navigate('/dashboard');
    };

    const task = tasksQuery.data?.[currentTaskIndex];
    const userSolution = userSolutions[task?.id] || '';
    const currentTaskResult = resultsQuery.data?.taskResults?.find(
        (result: TaskResult) => result.taskId === task?.id
    );
    const hasResults = !!currentTaskResult && currentTaskResult.criterionResults?.length > 0;
    const shouldShowResults = hasResults && showResults[task?.id];
    const currentAttempts = taskAttempts[task?.id] || 0;
    const currentScores = taskScores[task?.id] || [];
    const canShowHint = currentAttempts >= 2 && currentScores.filter(score => score <= 20).length >= 2;

    // Show loading with proper layout instead of blank page
    if (tasksQuery.isLoading) {
        return (
            <>
                <Box sx={{ 
                    display: 'flex', 
                    minHeight: '100vh', 
                    bgcolor: 'linear-gradient(135deg, #f4f6fa 60%, #ffe0b2 100%)',
                    flexDirection: { xs: 'column', md: 'row' }
                }}>
                    <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={onLogout} />
                    <Box sx={{ 
                        flex: 1, 
                        ml: { xs: 0, md: '260px' }, 
                        mr: { xs: 0, md: '300px' }, 
                        p: { xs: 2, md: 4 }, 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}>
                        {/* Header Bar */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            mb: 4,
                            px: 1,
                            py: 1.5,
                            borderRadius: 3,
                            bgcolor: '#fffbe7',
                            boxShadow: 1,
                            gap: 1,
                            justifyContent: 'center',
                            position: 'fixed',
                            top: 20,
                            left: { xs: 20, md: '280px' },
                            right: { xs: 20, md: '320px' },
                            zIndex: 10,
                        }}>
                            <EmojiEventsIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#ff9800', fontSize: '1.2rem', letterSpacing: 1 }}>
                                Prompt Pal
                            </Typography>
                        </Box>
                        
                        {/* Loading Content */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: 3,
                            mt: 8 
                        }}>
                            <EmojiEventsIcon sx={{ fontSize: 60, color: '#ff9800', animation: 'pulse 2s infinite' }} />
                            <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 600 }}>
                                Preparing Your Challenge...
                            </Typography>
                            <Typography sx={{ color: '#666', textAlign: 'center', maxWidth: 400 }}>
                                Loading your personalized tasks and getting everything ready for you!
                            </Typography>
                            <Box sx={{ 
                                width: 200, 
                                height: 4, 
                                bgcolor: '#ffe0b2', 
                                borderRadius: 2,
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <Box sx={{
                                    width: '100%',
                                    height: '100%',
                                    bgcolor: '#ff9800',
                                    borderRadius: 2,
                                    animation: 'loading 1.5s ease-in-out infinite',
                                    '@keyframes loading': {
                                        '0%': { transform: 'translateX(-100%)' },
                                        '50%': { transform: 'translateX(0%)' },
                                        '100%': { transform: 'translateX(100%)' }
                                    },
                                    '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.5 }
                                    }
                                }} />
                            </Box>
                        </Box>
                    </Box>
                    <RightSidebar />
                </Box>
            </>
        );
    }

    // Show error state if tasks failed to load
    if (tasksQuery.isError) {
        return (
            <>
                <Box sx={{ 
                    display: 'flex', 
                    minHeight: '100vh', 
                    bgcolor: 'linear-gradient(135deg, #f4f6fa 60%, #ffe0b2 100%)',
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
                        alignItems: 'center' 
                    }}>
                        <Paper elevation={3} sx={{ 
                            p: 4, 
                            textAlign: 'center',
                            borderRadius: 4,
                            maxWidth: 400
                        }}>
                            <Typography variant="h6" color="error" gutterBottom>
                                Failed to Load Tasks
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                We couldn't load your tasks. Please try refreshing the page.
                            </Typography>
                            <button 
                                onClick={() => window.location.reload()} 
                                style={{
                                    padding: '8px 16px',
                                    background: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Refresh Page
                            </button>
                        </Paper>
                    </Box>
                    <RightSidebar />
                </Box>
            </>
        );
    }

    // If no tasks available but loaded successfully
    if (!task) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography>No tasks available</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ 
                display: 'flex', 
                minHeight: '100vh', 
                bgcolor: 'linear-gradient(135deg, #f4f6fa 60%, #ffe0b2 100%)',
                flexDirection: { xs: 'column', md: 'row' }
            }}>
                <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={onLogout} />
                <Box sx={{ 
                    flex: 1, 
                    ml: { xs: 0, md: '260px' }, 
                    mr: { xs: 0, md: '300px' }, 
                    p: { xs: 2, md: 4 }, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    position: 'relative',
                }}>
                    {/* Header Bar */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        mb: 2,
                        mt: 1,
                        px: 1,
                        py: 1.5,
                        borderRadius: 3,
                        bgcolor: '#fffbe7',
                        boxShadow: 1,
                        gap: 1,
                        justifyContent: 'center',
                    }}>
                        <EmojiEventsIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={700} sx={{ color: '#ff9800', fontSize: '1.2rem', letterSpacing: 1 }}>
                            Prompt Pal
                        </Typography>
                    </Box>
                    {/* Motivational Message */}
                    <Typography sx={{
                        fontWeight: 600,
                        color: '#ff9800',
                        fontSize: '1.1rem',
                        mb: 1,
                        textAlign: 'center',
                        letterSpacing: 0.5,
                    }}>
                        Ready for today's challenge? Let's get creative!
                    </Typography>
                    {/* Decorative Icon */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 1,
                    }}>
                        <EmojiEventsIcon sx={{ fontSize: 40, color: '#ffd54f' }} />
                    </Box>
                    <Paper elevation={3} sx={{ 
                        width: '100%', 
                        maxWidth: 700, 
                        p: { xs: 2, md: 4 }, 
                        borderRadius: 4, 
                        bgcolor: '#fff',
                        border: '2px solid #ffe0b2',
                        boxShadow: '0 4px 24px 0 #ffe08255',
                        mt: { xs: 1, md: 0 }
                    }} className="task-content">
                        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                            Task {currentTaskIndex + 1}: {task?.name}
                        </Typography>
                        <Typography component="p" sx={{ my: 2, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                            {task?.question}
                        </Typography>
                        {task?.Image?.length > 0 && (
                            <Box sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: { xs: 1, md: 2 }, 
                                my: 2 
                            }}>
                                {task.Image.map((img: Image, idx: number) => (
                                    <Box key={idx} sx={{ 
                                        width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 10px)' }, 
                                        position: 'relative' 
                                    }}>
                                        <TaskImage image={img} />
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {canShowHint && (
                            <TaskHint 
                                task={task}
                                showHint={showHint[task?.id]}
                                onToggleHint={() => setShowHint(prev => ({
                                    ...prev,
                                    [task?.id]: !prev[task?.id]
                                }))}
                            />
                        )}
                        <TaskSubmission 
                            userSolution={userSolution}
                            onSolutionChange={(value) => setUserSolutions(prev => ({ ...prev, [task?.id]: value }))}
                            onSubmit={handleSolutionSubmit}
                            isEvaluating={!!evaluatingTaskId}
                        />
                        {shouldShowResults && (
                            <TaskResults 
                                taskResult={currentTaskResult}
                                criteriaData={criteriaQuery.data as CriteriaData || {}}
                                currentAttempts={currentAttempts}
                                onNextTask={() => setCurrentTaskIndex(prev => prev + 1)}
                            />
                        )}
                    </Paper>
                </Box>
                <RightSidebar />
            </Box>
            <Joyride
                steps={steps}
                run={runTutorial}
                continuous
                showProgress
                showSkipButton
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        primaryColor: '#ff9800',
                        zIndex: 10000,
                        backgroundColor: '#fff',
                        textColor: '#333',
                        arrowColor: '#fff',
                        overlayColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    tooltipContainer: {
                        textAlign: 'left',
                        maxWidth: 420,
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        padding: '28px 32px',
                        fontSize: '1.05rem',
                        boxShadow: '0 8px 32px rgba(255, 152, 0, 0.18), 0 2px 12px rgba(0,0,0,0.10)',
                        border: '3px solid #ffb300',
                        position: 'relative',
                        outline: 'none',
                        transition: 'box-shadow 0.2s',
                    },
                    tooltipTitle: {
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        marginBottom: 14,
                        color: '#ff9800',
                    },
                    tooltipContent: {
                        fontSize: '1.05rem',
                        lineHeight: 1.7,
                        color: '#333',
                    },
                    buttonNext: {
                        backgroundColor: '#ff9800',
                        color: '#fff',
                        fontSize: '1rem',
                        padding: '10px 28px',
                        borderRadius: 8,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(255, 152, 0, 0.18)',
                        border: 'none',
                        marginLeft: 8,
                        transition: 'background 0.2s',
                    },
                    buttonBack: {
                        color: '#ff9800',
                        background: 'none',
                        fontWeight: 500,
                        marginRight: 8,
                        fontSize: '1rem',
                        textTransform: 'none',
                        border: 'none',
                    },
                    buttonSkip: {
                        color: '#666',
                        background: 'none',
                        fontSize: '1rem',
                        textTransform: 'none',
                        border: 'none',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    spotlight: {
                        backgroundColor: 'transparent',
                    },
                }}
            />
        </>
    );
} 