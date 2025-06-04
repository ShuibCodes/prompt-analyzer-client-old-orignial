import { Box, Typography, LinearProgress, Button } from '@mui/material';
import React from 'react';
import ResultCharts from './ResultCharts';
import { TaskResult, CriteriaData } from '../types';

interface TaskResultsProps {
  taskResult: TaskResult;
  criteriaData: CriteriaData;
  currentAttempts: number;
  onNextTask?: () => void;
  onSendEmail?: () => void;
  isSendingEmail?: boolean;
}

const TaskResults: React.FC<TaskResultsProps> = ({ 
  taskResult, 
  criteriaData, 
  currentAttempts, 
  onNextTask,
  onSendEmail,
  isSendingEmail
}) => {
  const totalScore = taskResult.criterionResults.reduce(
    (sum, criterion) => sum + criterion.score, 0
  );
  const maxPossibleScore = taskResult.criterionResults.length * 5;
  const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

  // Add criterion names to the results
  const criterionResultsWithNames = taskResult.criterionResults.map(criterion => ({
    ...criterion,
    name: criteriaData?.[criterion.criterionId]?.name || criterion.criterionId
  }));

  return (
    <Box className="results-section" sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Results for this task (Attempt {currentAttempts}):
      </Typography>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          color={percentageScore >= 70 ? '#4caf50' : percentageScore >= 50 ? '#ff9800' : '#f44336'}
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

      {/* Add the charts component */}
      <ResultCharts 
        criterionResults={criterionResultsWithNames}
      />

      {taskResult.criterionResults.map(criterion => (
        <Box key={criterion.criterionId} sx={{ mb: 2 }}>
          <Typography fontWeight="bold">
            {criteriaData?.[criterion.criterionId]?.name || criterion.criterionId}: {criterion.score}
          </Typography>
          {criterion.subquestionResults?.map(sub => (
            <Typography key={sub.subquestionId} sx={{ pl: 2 }}>
              - {sub.feedback} (Score: {sub.score})
            </Typography>
          ))}
        </Box>
      ))}
      
      {/* Show either Next Task or Send Email button */}
      {onNextTask && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={onNextTask}
        >
          Next Task
        </Button>
      )}
      
      {onSendEmail && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={onSendEmail}
          disabled={isSendingEmail}
        >
          {isSendingEmail ? 'Sending Results...' : 'Send Results by Email'}
        </Button>
      )}
    </Box>
  );
};

export default TaskResults; 