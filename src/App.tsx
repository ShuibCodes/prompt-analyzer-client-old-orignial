// @ts-nocheck

import { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Button,
    Container,
    TextField,
    Typography,
    Paper, createTheme, ThemeProvider, CssBaseline, LinearProgress,
} from '@mui/material';
import {QueryClient, QueryClientProvider, useMutation, useQuery} from '@tanstack/react-query';
import axios from 'axios';

function countNonWhitespaceCharacters(str: string) {
    const strWithoutWhitespace = str.replace(/\s/g, "");
    return strWithoutWhitespace.length;
}

const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};

const API_BASE = 'https://prompt-analyzer-api-main-8rpo.onrender.com/api/analyzer';
const API_ROOT = 'https://prompt-analyzer-api-main-8rpo.onrender.com';



const theme = createTheme({
    colorSchemes: {
        dark: false,
    },
    shape: {
        borderRadius: 12
    },
});


const queryClient = new QueryClient()

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline enableColorScheme/>
            <QueryClientProvider client={queryClient}>
                <Application />
            </QueryClientProvider>
        </ThemeProvider>
    )
}

function Application() {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [userSolutions, setUserSolutions] = useState<Record<string, string>>({});
    const [checkingResults, setCheckingResults] = useState(false);
    const [evaluatingTaskId, setEvaluatingTaskId] = useState<string | null>(null);
    const [evaluationAttempt, setEvaluationAttempt] = useState<number>(0);

    const MAX_EVALUATION_ATTEMPTS = 15; // e.g., 15 attempts * 2s interval = 30s timeout for progress bar

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data),
        onSuccess: (data) => {
            setUserId(data.id);
            console.log('API connected successfully, user created:', data);
        },
    });

    const tasksQuery = useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/tasks`).then((res) => res.data.data),
        enabled: !!userId,
    });

    // Effect to log all raw task data when loaded
    useEffect(() => {
        if (tasksQuery.data && tasksQuery.data.length > 0) {
            console.log('--- Raw API data for all tasks loaded (tasksQuery.data) ---');
            console.log(JSON.stringify(tasksQuery.data, null, 2));
        }
    }, [tasksQuery.data]);

    let tasksMap = null;
    if (tasksQuery?.data) {
        tasksMap = convertArrayToObject(tasksQuery.data, 'id');
    }

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
        refetchInterval: () => 2000,
    });

    // Effect to manage evaluation progress
    useEffect(() => {
        if (!evaluatingTaskId) return;

        // Check if results for the evaluatingTaskId are now available
        const resultsAreIn = resultsQuery.data?.taskResults?.some(
            (r: any) => r.taskId === evaluatingTaskId && r.criterionResults?.length > 0
        );

        if (resultsAreIn) {
            console.log(`Results received for task ${evaluatingTaskId}. Hiding progress.`);
            setEvaluatingTaskId(null);
            setEvaluationAttempt(0); // Reset for safety, though not strictly needed if null check is primary
        } else {
            // Results are not in, increment attempt if poll just happened (resultsQuery.data changed)
            // and we haven't exceeded max attempts.
            setEvaluationAttempt(currentAttempts => {
                if (currentAttempts < MAX_EVALUATION_ATTEMPTS) {
                    console.log(`Polling for ${evaluatingTaskId}, attempt ${currentAttempts + 1}`);
                    return currentAttempts + 1;
                }
                // Max attempts reached, stop showing progress for this task
                console.log(`Max evaluation attempts reached for task ${evaluatingTaskId}. Hiding progress.`);
                setEvaluatingTaskId(null);
                return currentAttempts; // or 0 to reset
            });
        }
    }, [resultsQuery.data, evaluatingTaskId]); // Re-run when results data changes or the task being evaluated changes

    const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

    const handleSolutionSubmit = () => {
        // --- Logging for current task being submitted (remains) ---
        if (tasksQuery.isLoading) {
            console.log('--- Data Source: tasksQuery is currently loading for submission check...');
        } else if (tasksQuery.error) {
            const errorMessage = tasksQuery.error instanceof Error ? tasksQuery.error.message : String(tasksQuery.error);
            console.log('--- Data Source: tasksQuery encountered an error during submission check:', errorMessage);
        } else if (!tasksQuery.data) {
            console.log('--- Data Source: tasksQuery.data is not available during submission check ---');
        }
        // Removed the general tasksQuery.data log from here as it now logs on load

        const taskForSubmission = tasksQuery.data?.[currentTaskIndex];
        console.log('--- Selected Task for Submission (from tasksQuery.data[currentTaskIndex]) ---');
        // Check if taskForSubmission exists before stringifying
        if (taskForSubmission !== undefined) {
            console.log(JSON.stringify(taskForSubmission, null, 2));
            setEvaluatingTaskId(taskForSubmission.id);
            setEvaluationAttempt(0); // Reset attempts for the new evaluation
        } else {
            console.log('Task data for current index is undefined.');
        }

        if (taskForSubmission) {
            submitSolution.mutate({
                taskId: taskForSubmission.id,
                solutionPrompt: userSolutions[taskForSubmission.id] || '',
            });
        } else {
            console.error('SUBMISSION ABORTED: Current task object is undefined (tasksQuery.data possibly not loaded or index out of bounds).');
        }
    };

    if (!userId) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Welcome! Enter your info to begin:
                </Typography>
                <TextField label="Email" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField label="Name" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={() => createUser.mutate({ email, name })}>
                        Start
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => createUser.mutate({ email: 'test@example.com', name: 'Test User' })}
                    >
                        Skip Login
                    </Button>
                </Box>
            </Container>
        );
    }

    if (currentTaskIndex >= tasksQuery.data?.length) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h6">All tasks submitted!</Typography>
                <Button variant="contained" onClick={() => setCheckingResults(true)}>
                    Check My Score
                </Button>
                {criteriaQuery.data && resultsQuery.data && resultsQuery.data.score !== null && (
                    <Box mt={4}>
                        <Typography variant="h5">Final Score: {resultsQuery.data.score.toFixed(2)}</Typography>
                        {resultsQuery.data.taskResults.map((task) => (
                            <Paper key={task.taskId} sx={{ p: 2, mt: 2 }}>
                                <Typography variant="h6">Task: {tasksMap ? tasksMap[task.taskId].name : task.taskId}</Typography>
                                {task.criterionResults.map((criterion) => (
                                    <Box key={criterion.criterionId} mt={1}>
                                        <Typography><strong>{!criteriaQuery.data ? criterion.criterionId : criteriaQuery.data[criterion.criterionId].name}</strong>: {criterion.score}</Typography>
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

    const task = tasksQuery.data?.[currentTaskIndex];

    const userSolution = userSolutions[task?.id] || '';

    // Find the result for the current task
    const currentTaskResult = resultsQuery.data?.taskResults?.find(
        (result: any) => result.taskId === task?.id
    );

    const hasResults = !!currentTaskResult && currentTaskResult.criterionResults?.length > 0;

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h6">Task {currentTaskIndex + 1}: {task?.name}</Typography>
            <Typography component="p" sx={{ my: 2 }}>{task?.question}</Typography>
            <Typography component="p" sx={{ my: 2 }}>{task?.idealPrompt}</Typography>
            {task?.Image?.length > 0 && (
                <Grid container spacing={2} sx={{ my: 2 }}>
                    {task.Image.map((img, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Box>
                        <img
                            src={`${API_ROOT}${img.imageQuestion.formats.thumbnail.url}`}
                            alt={`Question Image ${idx + 1}`}
                            style={{ width: '100%', borderRadius: 8 }}
                        />
                        </Box>
                    </Grid>
                    ))}
                </Grid>
            )}
            <TextField
                label="Your Prompt"
                multiline
                fullWidth
                minRows={3}
                value={userSolution}
                placeholder={`Write at least ${SOLUTION_MIN_NON_WHITESPACE_CHARACTERS} letters or digits`}
                onChange={(e) =>
                    setUserSolutions({ ...userSolutions, [task?.id]: e.target.value })
                }
            />
            {evaluatingTaskId && (
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
            
            {/* Display results for the current task if available */}
            {hasResults && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Results for this task:</Typography>
                    
                    {/* Calculate and display the percentage score */}
                    {(() => {
                        const totalScore = currentTaskResult.criterionResults.reduce(
                            (sum: number, criterion: any) => sum + criterion.score, 0
                        );
                        const maxPossibleScore = currentTaskResult.criterionResults.length * 5;
                        const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
                        
                        return (
                            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="h4" fontWeight="bold" color={percentageScore >= 70 ? 'success.main' : percentageScore >= 50 ? 'warning.main' : 'error.main'}>
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
                        );
                    })()}
                    
                    {currentTaskResult.criterionResults.map((criterion: any) => (
                        <Box key={criterion.criterionId} sx={{ mb: 2 }}>
                            <Typography fontWeight="bold">
                                {criteriaQuery.data?.[criterion.criterionId]?.name || criterion.criterionId}: {criterion.score}
                            </Typography>
                            {criterion.subquestionResults?.map((sub: any) => (
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
                        onClick={() => setCurrentTaskIndex((prev) => prev + 1)}
                    >
                        Next Task
                    </Button>
                </Box>
            )}
            
            {/* Show submit button only if results aren't available yet */}
            {!hasResults && (
                <Button 
                    sx={{ mt: evaluatingTaskId ? 1 : 2 }}
                    variant="contained" 
                    onClick={handleSolutionSubmit} 
                    disabled={countNonWhitespaceCharacters(userSolution) < SOLUTION_MIN_NON_WHITESPACE_CHARACTERS || !!evaluatingTaskId}
                >
                    Submit Solution
                </Button>
            )}
        </Container>
    );
}

export default App;
