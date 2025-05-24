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
// const API_BASE = 'http://localhost:1337/api/analyzer';
// const API_ROOT = 'http://localhost:1337'

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
    const [showEmailAlert, setShowEmailAlert] = useState(false);
    const [baselineCounts, setBaselineCounts] = useState<Record<string, number>>({})
    const previousTaskResultsRef = useRef<Record<string, any>>({});
    
    // New state for tracking attempts and hints
    const [taskAttempts, setTaskAttempts] = useState<Record<string, number>>({});
    const [taskScores, setTaskScores] = useState<Record<string, number[]>>({});
    const [showHint, setShowHint] = useState<Record<string, boolean>>({});
    const [showResults, setShowResults] = useState<Record<string, boolean>>({});

    const MAX_EVALUATION_ATTEMPTS = 15;

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data),
        onSuccess: (data) => {
            setUserId(data.id);
        },
    });

    const tasksQuery = useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => {
            console.log('--- Fetching tasks for user:', userId);
            return axios.get(`${API_BASE}/users/${userId}/tasks`)
                .then((res) => {
                    console.log('--- Tasks API Response:', res.data);
                    return res.data.data;
                })
                .catch((error) => {
                    console.error('--- Error fetching tasks:', error);
                    throw error;
                });
        },
        enabled: !!userId,
        onSuccess: (data) => {
            console.log('--- Tasks Query Success:', data);
        },
        onError: (error) => {
            console.error('--- Tasks Query Error:', error);
        }
    });

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
        queryFn: () => {
            console.log('--- Polling for results ---');
            return axios.get(`${API_BASE}/users/${userId}/results`).then((res) => {
                console.log('--- Results received:', res.data);
                return res.data;
            });
        },
        enabled: !!userId && (checkingResults || !!evaluatingTaskId),
        refetchInterval: () => evaluatingTaskId ? 2000 : false,
        refetchIntervalInBackground: true,
    });

    const sendResultsEmail = useMutation({
        mutationFn: () => axios.post(`${API_BASE}/users/${userId}/send-results`),
        onSuccess: () => {
            console.log("Results sent successfully via email");
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
            toast.error('Failed to send email. Please try again.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            });
        }
    });

    // Effect to manage evaluation progress and track scores
    useEffect(() => {
        if (!evaluatingTaskId || !resultsQuery.data) return;
      
        const newResult = resultsQuery.data.taskResults.find(
          (r: any) => r.taskId === evaluatingTaskId
        );
        const oldResult = previousTaskResultsRef.current[evaluatingTaskId];

        if (!newResult || (oldResult && JSON.stringify(newResult) === JSON.stringify(oldResult))) {
            console.log(
              `Waiting for an updated result for ${evaluatingTaskId}…`
            );
            return;
          }
        
          console.log(
            `Results received for task ${evaluatingTaskId}. Processing score.`
          );


        if (newResult) {
            console.log(`Results received for task ${evaluatingTaskId}. Processing score.`);
            
            // Calculate the score for this task
            const taskResult = resultsQuery.data.taskResults.find(
                (r: any) => r.taskId === evaluatingTaskId
            );
            
            if (taskResult) {
                const totalScore = taskResult.criterionResults.reduce(
                    (sum: number, criterion: any) => sum + criterion.score, 0
                );
                const maxPossibleScore = taskResult.criterionResults.length * 5;
                const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
                
                // Update attempts and scores
                setTaskAttempts(prev => ({
                    ...prev,
                    [evaluatingTaskId]: (prev[evaluatingTaskId] || 0) + 1
                }));
                
                setTaskScores(prev => ({
                    ...prev,
                    [evaluatingTaskId]: [...(prev[evaluatingTaskId] || []), percentageScore]
                }));
                
                // Show results
                setShowResults(prev => ({
                    ...prev,
                    [evaluatingTaskId]: true
                }));
                
                // Check if hint should be shown (2 attempts with <= 20%)
                const currentAttempts = (taskAttempts[evaluatingTaskId] || 0) + 1;
                const allScores = [...(taskScores[evaluatingTaskId] || []), percentageScore];
                const badAttempts = allScores.filter(score => score <= 20).length;
                
                console.log('--- Hint Debug Info ---');
                console.log('Current Task ID:', evaluatingTaskId);
                console.log('Current Attempts:', currentAttempts);
                console.log('All Scores:', allScores);
                console.log('Bad Attempts (<= 20%):', badAttempts);
                console.log('Should Show Hint:', badAttempts >= 2 && currentAttempts >= 2);
                
                if (badAttempts >= 2 && currentAttempts >= 2) {
                    console.log('Setting hint to show for task:', evaluatingTaskId);
                    setShowHint(prev => ({
                        ...prev,
                        [evaluatingTaskId]: true
                    }));
                }

                // Only stop polling after we've processed the results
                setEvaluatingTaskId(null);
                setEvaluationAttempt(0);
            }
        }
    }, [resultsQuery.data, evaluatingTaskId]);

    const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

    const handleSolutionSubmit = () => {
        if (!userId) return;
        const task = tasksQuery.data?.[currentTaskIndex];
        if (!task) return;
      
        const id = task.id;
      
        // 1) grab and stash the *previous* result for diffing later
        const previousResult = resultsQuery.data?.taskResults.find(r => r.taskId === id);
        previousTaskResultsRef.current[id] = previousResult;
      
        // 2) record how many criteria we already had
        const oldCount = previousResult?.criterionResults?.length || 0;
        setBaselineCounts(prev => ({ ...prev, [id]: oldCount }));
      
        // 3) clear any cached / stale results so React-Query will fetch fresh
        queryClient.removeQueries({ queryKey: ['results', userId] });
      
        // 4) reset your UI state
        setShowHint    (prev => ({ ...prev, [id]: false }));
        setShowResults (prev => ({ ...prev, [id]: false }));
      
        // 5) kick off polling
        setEvaluationAttempt(0);
        setEvaluatingTaskId(id);
      
        // 6) submit the new solution
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
      
    const handleShowHint = (taskId: string) => {
        setShowHint(prev => ({
            ...prev,
            [taskId]: true
        }));
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
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" onClick={() => setCheckingResults(true)}>
                        Check My Score
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => sendResultsEmail.mutate()}
                        disabled={sendResultsEmail.isLoading}
                    >
                        {sendResultsEmail.isLoading ? 'Sending...' : 'Send Results to Email'}
                    </Button>
                </Box>
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
    const currentTaskResult = resultsQuery.data?.taskResults?.find(
        (result: any) => result.taskId === task?.id
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

            {/* Show hint if conditions are met */}
            {canShowHint && (
                <Box sx={{ mb: 2 }}>
                    <Button 
                        variant="outlined" 
                        color="warning"
                        onClick={() => setShowHint(prev => ({
                            ...prev,
                            [task?.id]: !prev[task?.id]
                        }))}
                        sx={{ mb: 2 }}
                    >
                        {showHint[task?.id] ? 'Hide Hint' : 'Show Hint'}
                    </Button>
                    {showHint[task?.id] && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>💡 Hint:</Typography>
                            <Typography variant="body2">{task?.idealPrompt}</Typography>
                        </Alert>
                    )}
                </Box>
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
            

            {/* Submit/Retry button - always show when not evaluating */}
            {!evaluatingTaskId && (
                <Button 
                    sx={{ mt: 2 }}
                    variant="contained" 
                    onClick={handleSolutionSubmit} 
                    disabled={countNonWhitespaceCharacters(userSolution) < SOLUTION_MIN_NON_WHITESPACE_CHARACTERS}
                >
                    {currentAttempts > 0 ? 'Retry Solution' : 'Submit Solution'}
                </Button>
            )}
            
            {/* Display results for the current task if available and should be shown */}
            {shouldShowResults && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Results for this task (Attempt {currentAttempts}):
                    </Typography>
                    
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
                    
                    {/* Show next task button only if score is good enough or max attempts reached */}
                    {(() => {
                        const totalScore = currentTaskResult.criterionResults.reduce(
                            (sum: number, criterion: any) => sum + criterion.score, 0
                        );
                        const maxPossibleScore = currentTaskResult.criterionResults.length * 5;
                        const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
                        
                        if (percentageScore >= 70 || currentAttempts >= 5) {
                            return (
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    sx={{ mt: 2 }}
                                    onClick={() => setCurrentTaskIndex((prev) => prev + 1)}
                                >
                                    Next Task
                                </Button>
                            );
                        }
                        return null;
                    })()}
                </Box>
            )}

            {/* Show evaluation progress */}
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
            
        </Container>
    );
}

export default App;