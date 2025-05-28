import { Box, Typography, Paper, Button, LinearProgress, Pagination } from '@mui/material';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmailIcon from '@mui/icons-material/Email';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import React, { useState } from 'react';
import ResultCharts from './ResultCharts';
import { TaskData, CriteriaData, ResultsData } from '../types';

interface FinalResultsProps {
  tasksMap: TaskData;
  criteriaData: CriteriaData;
  resultsData: ResultsData;
  onSendEmail: () => void;
  isSendingEmail: boolean;
  onRestartQuiz: () => void;
}

const FinalResults: React.FC<FinalResultsProps> = ({ 
  tasksMap, 
  criteriaData, 
  resultsData, 
  onSendEmail, 
  isSendingEmail, 
  onRestartQuiz 
}) => {
  const finalScore = resultsData?.score ?? 0;
  const scoreColor = finalScore >= 4 ? '#43a047' : finalScore >= 2.5 ? '#ffa000' : '#e53935';
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const tasks = resultsData.taskResults || [];
  const currentTask = tasks[currentTaskPage - 1];
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => setCurrentTaskPage(value);

  // Add criterion names to the results
  const criterionResultsWithNames = currentTask?.criterionResults.map(criterion => ({
    ...criterion,
    name: criteriaData?.[criterion.criterionId]?.name || criterion.criterionId
  })) || [];

  return (
    <Paper elevation={4} sx={{ p: 4, borderRadius: 4, bgcolor: '#f5faff', boxShadow: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <CelebrationIcon sx={{ color: '#ff9800', fontSize: 36 }} />
        <Typography variant="h5" fontWeight="bold">All tasks submitted!</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EmailIcon />}
          onClick={onSendEmail}
          disabled={isSendingEmail}
          sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
        >
          {isSendingEmail ? 'Sending...' : 'Send Results to Email'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onRestartQuiz}
          sx={{ fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
        >
          Restart Quiz
        </Button>
      </Box>
      {criteriaData && resultsData && resultsData.score !== null && (
        <Box mt={4}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="bold" sx={{ color: scoreColor, mb: 1, letterSpacing: 1 }}>
              {finalScore.toFixed(2)}<span style={{ fontSize: 24, color: '#888' }}>/5</span>
            </Typography>
            <Box sx={{ width: '60%', mx: 'auto', mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={finalScore / 5 * 100}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: scoreColor,
                    borderRadius: 6
                  }
                }}
              />
            </Box>
            <Typography variant="subtitle1" color="text.secondary">Average Score</Typography>
          </Box>

          {/* Add the charts component */}
          {currentTask && (
            <ResultCharts 
              criterionResults={criterionResultsWithNames}
            />
          )}

          {currentTask && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 2, bgcolor: '#fff' }}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#1976d2' }} />
                Task: {tasksMap ? tasksMap[currentTask.taskId].name : currentTask.taskId}
              </Typography>
              {currentTask.criterionResults.map(criterion => (
                <Box key={criterion.criterionId} mt={1} sx={{ pl: 2 }}>
                  <Typography fontWeight="bold" sx={{ color: '#1976d2' }}>
                    {!criteriaData ? criterion.criterionId : criteriaData[criterion.criterionId].name}
                    <span style={{ marginLeft: 8, color: '#888', fontWeight: 400 }}>Score: {criterion.score}</span>
                  </Typography>
                  {criterion.subquestionResults.map(sub => (
                    <Typography key={sub.subquestionId} sx={{ pl: 2, color: '#555' }}>
                      - {sub.feedback} <span style={{ color: '#888' }}>(Score: {sub.score})</span>
                    </Typography>
                  ))}
                </Box>
              ))}
            </Paper>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={tasks.length}
              page={currentTaskPage}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FinalResults; 