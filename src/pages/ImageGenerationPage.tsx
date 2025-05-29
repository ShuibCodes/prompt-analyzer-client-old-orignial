import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Paper, 
    Button, 
    TextField, 
    Grid, 
    Card, 
    CardContent,
    CardActions,
    Chip,
    LinearProgress
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CompareIcon from '@mui/icons-material/Compare';
import LeftSidebar from '../components/LeftSidebar';
import axios from 'axios';

const API_BASE = 'https://prompt-pal-api.onrender.com/api/analyzer';
// const API_BASE = 'http://localhost:1337/api/analyzer';

interface ImageGenerationPageProps {
    userId: string;
    name: string;
    onLogout: () => void;
}

interface ImageTask {
    id: string;
    name: string;
    question: string;
    idealPrompt: string;
    Image: Array<{
        id?: number;
        imageQuestion?: {
            url?: string; 
            formats?: { 
                medium?: { url: string }; 
                small?: { url: string };
                thumbnail?: { url: string };
            }
        };
        url?: string; 
        formats?: { 
            medium?: { url: string }; 
            small?: { url: string };
            thumbnail?: { url: string };
        } 
    }>;
}

interface EvaluationResult {
    analysis?: string;
    score?: number;
    feedback?: string;
    criterionResults?: Array<{
        criterionId: string;
        score: number;
        subquestionResults: Array<{
            subquestionId: string;
            score: number;
            feedback: string;
        }>;
    }>;
    totalScore?: number;
    maxPossibleScore?: number;
}

interface TaskResult {
    taskId: string;
    criterionResults: Array<{
        score: number;
        subquestionResults: Array<{
            feedback: string;
        }>;
    }>;
}

interface CriteriaData {
    [key: string]: {
        id: string;
        name: string;
        subquestions: Array<{
            id: string;
            question: string;
        }>;
    };
}

export default function ImageGenerationPage({ name, onLogout }: ImageGenerationPageProps) {
    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState<ImageTask | null>(null);
    const [userPrompt, setUserPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [imageTasks, setImageTasks] = useState<ImageTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [criteriaData, setCriteriaData] = useState<CriteriaData | null>(null);

    // Get userId from localStorage (similar to other pages)
    const getStoredUserId = () => {
        try {
            const stored = localStorage.getItem('promptPalAuth');
            if (!stored) return null;
            const authData = JSON.parse(stored);
            return authData.userId;
        } catch (error) {
            console.error('Error reading userId:', error);
            return null;
        }
    };

    const userId = getStoredUserId();

    useEffect(() => {
        const fetchImageTasks = async () => {
            if (!userId) return;
            
            try {
                console.log('Fetching image tasks for userId:', userId);
                setLoading(true);
                const response = await axios.get(`${API_BASE}/users/${userId}/image-tasks`);
                console.log('Image tasks response:', response.data);
                setImageTasks(response.data.data || []);
            } catch (error) {
                console.error('Error fetching image tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchCriteria = async () => {
            try {
                const response = await axios.get(`${API_BASE}/criteria`);
                const criteriaArray = response.data.data || [];
                // Convert array to object with id as key
                const criteriaObj = criteriaArray.reduce((acc: any, criterion: any) => {
                    acc[criterion.id] = criterion;
                    return acc;
                }, {});
                setCriteriaData(criteriaObj);
            } catch (error) {
                console.error('Error fetching criteria:', error);
            }
        };

        fetchImageTasks();
        fetchCriteria();
    }, [userId]);

    const handleDailyChallenge = () => {
        // Navigate to dashboard for regular text prompt tasks
        navigate('/dashboard');
    };

    const handleTaskSelect = (task: ImageTask) => {
        setSelectedTask(task);
        setUserPrompt('');
        setShowComparison(false);
        setGeneratedImageUrl(null);
        setEvaluationResult(null);
        setIsEvaluating(false);
    };

    const handleGenerateImage = async () => {
        if (!userPrompt.trim()) return;
        
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        setEvaluationResult(null);
        
        try {
            console.log('Generating image with prompt:', userPrompt);
            const response = await axios.post(`${API_BASE}/generate-image`, {
                prompt: userPrompt
            });
            
            if (response.data.success) {
                setGeneratedImageUrl(response.data.imageUrl);
                setShowComparison(true);
                console.log('Generated image URL:', response.data.imageUrl);
                
                // Submit the prompt for evaluation using the same pattern as TaskSubmission
                if (userId && selectedTask) {
                    submitPromptForEvaluation();
                }
            } else {
                console.error('Image generation failed:', response.data.error);
                alert('Failed to generate image: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Error generating image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const submitPromptForEvaluation = async () => {
        if (!userId || !selectedTask) {
            console.log('Missing userId or selectedTask:', { userId, selectedTask });
            return;
        }
        
        try {
            setIsEvaluating(true);
            console.log('Submitting prompt for evaluation:', { taskId: selectedTask.id, userPrompt });
            
            // Submit using the same endpoint as TaskSubmission
            await axios.post(`${API_BASE}/users/${userId}/submissions`, {
                taskId: selectedTask.id,
                solutionPrompt: userPrompt
            });
            
            console.log('Submission successful, now polling for results...');
            
            // Start polling for results (simplified approach)
            pollForResults();
            
        } catch (error) {
            console.error('Error submitting prompt:', error);
            setIsEvaluating(false);
        }
    };

    const pollForResults = async () => {
        let attempts = 0;
        const maxAttempts = 15; // Poll for 30 seconds max
        
        const poll = async () => {
            try {
                const resultsResponse = await axios.get(`${API_BASE}/users/${userId}/results`);
                const taskResults = resultsResponse.data.taskResults || [];
                
                // Find result for current task
                const taskResult = taskResults.find((result: TaskResult) => result.taskId === selectedTask?.id);
                
                if (taskResult && taskResult.criterionResults?.length > 0) {
                    console.log('Evaluation results received:', taskResult);
                    
                    // Calculate score similar to DashboardPage
                    const totalScore = taskResult.criterionResults.reduce(
                        (sum: number, criterion: { score: number }) => sum + criterion.score, 0
                    );
                    const maxPossibleScore = taskResult.criterionResults.length * 5;
                    const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);
                    
                    setEvaluationResult({
                        score: percentageScore,
                        totalScore,
                        maxPossibleScore,
                        criterionResults: taskResult.criterionResults,
                        analysis: `Your prompt scored ${percentageScore}% (${totalScore}/${maxPossibleScore} points) based on ${taskResult.criterionResults.length} criteria`,
                        feedback: taskResult.criterionResults.map((cr: { subquestionResults: Array<{ feedback: string }> }) => 
                            cr.subquestionResults?.map((sr: { feedback: string }) => sr.feedback).join(' ')
                        ).join(' ')
                    });
                    
                    setIsEvaluating(false);
                    return;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 2000); // Poll every 2 seconds
                } else {
                    console.log('Polling timeout - no results received');
                    setIsEvaluating(false);
                }
            } catch (error) {
                console.error('Error polling results:', error);
                setIsEvaluating(false);
            }
        };
        
        poll();
    };

    const getImageUrl = (imageArray: Array<{ 
        id?: number;
        imageQuestion?: {
            url?: string; 
            formats?: { 
                medium?: { url: string }; 
                small?: { url: string };
                thumbnail?: { url: string };
            }
        };
        url?: string; 
        formats?: { 
            medium?: { url: string }; 
            small?: { url: string };
            thumbnail?: { url: string };
        } 
    }>) => {
        if (!imageArray || imageArray.length === 0) {
            return null;
        }
        
        const firstImage = imageArray[0];
        
        // Try different URL patterns - the actual structure has imageQuestion nested
        let url = firstImage?.imageQuestion?.url || 
                  firstImage?.imageQuestion?.formats?.medium?.url || 
                  firstImage?.imageQuestion?.formats?.small?.url ||
                  firstImage?.imageQuestion?.formats?.thumbnail?.url ||
                  firstImage?.url || 
                  firstImage?.formats?.medium?.url || 
                  firstImage?.formats?.small?.url ||
                  firstImage?.formats?.thumbnail?.url ||
                  undefined;
        
        // If URL doesn't start with http, prepend the API base
        if (url && !url.startsWith('http')) {
            // Remove /api/analyzer from API_BASE to get just the domain
            const baseUrl = API_BASE.replace('/api/analyzer', '');
            url = `${baseUrl}${url}`;
        }
        
        return url;
    };

    const mainContent = (
        <Box sx={{ 
            flexGrow: 1, 
            ml: { xs: 0, md: '260px' },
            p: { xs: 2, md: 3 },
            minHeight: '100vh',
            bgcolor: '#f8fafc'
        }}>
            {!selectedTask ? (
                // Challenge Selection View
                <>
                    <Typography 
                        variant="h5" 
                        fontWeight="bold" 
                        sx={{ 
                            mb: 3, 
                            color: '#1a202c',
                            textAlign: { xs: 'center', md: 'left' },
                            fontSize: { xs: '1.5rem', md: '2rem' }
                        }}
                    >
                        Choose Your Image Task
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <LinearProgress sx={{ width: '50%' }} />
                        </Box>
                    ) : imageTasks.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                No image tasks available at the moment.
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={3}>
                            {imageTasks.map((task) => (
                                <Grid item xs={12} sm={6} lg={4} key={task.id}>
                                    <Card 
                                        sx={{ 
                                            height: '100%',
                                            borderRadius: 3,
                                            transition: 'all 0.3s ease',
                                            border: '1px solid #e2e8f0',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Chip 
                                                    label="Image Task"
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: '#2196f3',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <Chip 
                                                    label="Prompt Analysis"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#1a202c' }}>
                                                {task.name}
                                            </Typography>
                                            
                                            {/* Display the image */}
                                            {getImageUrl(task.Image) && (
                                                <Box sx={{ 
                                                    mb: 2,
                                                    borderRadius: 2,
                                                    overflow: 'hidden',
                                                    border: '1px solid #e2e8f0'
                                                }}>
                                                    <img
                                                        src={getImageUrl(task.Image) || ''}
                                                        alt={task.name}
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '250px', 
                                                            objectFit: 'cover' 
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                            
                                            <Box sx={{ 
                                                bgcolor: '#f7fafc', 
                                                p: 2, 
                                                borderRadius: 2,
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <Typography 
                                                    variant="caption" 
                                                    fontWeight="bold" 
                                                    color="primary" 
                                                    sx={{ 
                                                        display: 'block', 
                                                        mb: 1,
                                                        fontSize: { xs: '0.75rem', md: '0.875rem' }
                                                    }}
                                                >
                                                    TASK:
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontSize: { xs: '0.8rem', md: '0.875rem' }, 
                                                        lineHeight: 1.5,
                                                        color: '#374151'
                                                    }}
                                                >
                                                    {task.question}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                        <CardActions sx={{ p: 3, pt: 0 }}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                onClick={() => handleTaskSelect(task)}
                                                sx={{ 
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 'bold',
                                                    py: 1.5
                                                }}
                                            >
                                                Start Task
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            ) : (
                // Task Workspace View
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Button 
                            variant="outlined" 
                            onClick={() => setSelectedTask(null)}
                            sx={{ borderRadius: 2 }}
                        >
                            ← Back to Tasks
                        </Button>
                        <Chip 
                            label="Image Task"
                            sx={{ 
                                bgcolor: '#2196f3',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        />
                        <Chip label="Prompt Analysis" variant="outlined" />
                    </Box>

                    <Grid container spacing={3}>
                        {/* Left Panel - Task Details */}
                        <Grid item xs={12} lg={5}>
                            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                                <Typography 
                                    variant="h5" 
                                    fontWeight="bold" 
                                    sx={{ 
                                        mb: 2, 
                                        color: '#1a202c',
                                        fontSize: { xs: '1.25rem', md: '1.5rem' }
                                    }}
                                >
                                    {selectedTask.name}
                                </Typography>
                                
                                {/* Task Question */}
                                <Box sx={{ 
                                    mb: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: '#f0f9ff',
                                    border: '1px solid #bae6fd'
                                }}>
                                    <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                            color: '#0369a1',
                                            fontWeight: 'bold',
                                            mb: 1,
                                            fontSize: { xs: '0.875rem', md: '1rem' }
                                        }}
                                    >
                                        🎯 YOUR GOAL:
                                    </Typography>
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            lineHeight: 1.6,
                                            fontSize: { xs: '0.95rem', md: '1rem' },
                                            color: '#0c4a6e'
                                        }}
                                    >
                                        {selectedTask.question}
                                    </Typography>
                                </Box>
                                
                                {/* Inspiration Image below task */}
                                <Box sx={{ 
                                    mb: 3,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '2px solid #ff9800',
                                    bgcolor: '#fff3e0'
                                }}>
                                    <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                            p: 1, 
                                            bgcolor: '#ff9800', 
                                            color: 'white', 
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}
                                    >
                                        🎨 Inspiration Image
                                    </Typography>
                                    {getImageUrl(selectedTask.Image) ? (
                                        <img
                                            src={getImageUrl(selectedTask.Image) || ''}
                                            alt={selectedTask.name}
                                            style={{ 
                                                width: '100%', 
                                                maxHeight: '400px', 
                                                objectFit: 'cover',
                                                display: 'block'
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ 
                                            height: 300, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#ff9800'
                                        }}>
                                            <Typography>No image available</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Right Panel - Prompt Input & Results */}
                        <Grid item xs={12} lg={7}>
                            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                                <Typography 
                                    variant="h6" 
                                    fontWeight="bold" 
                                    sx={{ 
                                        mb: 2,
                                        fontSize: { xs: '1.1rem', md: '1.25rem' },
                                        color: '#1a202c'
                                    }}
                                >
                                    <AutoFixHighIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Your Prompt
                                </Typography>
                                <TextField
                                    multiline
                                    rows={6}
                                    fullWidth
                                    variant="outlined"
                                    placeholder="Write your DALL-E prompt here... Be specific about style, composition, lighting, and details!"
                                    value={userPrompt}
                                    onChange={(e) => setUserPrompt(e.target.value)}
                                    className="solution-input"
                                    sx={{ 
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            fontSize: { xs: '0.9rem', md: '1rem' }
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            fontSize: { xs: '0.85rem', md: '0.95rem' }
                                        }
                                    }}
                                />
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleGenerateImage}
                                        disabled={!userPrompt.trim() || isGenerating}
                                        className="submit-button"
                                        sx={{ 
                                            borderRadius: 2,
                                            px: 4,
                                            textTransform: 'none',
                                            fontWeight: 'bold',
                                            fontSize: { xs: '0.9rem', md: '1rem' }
                                        }}
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate & Compare'}
                                    </Button>
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                                    >
                                        {userPrompt.length}/500 characters
                                    </Typography>
                                </Box>
                                {isGenerating && (
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress sx={{ borderRadius: 1 }} />
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            sx={{ 
                                                mt: 1,
                                                fontSize: { xs: '0.85rem', md: '0.9rem' }
                                            }}
                                        >
                                            Creating your image and expert comparison...
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>

                            {/* Comparison Results */}
                            {showComparison && (
                                <Paper sx={{ p: 3, borderRadius: 3 }}>
                                    <Typography 
                                        variant="h6" 
                                        fontWeight="bold" 
                                        sx={{ 
                                            mb: 3,
                                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                                            color: '#1a202c'
                                        }}
                                    >
                                        <CompareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Image Comparison
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Box>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    fontWeight="bold" 
                                                    sx={{ 
                                                        mb: 1,
                                                        fontSize: { xs: '1rem', md: '1.1rem' },
                                                        color: '#374151'
                                                    }}
                                                >
                                                    Your Result
                                                </Typography>
                                                <Box sx={{ 
                                                    height: 300, 
                                                    bgcolor: '#f5f5f5', 
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '2px dashed #ddd',
                                                    overflow: 'hidden'
                                                }}>
                                                    {generatedImageUrl ? (
                                                        <img
                                                            src={generatedImageUrl}
                                                            alt="Generated Image"
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '100%', 
                                                                objectFit: 'cover' 
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography 
                                                            color="text.secondary"
                                                            sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                                                        >
                                                            Generated Image Preview
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        mt: 1, 
                                                        fontStyle: 'italic',
                                                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                                                        color: '#6b7280',
                                                        lineHeight: 1.4
                                                    }}
                                                >
                                                    "{userPrompt}"
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    fontWeight="bold" 
                                                    sx={{ 
                                                        mb: 1,
                                                        fontSize: { xs: '1rem', md: '1.1rem' },
                                                        color: '#374151'
                                                    }}
                                                >
                                                    Expected Result
                                                </Typography>
                                                <Box sx={{ 
                                                    height: 300, 
                                                    bgcolor: '#f5f5f5', 
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '2px solid #4caf50',
                                                    overflow: 'hidden'
                                                }}>
                                                    {getImageUrl(selectedTask.Image) ? (
                                                        <img
                                                            src={getImageUrl(selectedTask.Image) || ''}
                                                            alt="Expected Result"
                                                            style={{ 
                                                                width: '100%', 
                                                                height: '100%', 
                                                                objectFit: 'cover' 
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography 
                                                            color="text.secondary"
                                                            sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}
                                                        >
                                                            Expected Image
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    
                                    {/* Evaluation Results */}
                                    {(isEvaluating || evaluationResult) && (
                                        <Box sx={{ mt: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                            <Typography 
                                                variant="h6" 
                                                fontWeight="bold" 
                                                sx={{ 
                                                    mb: 2,
                                                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                                                    color: '#1a202c'
                                                }}
                                            >
                                                📊 Prompt Evaluation
                                            </Typography>
                                            
                                            {isEvaluating ? (
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Analyzing your prompt...
                                                    </Typography>
                                                    <LinearProgress sx={{ borderRadius: 1 }} />
                                                </Box>
                                            ) : evaluationResult && (
                                                <Box>
                                                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                                                        <strong>Analysis:</strong> {evaluationResult.analysis || 'Analysis completed'}
                                                    </Typography>
                                                    
                                                    {/* Visual Score Bar */}
                                                    {evaluationResult.score !== undefined && evaluationResult.totalScore !== undefined && evaluationResult.maxPossibleScore !== undefined && (
                                                        <Box sx={{ mb: 3 }}>
                                                            {/* Percentage Bar */}
                                                            <Box sx={{ mb: 2 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                                                        {evaluationResult.score}%
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Score
                                                                    </Typography>
                                                                </Box>
                                                                <LinearProgress 
                                                                    variant="determinate" 
                                                                    value={evaluationResult.score} 
                                                                    sx={{ 
                                                                        height: 12, 
                                                                        borderRadius: 6,
                                                                        bgcolor: '#f0f0f0',
                                                                        '& .MuiLinearProgress-bar': {
                                                                            bgcolor: evaluationResult.score >= 80 ? '#4caf50' : 
                                                                                    evaluationResult.score >= 60 ? '#ff9800' : '#f44336',
                                                                            borderRadius: 6
                                                                        }
                                                                    }} 
                                                                />
                                                            </Box>
                                                            
                                                            {/* Total Score Display */}
                                                            <Box sx={{ 
                                                                p: 2, 
                                                                bgcolor: '#f8fafc', 
                                                                borderRadius: 2,
                                                                border: '1px solid #e2e8f0',
                                                                textAlign: 'center'
                                                            }}>
                                                                <Typography variant="h6" fontWeight="bold" color="text.primary">
                                                                    Total Score: {evaluationResult.totalScore} / {evaluationResult.maxPossibleScore} points
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    
                                                    {evaluationResult.score && (
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 2, 
                                                            p: 2, 
                                                            bgcolor: '#e8f5e8', 
                                                            borderRadius: 2,
                                                            mb: 2
                                                        }}>
                                                            <Typography variant="h6" fontWeight="bold" color="success.main">
                                                                Overall Score: {evaluationResult.score}/100
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    
                                                    {/* Detailed Criteria Breakdown */}
                                                    {evaluationResult.criterionResults && evaluationResult.criterionResults.length > 0 && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                                                📋 Detailed Criteria Breakdown:
                                                            </Typography>
                                                            {evaluationResult.criterionResults.map((criterion, index) => (
                                                                <Box key={index} sx={{ 
                                                                    mb: 3, 
                                                                    p: 2, 
                                                                    bgcolor: '#f8fafc', 
                                                                    borderRadius: 2,
                                                                    border: '1px solid #e2e8f0'
                                                                }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                                            {criteriaData?.[criterion.criterionId]?.name || `Criterion ${index + 1}`}
                                                                        </Typography>
                                                                        <Typography variant="h6" fontWeight="bold" color={criterion.score >= 4 ? 'success.main' : criterion.score >= 3 ? 'warning.main' : 'error.main'}>
                                                                            {criterion.score}/5
                                                                        </Typography>
                                                                    </Box>
                                                                    
                                                                    {criterion.subquestionResults && criterion.subquestionResults.length > 0 && (
                                                                        <Box sx={{ mt: 1 }}>
                                                                            {criterion.subquestionResults.map((subResult, subIndex) => {
                                                                                const subQuestion = criteriaData?.[criterion.criterionId]?.subquestions?.find((sq: any) => sq.id === subResult.subquestionId);
                                                                                return (
                                                                                    <Box key={subIndex} sx={{ 
                                                                                        mb: 1, 
                                                                                        p: 1.5, 
                                                                                        bgcolor: 'white', 
                                                                                        borderRadius: 1,
                                                                                        border: '1px solid #e2e8f0'
                                                                                    }}>
                                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                                                            <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                                                                                {subQuestion?.question || `Sub-criterion ${subIndex + 1}`}
                                                                                            </Typography>
                                                                                            <Typography variant="body2" fontWeight="bold" color={subResult.score >= 4 ? 'success.main' : subResult.score >= 3 ? 'warning.main' : 'error.main'}>
                                                                                                {subResult.score}/5
                                                                                            </Typography>
                                                                                        </Box>
                                                                                        {subResult.feedback && (
                                                                                            <Typography variant="body2" sx={{ 
                                                                                                color: '#6b7280',
                                                                                                lineHeight: 1.5,
                                                                                                fontSize: '0.875rem'
                                                                                            }}>
                                                                                                💬 {subResult.feedback}
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Box>
                                                                                );
                                                                            })}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                    
                                                    {evaluationResult.feedback && (
                                                        <Typography variant="body2" sx={{ 
                                                            fontStyle: 'italic',
                                                            color: '#6b7280',
                                                            lineHeight: 1.5
                                                        }}>
                                                            💡 {evaluationResult.feedback}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <LeftSidebar 
                onDailyChallenge={handleDailyChallenge}
                name={name}
                onLogout={onLogout}
            />
            {mainContent}
        </Box>
    );
} 