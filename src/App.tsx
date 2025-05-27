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
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import LoginForm from './components/LoginForm';
import TaskImage from './components/TaskImage';
import TaskHint from './components/TaskHint';
import TaskResults from './components/TaskResults';
import TaskSubmission from './components/TaskSubmission';
import FinalResults from './components/FinalResults';
import { convertArrayToObject } from './utils';
import TutorialVideo from './components/TutorialVideo';

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

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';
// const API_BASE = 'http://localhost:1337/api/analyzer';

// Theme
const theme = createTheme({
    colorSchemes: { dark: false },
    shape: { borderRadius: 12 }
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
    const [showTutorial, setShowTutorial] = useState(false);

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data.id),
        onSuccess: (data) => {
            setUserId(data.documentId);
            setName(data.name);
            setShowTutorial(true);
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
                <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fa' }}>
                    <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={handleLogout} />
                    <Box sx={{ flex: 1, ml: '260px', mr: '300px', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <Paper elevation={3} sx={{ width: '100%', maxWidth: 700, p: 4, borderRadius: 4, boxShadow: 3, bgcolor: '#fff' }}>
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
                <TutorialVideo 
                    open={showTutorial} 
                    onClose={() => setShowTutorial(false)} 
                />
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
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fa' }}>
                <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={handleLogout} />
                <Box sx={{ flex: 1, ml: '260px', mr: '300px', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Paper elevation={3} sx={{ width: '100%', maxWidth: 700, p: 4, borderRadius: 4, boxShadow: 3, bgcolor: '#fff' }}>
                        <Typography variant="h6">Task {currentTaskIndex + 1}: {task?.name}</Typography>
                        <Typography component="p" sx={{ my: 2 }}>{task?.question}</Typography>
                        {task?.Image?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                                {task.Image.map((img, idx) => (
                                    <Box key={idx} sx={{ width: 'calc(33.33% - 10px)', position: 'relative' }}>
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
                            task={task}
                            userSolution={userSolution}
                            onSolutionChange={(value) => setUserSolutions(prev => ({ ...prev, [task?.id]: value }))}
                            onSubmit={handleSolutionSubmit}
                            isEvaluating={!!evaluatingTaskId}
                        />
                        {shouldShowResults && (
                            <TaskResults 
                                taskResult={currentTaskResult}
                                criteriaData={criteriaQuery.data}
                                currentAttempts={currentAttempts}
                                onNextTask={() => setCurrentTaskIndex(prev => prev + 1)}
                            />
                        )}
                    </Paper>
                </Box>
                <RightSidebar />
            </Box>
            <TutorialVideo 
                open={showTutorial} 
                onClose={() => setShowTutorial(false)} 
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