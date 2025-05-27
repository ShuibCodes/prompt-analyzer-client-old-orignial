import { Box, Paper, Typography, Button } from '@mui/material';
import React from 'react';

const RightSidebar: React.FC = () => (
  <Box sx={{
    width: 300,
    bgcolor: 'background.paper',
    height: '100vh',
    borderLeft: '1px solid #eee',
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: 1000,
    p: 0,
    boxShadow: 2
  }}>
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#f5faff' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>How It Works</Typography>
        <Typography variant="body2" color="text.secondary">1. Complete daily challenges.<br/>2. Improve your prompts.<br/>3. Earn gems and track your progress!</Typography>
      </Paper>
      <Paper elevation={2} sx={{ p: 2, borderRadius: 3, bgcolor: '#fffbe7' }}>
        <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>Gems Remaining</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
          <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
          <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
          <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💎</Box>
          <Box sx={{ width: 32, height: 32, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔮</Box>
        </Box>
        <Button variant="text" color="warning" sx={{ p: 0, minWidth: 0, fontWeight: 700 }}>Get Unlimited Gems</Button>
      </Paper>
    </Box>
  </Box>
);

export default RightSidebar; 