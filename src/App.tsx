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
    Pagination,
} from '@mui/material';
import {QueryClient, QueryClientProvider, useMutation, useQuery} from '@tanstack/react-query';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';

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
// const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';
// const API_ROOT = 'https://prompt-pal-api.onrender.com';
const API_BASE = 'http://localhost:1337/api/analyzer';
const API_ROOT = 'http://localhost:1337';
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
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={4} sx={{ p: 5, borderRadius: 4, minWidth: 350, maxWidth: 400, width: '100%', boxShadow: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: 'center' }}>
                    <MenuIcon sx={{ color: '#ff6600', fontSize: 32 }} />
                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff6600', letterSpacing: 1 }}>Prompt Pal</Typography>
                </Box>
                <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2, fontWeight: 700 }}>
                    Welcome! Enter your info to begin:
                </Typography>
                <TextField 
                    label="Email" 
                    fullWidth 
                    margin="normal" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    sx={{ mb: 2 }}
                />
                <TextField 
                    label="Name" 
                    fullWidth 
                    margin="normal" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => onSubmit({ email, name })}
                        sx={{ flex: 1, fontWeight: 700, borderRadius: 2, py: 1 }}
                    >
                        Start
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={onSkip}
                        sx={{ flex: 1, fontWeight: 700, borderRadius: 2, py: 1 }}
                    >
                        Skip Login
                    </Button>
                </Box>
            </Paper>
        </Box>
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
                variant={showHint ? 'contained' : 'outlined'}
                color="warning"
                startIcon={<LightbulbIcon />}
                onClick={onToggleHint}
                sx={{
                    mb: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    boxShadow: showHint ? 2 : 0,
                    bgcolor: showHint ? '#fff3e0' : undefined,
                    color: showHint ? '#ff9800' : undefined,
                    '&:hover': {
                        bgcolor: '#ffe0b2',
                        color: '#e65100',
                    },
                    px: 3,
                    py: 1.2,
                    fontSize: 16
                }}
            >
                {showHint ? 'Hide Hint' : 'Show Hint'}
            </Button>
            {showHint && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2, boxShadow: 1, bgcolor: '#e3f2fd' }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LightbulbIcon sx={{ color: '#ffb300' }} /> Hint:
                    </Typography>
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
    isSendingEmail, 
    onRestartQuiz 
}: { 
    tasksMap: any;
    criteriaData: any;
    resultsData: UserResult;
    onSendEmail: () => void;
    isSendingEmail: boolean;
    onRestartQuiz: () => void;
}) {
    const finalScore = resultsData?.score ?? 0;
    const scoreColor = finalScore >= 4 ? '#43a047' : finalScore >= 2.5 ? '#ffa000' : '#e53935';
    const [currentTaskPage, setCurrentTaskPage] = useState(1);
    const tasks = resultsData.taskResults || [];
    const currentTask = tasks[currentTaskPage - 1];
    const handlePageChange = (_: any, value: number) => setCurrentTaskPage(value);
    return (
        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, bgcolor: '#f5faff', boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <CelebrationIcon sx={{ color: '#ff9800', fontSize: 36 }} />
                <Typography variant="h5" fontWeight="bold">All tasks submitted!</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 3 }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<EmailIcon />}
                    onClick={onSendEmail}
                    disabled={isSendingEmail}
                    sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
                >
                    {isSendingEmail ? 'Sending...' : 'Send Results to Email'}
                </Button>
                <Button 
                    variant="outlined"
                    color="secondary"
                    onClick={onRestartQuiz}
                    sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
                >
                    Restart Quiz
                </Button>
            </Box>
            {criteriaData && resultsData && resultsData.score !== null && (
                <Box mt={4}>
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: scoreColor, mb: 1, letterSpacing: 1 }}>
                            {finalScore.toFixed(2)}<span style={{ fontSize: 24, color: '#888' }}>/5</span>
                        </Typography>
                        <Box sx={{ width: '60%', mx: 'auto', mb: 1 }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={finalScore / 5 * 100} 
                                sx={{
                                    height: 12,
                                    borderRadius: 6,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: scoreColor,
                                        borderRadius: 6
                                    }
                                }}
                            />
                        </Box>
                        <Typography variant="subtitle1" color="text.secondary">Average Score</Typography>
                    </Box>
                    {currentTask && (
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2, bgcolor: '#fff' }}>
                            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEventsIcon sx={{ color: '#1976d2' }} />
                                Task: {tasksMap ? tasksMap[currentTask.taskId].name : currentTask.taskId}
                            </Typography>
                            {currentTask.criterionResults.map((criterion) => (
                                <Box key={criterion.criterionId} mt={1} sx={{ pl: 2 }}>
                                    <Typography fontWeight="bold" sx={{ color: '#1976d2' }}>
                                        {!criteriaData ? criterion.criterionId : criteriaData[criterion.criterionId].name}
                                        <span style={{ marginLeft: 8, color: '#888', fontWeight: 400 }}>Score: {criterion.score}</span>
                                    </Typography>
                                    {criterion.subquestionResults.map((sub) => (
                                        <Typography key={sub.subquestionId} sx={{ pl: 2, color: '#555' }}>
                                            - {sub.feedback} <span style={{ color: '#888' }}>(Score: {sub.score})</span>
                                        </Typography>
                                    ))}
                                </Box>
                            ))}
                        </Paper>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination 
                            count={tasks.length} 
                            page={currentTaskPage} 
                            onChange={handlePageChange} 
                            color="primary"
                            shape="rounded"
                            showFirstButton
                            showLastButton
                        />
                    </Box>
                </Box>
            )}
        </Paper>
    );
}

function LeftSidebar({ onDailyChallenge, name, onLogout }: { onDailyChallenge: () => void, name: string, onLogout: () => void }) {
    return (
        <Box sx={{
            width: 260,
            bgcolor: 'background.paper',
            height: '100vh',
            borderRight: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1000,
            p: 0,
            boxShadow: 2
        }}>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 3, pb: 2 }}>
                    <MenuIcon sx={{ color: '#ff6600', fontSize: 32 }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#ff6600', letterSpacing: 1 }}>Prompt Pal</Typography>
                </Box>
                <Box sx={{ mb: 2, px: 2 }}>
                    <Button startIcon={<EmojiEventsIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={onDailyChallenge}>Daily Challenge</Button>
                    <Button startIcon={<ListAltIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>All Challenges</Button>
                    <Button startIcon={<BoltIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Prompt Improver <Box component="span" sx={{ bgcolor: '#ff5252', color: '#fff', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>NEW</Box></Button>
                    <Button startIcon={<GroupsIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Community <Box component="span" sx={{ bgcolor: '#eee', color: '#888', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>Coming Soon</Box></Button>
                    <Button startIcon={<SchoolIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Learn <Box component="span" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>Explore</Box></Button>
                </Box>
                <Paper elevation={2} sx={{ bgcolor: '#f5faff', borderRadius: 3, p: 2, mb: 2, mx: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>STATS</Typography>
                    <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 2, p: 1, mt: 1, mb: 1, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
                        <span role="img" aria-label="cloud">☁️</span> No Streak Yet!
                    </Box>
                    <Box sx={{ bgcolor: '#fff8e1', color: '#ffb300', borderRadius: 2, p: 1, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
                        <span role="img" aria-label="trophy">🏆</span> 0 Challenges Completed!
                    </Box>
                </Paper>
                <Paper elevation={2} sx={{ bgcolor: '#fffbe7', borderRadius: 3, p: 2, mb: 2, mx: 2, textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight="bold" color="#ff9800">Become a Super Learner</Typography>
                    <Button variant="contained" color="warning" fullWidth sx={{ mt: 1, borderRadius: 2, fontWeight: 700 }}>Try for 7 Days Free</Button>
                </Paper>
            </Box>
            <Box sx={{ textAlign: 'center', py: 3, borderTop: '1px solid #eee', bgcolor: '#fafbfc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#888', fontSize: 22 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{name}</Typography>
                    <Button onClick={onLogout} sx={{ minWidth: 0, p: 0, ml: 1 }}><LogoutIcon sx={{ color: '#888' }} /></Button>
                </Box>
            </Box>
        </Box>
    );
}

function RightSidebar() {
    return (
        <Box sx={{
            width: 300,
            bgcolor: 'background.paper',
            height: '100vh',
            borderLeft: '1px solid #eee',
            position: 'fixed',
            right: 0,
            top: 0,
            zIndex: 1000,
            p: 0,
            boxShadow: 2
        }}>
            <Box sx={{ p: 3 }}>
                <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#f5faff' }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>How It Works</Typography>
                    <Typography variant="body2" color="text.secondary">1. Complete daily challenges.<br/>2. Improve your prompts.<br/>3. Earn gems and track your progress!</Typography>
                </Paper>
                <Paper elevation={2} sx={{ p: 2, borderRadius: 3, bgcolor: '#fffbe7' }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Gems Remaining</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
                        <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
                        <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
                        <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
                        <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔮</Box>
                    </Box>
                    <Button variant="text" color="warning" sx={{ p: 0, minWidth: 0, fontWeight: 700 }}>Get Unlimited Gems</Button>
                </Paper>
            </Box>
        </Box>
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
            axios.post(`${API_BASE}/users`, data).then((res) => res.data.id),
        onSuccess: (data) => {
            setUserId(data.documentId);
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

            setEvaluatingTaskId(null);
        }
    }, [resultsQuery.data, evaluatingTaskId]);

    useEffect(() => {
        if (userId && !name) {
            axios.get(`${API_BASE}/users/${userId}`)
                .then(res => {
                    setName(res.data.name);
                    setEmail(res.data.email);
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
        setEmail('');
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
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fa' }}>
            <LeftSidebar onDailyChallenge={handleRestartQuiz} name={name} onLogout={handleLogout} />
            <Box sx={{ flex: 1, ml: '260px', mr: '300px', p: 4, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <Paper elevation={3} sx={{ width: '100%', maxWidth: 700, p: 4, borderRadius: 4, boxShadow: 3, bgcolor: '#fff' }}>
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
                </Paper>
            </Box>
            <RightSidebar />
        </Box>
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