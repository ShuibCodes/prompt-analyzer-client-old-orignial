import { Box, Button, Alert, Typography } from '@mui/material';
import { TaskHintProps } from './types';

export function TaskHint({ task, showHint, onToggleHint }: TaskHintProps) {
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