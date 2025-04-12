// @ts-nocheck

import { useState } from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper, createTheme, ThemeProvider, CssBaseline,
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


const API_BASE = 'https://danielreker.duckdns.org/api/analyzer';

const theme = createTheme({
    colorSchemes: {
        dark: true,
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

    const createUser = useMutation({
        mutationFn: (data: { name: string; email: string }) =>
            axios.post(`${API_BASE}/users`, data).then((res) => res.data),
        onSuccess: (data) => {
            setUserId(data.id);
        },
    });

    const tasksQuery = useQuery({
        queryKey: ['tasks', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/tasks`).then((res) => res.data.data),
        enabled: !!userId,
    });

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
            setCurrentTaskIndex((prev) => prev + 1);
        },
    });

    const resultsQuery = useQuery({
        queryKey: ['results', userId],
        queryFn: () => axios.get(`${API_BASE}/users/${userId}/results`).then((res) => res.data),
        enabled: checkingResults,
        refetchInterval: () => 2000,
    });

    const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

    const handleSolutionSubmit = () => {
        const task = tasksQuery.data?.[currentTaskIndex];
        if (task) {
            submitSolution.mutate({
                taskId: task.id,
                solutionPrompt: userSolutions[task.id] || '',
            });
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
                <Button variant="contained" onClick={() => createUser.mutate({ email, name })}>
                    Start
                </Button>
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

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h6">Task {currentTaskIndex + 1}: {task?.name}</Typography>
            <Typography component="p" sx={{ my: 2 }}>{task?.question}</Typography>
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
            <Button sx={{ mt: 2 }} variant="contained" onClick={handleSolutionSubmit} disabled={countNonWhitespaceCharacters(userSolution) < SOLUTION_MIN_NON_WHITESPACE_CHARACTERS}>
                Submit Solution
            </Button>
        </Container>
    );
}

export default App;
