import { Box, Button, Alert, Typography } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import React from 'react';

const TaskHint: React.FC<{ task: any; showHint: boolean; onToggleHint: () => void }> = ({ task, showHint, onToggleHint }) => {
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
};

export default TaskHint; 