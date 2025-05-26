import { Box, Typography, LinearProgress, Button } from '@mui/material';
import { TaskResultsProps } from './types';

export function TaskResults({ 
    taskResult, 
    criteriaData, 
    currentAttempts,
    onNextTask 
}: TaskResultsProps) {
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