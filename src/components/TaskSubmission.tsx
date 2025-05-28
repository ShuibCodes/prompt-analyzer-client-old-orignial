import { Box, TextField, Button, LinearProgress, Typography } from '@mui/material';
import { TaskSubmissionProps } from './types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function TaskSubmission({ 
    userSolution, 
    onSolutionChange, 
    onSubmit, 
    isEvaluating 
}: TaskSubmissionProps) {
    return (
        <>
            <TextField
                label="Your Prompt"
                multiline
                fullWidth
                minRows={3}
                value={userSolution}
                placeholder="Write your prompt here..."
                onChange={(e) => onSolutionChange(e.target.value)}
                className="solution-input"
            />
            
            <Button
                variant="contained"
                color="warning"
                onClick={onSubmit}
                disabled={isEvaluating}
                sx={{ mt: 2, fontWeight: 700, borderRadius: 3, py: 1.2, fontSize: '1.1rem', boxShadow: '0 2px 8px #ffe08288' }}
                className="submit-button"
                startIcon={<EmojiEventsIcon />}
            >
                {isEvaluating ? 'Evaluating...' : 'Submit Solution'}
            </Button>
            
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