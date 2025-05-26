import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { FinalResultsProps } from './types';

export function FinalResults({ 
    tasksMap, 
    criteriaData, 
    resultsData, 
    onSendEmail, 
    isSendingEmail 
}: FinalResultsProps) {
    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h6">All tasks submitted!</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onSendEmail}
                    disabled={isSendingEmail}
                >
                    {isSendingEmail ? 'Sending...' : 'Send Results to Email'}
                </Button>
            </Box>
            {criteriaData && resultsData && resultsData.score !== null && (
                <Box mt={4}>
                    <Typography variant="h5">Final Score: {resultsData.score.toFixed(2)}</Typography>
                    {resultsData.taskResults.map((task) => (
                        <Paper key={task.taskId} sx={{ p: 2, mt: 2 }}>
                            <Typography variant="h6">
                                Task: {tasksMap ? tasksMap[task.taskId].name : task.taskId}
                            </Typography>
                            {task.criterionResults.map((criterion) => (
                                <Box key={criterion.criterionId} mt={1}>
                                    <Typography>
                                        <strong>
                                            {!criteriaData ? criterion.criterionId : criteriaData[criterion.criterionId].name}
                                        </strong>: {criterion.score}
                                    </Typography>
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