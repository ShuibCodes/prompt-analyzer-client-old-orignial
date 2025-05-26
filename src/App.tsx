// @ts-nocheck

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Grid,
    Button,
    Container,
    TextField,
    Typography,
    Paper, 
    createTheme, 
    ThemeProvider, 
    CssBaseline, 
    LinearProgress,
    Alert,
    Collapse,
} from '@mui/material';
import {QueryClient, QueryClientProvider, useMutation, useQuery} from '@tanstack/react-query';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

interface UserResult {
    score: number | null;
    taskResults: TaskResult[];
}

// Constants
const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';
const API_ROOT = 'https://prompt-pal-api.onrender.com';
const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

// Theme
const theme = createTheme({
    colorSchemes: { dark: false },
    shape: { borderRadius: 12 }
});

const queryClient = new QueryClient();

// Utility functions
function countNonWhitespaceCharacters(str: string) {
    return str.replace(/\s/g, "").length;
}

const convertArrayToObject = (array: any[], key: string) => {
    return array.reduce((obj, item) => ({
        ...obj,
        [item[key]]: item,
    }), {});
};

// Components
function LoginForm({ onSubmit, onSkip }: { onSubmit: (data: { email: string; name: string }) => void; onSkip: () => void }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Welcome! Enter your info to begin:
            </Typography>
            <TextField 
                label="Email" 
                fullWidth 
                margin="normal" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
            <TextField 
                label="Name" 
                fullWidth 
                margin="normal" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={() => onSubmit({ email, name })}
                >
                    Start
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={onSkip}
                >
                    Skip Login
                </Button>
            </Box>
        </Container>
    );
}

function TaskImage({ image }: { image: any }) {
    return (
        <Box>
            <img
                src={`${API_ROOT}${image.imageQuestion.formats.thumbnail.url}`}
                alt="Question Image"
                style={{ width: '100%', borderRadius: 8 }}
            />
        </Box>
    );
}

function TaskHint({ task, showHint, onToggleHint }: { 
    task: any; 
    showHint: boolean; 
    onToggleHint: () => void;
}) {
    if (!task?.idealPrompt) return null;

    return (
        <Box sx={{ mb: 2 }}>
            <Button 
                variant="outlined" 
                color="warning"
                onClick={onToggleHint}
                sx={{ mb: 2 }}
            >
                {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            {showHint && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>💡 Hint:</Typography>
                    <Typography variant="body2">{task.idealPrompt}</Typography>
                </Alert>
            )}
        </Box>
    );
}

function TaskResults({ 
    taskResult, 
    criteriaData, 
    currentAttempts,
    onNextTask 
}: { 
    taskResult: TaskResult; 
    criteriaData: any;
    currentAttempts: number;
    onNextTask: () => void;
}) {
    const totalScore = taskResult.criterionResults.reduce(
        (sum, criterion) => sum + criterion.score, 0
    );
    const maxPossibleScore = taskResult.criterionResults.length * 5;
    const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

    return (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
                Results for this task (Attempt {currentAttempts}):
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color={percentageScore >= 70 ? 'success.main' : percentageScore >= 50 ? 'warning.main' : 'error.main'}
                >
                    {percentageScore}%
                </Typography>
                <LinearProgress 
                    variant="determinate" 
                    value={percentageScore} 
                    sx={{ 
                        width: '100%', 
                        height: 10, 
                        mt: 1,
                        borderRadius: 1,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: percentageScore >= 70 ? '#4caf50' : percentageScore >= 50 ? '#ff9800' : '#f44336',
                            borderRadius: 1
                        }
                    }} 
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                    Total Score: {totalScore} / {maxPossibleScore} points
                </Typography>
            </Box>
            
            {taskResult.criterionResults.map((criterion) => (
                <Box key={criterion.criterionId} sx={{ mb: 2 }}>
                    <Typography fontWeight="bold">
                        {criteriaData?.[criterion.criterionId]?.name || criterion.criterionId}: {criterion.score}
                    </Typography>
                    {criterion.subquestionResults?.map((sub) => (
                        <Typography key={sub.subquestionId} sx={{ pl: 2 }}>
                            - {sub.feedback} (Score: {sub.score})
                        </Typography>
                    ))}
                </Box>
            ))}
            
            <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                onClick={onNextTask}
            >
                Next Task
            </Button>
        </Box>
    );
}

function TaskSubmission({ 
    task, 
    userSolution, 
    onSolutionChange, 
    onSubmit, 
    isEvaluating 
}: { 
    task: any;
    userSolution: string;
    onSolutionChange: (value: string) => void;
    onSubmit: () => void;
    isEvaluating: boolean;
}) {
    return (
        <>
            <TextField
                label="Your Prompt"
                multiline
                fullWidth
                minRows={3}
                value={userSolution}
                placeholder={`Write at least ${SOLUTION_MIN_NON_WHITESPACE_CHARACTERS} letters or digits`}
                onChange={(e) => onSolutionChange(e.target.value)}
            />
            
            {!isEvaluating && (
                <Button 
                    sx={{ mt: 2 }}
                    variant="contained" 
                    onClick={onSubmit} 
                    disabled={countNonWhitespaceCharacters(userSolution) < SOLUTION_MIN_NON_WHITESPACE_CHARACTERS}
                >
                    Submit Solution
                </Button>
            )}
            
            {isEvaluating && (
                <Box sx={{ mt: 2, width: '100%' }}>
                    <LinearProgress 
                        variant="indeterminate" 
                        sx={{ 
                            height: 6,
                            '& .MuiLinearProgress-bar': {
                                animation: 'indeterminate-bar 1.5s infinite ease-in-out',
                            },
                            '@keyframes indeterminate-bar': {
                                '0%': { left: '-30%', width: '30%' },
                                '50%': { left: '30%', width: '40%' },
                                '100%': { left: '100%', width: '30%' },
                            }
                        }} 
                    />
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
                        Evaluating your submission...
                    </Typography>
                </Box>
            )}
        </>
    );
}

function FinalResults({ 
    tasksMap, 
    criteriaData, 
    resultsData, 
    onSendEmail, 
    isSendingEmail 
}: { 
    tasksMap: any;
    criteriaData: any;
    resultsData: UserResult;
    onSendEmail: () => void;
    isSendingEmail: boolean;
}) {
    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h6">All tasks submitted!</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onSendEmail}
                    disabled={isSendingEmail}
                >
                    {isSendingEmail ? 'Sending...' : 'Send Results to Email'}
                </Button>
            </Box>
            {criteriaData && resultsData && resultsData.score !== null && (
                <Box mt={4}>
                    <Typography variant="h5">Final Score: {resultsData.score.toFixed(2)}</Typography>
                    {resultsData.taskResults.map((task) => (
                        <Paper key={task.taskId} sx={{ p: 2, mt: 2 }}>
                            <Typography variant="h6">
                                Task: {tasksMap ? tasksMap[task.taskId].name : task.taskId}
                            </Typography>
                            {task.criterionResults.map((criterion) => (
                                <Box key={criterion.criterionId} mt={1}>
                                    <Typography>
                                        <strong>
                                            {!criteriaData ? criterion.criterionId : criteriaData[criterion.criterionId].name}
                                        </strong>: {criterion.score}
                                    </Typography>
                                    {criterion.subquestionResults.map((sub) => (
                                        <Typography key={sub.subquestionId} sx={{ pl: 2 }}>
                                            - {sub.feedback} (Score: {sub.score})
                                        </Typography>
                                    ))}
                                </Box>
                            ))}
                        </Paper>
                    ))}
                </Box>
            )}
        </Container>
    );
}

function Application() {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [userSolutions, setUserSolutions] = useState<Record<string, string>>({});
    const [checkingResults, setCheckingResults] = useState(false);
    const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
    const [taskAttempts, setTaskAttempts] = useState<Record<string, number>>({});
    const [taskScores, setTaskScores] = useState<Record<string, number[]>>({});
    const [showHint, setShowHint] = useState<Record<string, boolean>>({});
    const [showResults, setShowResults] = useState<Record<string, boolean>>({});
    const previousTaskResultsRef = useRef<Record<string, TaskResult>>({});

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data),
        onSuccess: (data) => {
            setUserId(data.id);
            setName(data.name);
            setEmail(data.email);
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
        enabled: !!userId && (checkingResults || !!evaluatingTaskId),
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
            
            const currentAttempts = (taskAttempts[evaluatingTaskId] || 0) + 1;
            const allScores = [...(taskScores[evaluatingTaskId] || []), percentageScore];
            const badAttempts = allScores.filter(score => score <= 20).length;
            
            if (badAttempts >= 2 && currentAttempts >= 2) {
                setShowHint(prev => ({
                    ...prev,
                    [evaluatingTaskId]: true
                }));
            }

            setEvaluatingTaskId(null);
        }
    }, [resultsQuery.data, evaluatingTaskId]);

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
            <FinalResults 
                tasksMap={tasksQuery.data ? convertArrayToObject(tasksQuery.data, 'id') : null}
                criteriaData={criteriaQuery.data}
                resultsData={resultsQuery.data}
                onSendEmail={() => sendResultsEmail.mutate()}
                isSendingEmail={sendResultsEmail.isLoading}
            />
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
        <Container sx={{ mt: 4 }}>
            <Typography variant="h6">Task {currentTaskIndex + 1}: {task?.name}</Typography>
            <Typography component="p" sx={{ my: 2 }}>{task?.question}</Typography>
            
            {task?.Image?.length > 0 && (
                <Grid container spacing={2} sx={{ my: 2 }}>
                    {task.Image.map((img, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                            <TaskImage image={img} />
                        </Grid>
                    ))}
                </Grid>
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
        </Container>
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