import { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Button, 
    Grid, 
    Card, 
    CardContent,
    CardActions,
    Chip,
    LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config';

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

export default function ImageGenerationDashboard() {
    const [imageTasks, setImageTasks] = useState<ImageTask[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                setLoading(true);
                const response = await axios.get(`${API_BASE}/users/${userId}/image-tasks`);
                setImageTasks(response.data.data || []);
            } catch (error) {
                console.error('Error fetching image tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchImageTasks();
    }, [userId]);

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
        
        let url = firstImage?.imageQuestion?.url || 
                  firstImage?.imageQuestion?.formats?.medium?.url || 
                  firstImage?.imageQuestion?.formats?.small?.url ||
                  firstImage?.imageQuestion?.formats?.thumbnail?.url ||
                  firstImage?.url || 
                  firstImage?.formats?.medium?.url || 
                  firstImage?.formats?.small?.url ||
                  firstImage?.formats?.thumbnail?.url ||
                  undefined;
        
        if (url && !url.startsWith('http')) {
            const baseUrl = API_BASE.replace('/api/analyzer', '');
            url = `${baseUrl}${url}`;
        }
        
        return url;
    };

    const handleTaskSelect = (taskId: string) => {
        navigate(`/image-generation/task/${taskId}`);
    };

    return (
        <Box sx={{ 
            flexGrow: 1, 
            p: { xs: 2, md: 3 },
            minHeight: '100vh',
            bgcolor: '#f8fafc'
        }}>
            <Typography 
                variant="h4" 
                fontWeight="bold" 
                sx={{ 
                    mb: 1, 
                    color: '#1a202c',
                    textAlign: { xs: 'center', md: 'left' },
                    fontSize: { xs: '1.75rem', md: '2.25rem' }
                }}
            >
                Image Generation Tasks
            </Typography>
            
            <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                    mb: 4,
                    textAlign: { xs: 'center', md: 'left' },
                    fontSize: { xs: '0.95rem', md: '1.1rem' }
                }}
            >
                Practice creating effective DALL-E prompts and compare your results with expert examples
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
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Check back later for new image generation challenges!
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {imageTasks.map((task) => (
                        <Grid item xs={12} sm={6} lg={4} key={task.id}>
                            <Card 
                                sx={{ 
                                    height: '100%',
                                    borderRadius: 2,
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
                                        onClick={() => handleTaskSelect(task.id)}
                                        sx={{ 
                                            borderRadius: 1,
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
        </Box>
    );
} 