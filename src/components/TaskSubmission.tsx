import { TextField, Button, Box, Typography, LinearProgress } from '@mui/material';
import React from 'react';

const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

function countNonWhitespaceCharacters(str: string) {
    return str.replace(/\s/g, "").length;
}

const TaskSubmission: React.FC<{
    task: any;
    userSolution: string;
    onSolutionChange: (value: string) => void;
    onSubmit: () => void;
    isEvaluating: boolean;
}> = ({ task, userSolution, onSolutionChange, onSubmit, isEvaluating }) => (
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

export default TaskSubmission; 