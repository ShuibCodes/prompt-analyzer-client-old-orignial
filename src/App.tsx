// @ts-nocheck

import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
    Paper, 
    createTheme, 
    ThemeProvider, 
    CssBaseline, 
} from '@mui/material';
import {QueryClient, QueryClientProvider, useMutation, useQuery} from '@tanstack/react-query';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import LoginForm from './components/LoginForm';
import TaskImage from './components/TaskImage';
import TaskHint from './components/TaskHint';
import TaskResults from './components/TaskResults';
import TaskSubmission from './components/TaskSubmission';
import FinalResults from './components/FinalResults';
import { convertArrayToObject } from './utils';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Types
interface TaskResult {
    taskId: string;
    score: number;
    criterionResults: Array<{
        criterionId: string;
        score: number;
        subquestionResults: Array<{
            subquestionId: string;
            score: number;
            feedback: string;
        }>;
    }>;
}

//const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';
const API_BASE = 'http://localhost:1337/api/analyzer';

// Theme
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#ff9800',
        },
        background: {
            default: '#f4f6fa',
        },
    },
    shape: { borderRadius: 12 },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
});

const queryClient = new QueryClient();

// Components

function Application() {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [userSolutions, setUserSolutions] = useState<Record<string, string>>({});
    const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
    const [taskAttempts, setTaskAttempts] = useState<Record<string, number>>({});
    const [taskScores, setTaskScores] = useState<Record<string, number[]>>({});
    const [showHint, setShowHint] = useState<Record<string, boolean>>({});
    const [showResults, setShowResults] = useState<Record<string, boolean>>({});
    const previousTaskResultsRef = useRef<Record<string, TaskResult>>({});
    const [runTutorial, setRunTutorial] = useState(false);

    const steps = [
        {
            target: 'body',
            content: 'Welcome to Prompt Pal! Let\'s take a quick tour of how to use this platform.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.task-content',
            content: 'Here you\'ll see the task description and any associated images. Read them carefully!',
            placement: 'bottom',
        },
        {
            target: '.solution-input',
            content: 'This is where you\'ll write your prompt solution. Be as detailed and specific as possible!',
            placement: 'top',
        },
        {
            target: '.submit-button',
            content: 'Click here to submit your solution and get feedback.',
            placement: 'top',
        },
        {
            target: 'body',
            content: 'After submission, you\'ll see detailed feedback and scores here. Your performance will be evaluated based on multiple criteria.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: 'body',
            content: 'If you\'re struggling, hints will become available after multiple attempts. Don\'t worry if you don\'t get it right the first time!',
            placement: 'center',
            disableBeacon: true,
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRunTutorial(false);
        }
    };

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data.id),
        onSuccess: (data) => {
            setUserId(data.documentId);
            setName(data.name);
            setRunTutorial(true);
        },
    });

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
    });

    const resultsQuery = useQuery({
        queryKey: ['results', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/results`).then((res) => res.data),
        enabled: !!userId && (!!evaluatingTaskId),
        refetchInterval: () => evaluatingTaskId ? 2000 : false,
        refetchIntervalInBackground: true,
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
                (sum, criterion) => sum + criterion.score, 0
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
                .then(res => {
                    setName(res.data.name);
                });
        }
    }, [userId, name]);

    const handleSolutionSubmit = () => {
        if (!userId) return;
        const task = tasksQuery.data?.[currentTaskIndex];
        if (!task) return;
      
        const id = task.id;
        const previousResult = resultsQuery.data?.taskResults.find(r => r.taskId === id);
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
                onError: err => {
                    console.error('Submission failed:', err);
                    setEvaluatingTaskId(null);
                }
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
    };

    const handleLogout = () => {
        setUserId(null);
        setName('');
    };

    if (!userId) {
        return (
            <LoginForm 
                onSubmit={(data) => createUser.mutate(data)}
                onSkip={() => createUser.mutate({ email: 'test@example.com', name: 'Test User' })}
            />
        );
    }

    if (currentTaskIndex >= tasksQuery.data?.length) {
        return (
            <>
                <Box sx={{ 
                    display: 'flex', 
                    minHeight: '100vh', 
                    bgcolor: '#f4f6fa',
                    flexDirection: { xs: 'column', md: 'row' }
                }}>
                    <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={handleLogout} />
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
                                isSendingEmail={sendResultsEmail.isLoading}
                                onRestartQuiz={handleRestartQuiz}
                            />
                        </Paper>
                    </Box>
                    <RightSidebar />
                </Box>
            </>
        );
    }

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

    return (
        <>
            <Box sx={{ 
                display: 'flex', 
                minHeight: '100vh', 
                bgcolor: 'linear-gradient(135deg, #f4f6fa 60%, #ffe0b2 100%)',
                flexDirection: { xs: 'column', md: 'row' }
            }}>
                <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={handleLogout} />
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
                    {/* Header Bar (always visible) */}
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
                    {/* Motivational Message (always visible) */}
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
                    {/* Decorative Icon (always visible) */}
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
                                {task.Image.map((img, idx) => (
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
                                className="hint-section"
                            />
                        )}
                        <TaskSubmission 
                            task={task}
                            userSolution={userSolution}
                            onSolutionChange={(value) => setUserSolutions(prev => ({ ...prev, [task?.id]: value }))}
                            onSubmit={handleSolutionSubmit}
                            isEvaluating={!!evaluatingTaskId}
                            className="solution-input"
                        />
                        {shouldShowResults && (
                            <TaskResults 
                                taskResult={currentTaskResult}
                                criteriaData={criteriaQuery.data}
                                currentAttempts={currentAttempts}
                                onNextTask={() => setCurrentTaskIndex(prev => prev + 1)}
                                className="results-section"
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
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    },
                    tooltipContainer: {
                        textAlign: 'left',
                        maxWidth: 420,
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        padding: '28px 32px',
                        fontSize: '1.05rem',
                        boxShadow: '0 8px 32px rgba(255, 152, 0, 0.18), 0 2px 12px rgba(0,0,0,0.10)',
                        border: '3px solid #ffb300',
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                        position: 'relative',
                        outline: 'none',
                        transition: 'box-shadow 0.2s',
                    },
                    tooltipTitle: {
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        marginBottom: 14,
                        color: '#ff9800',
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                    },
                    tooltipContent: {
                        fontSize: '1.05rem',
                        lineHeight: 1.7,
                        color: '#333',
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                        border: 'none',
                    },
                    buttonSkip: {
                        color: '#666',
                        background: 'none',
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme/>
            <QueryClientProvider client={queryClient}>
                <Application />
            </QueryClientProvider>
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </ThemeProvider>
    );
}

export default App;