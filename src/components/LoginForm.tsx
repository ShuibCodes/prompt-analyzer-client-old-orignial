import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { email: string; name: string }) => void;
  onSkip: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onSkip }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={4} sx={{ p: 5, borderRadius: 4, minWidth: 350, maxWidth: 400, width: '100%', boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: 'center' }}>
          {/* You can add a logo/icon here if desired */}
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#ff6600', letterSpacing: 1 }}>Prompt Pal</Typography>
        </Box>
        <Typography variant="h6" gutterBottom align="center" sx={{ mb: 2, fontWeight: 700 }}>
          Welcome! Enter your info to begin:
        </Typography>
        <TextField 
          label="Email" 
          fullWidth 
          margin="normal" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          sx={{ mb: 2 }}
        />
        <TextField 
          label="Name" 
          fullWidth 
          margin="normal" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onSubmit({ email, name })}
            sx={{ flex: 1, fontWeight: 700, borderRadius: 2, py: 1 }}
          >
            Start
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={onSkip}
            sx={{ flex: 1, fontWeight: 700, borderRadius: 2, py: 1 }}
          >
            Skip Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm; 