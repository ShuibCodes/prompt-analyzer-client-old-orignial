import { Box, Paper, Typography, TextField, Button, Alert, Fade } from '@mui/material';
import React, { useState } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ErrorIcon from '@mui/icons-material/Error';

interface LoginFormProps {
  onSubmit: (data: { email: string; name: string }) => void;
  onSkip: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  email?: string;
  name?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onSkip, isLoading = false, error = null }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; name: boolean }>({
    email: false,
    name: false,
  });

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (name.trim().length > 50) {
      return 'Name must be less than 50 characters';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(email);
    const nameError = validateName(name);
    
    setErrors({
      email: emailError,
      name: nameError,
    });

    return !emailError && !nameError;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({
        ...prev,
        email: validateEmail(value),
      }));
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (touched.name) {
      setErrors(prev => ({
        ...prev,
        name: validateName(value),
      }));
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({
      ...prev,
      email: validateEmail(email),
    }));
  };

  const handleNameBlur = () => {
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({
      ...prev,
      name: validateName(name),
    }));
  };

  const handleSubmit = () => {
    setTouched({ email: true, name: true });
    if (validateForm()) {
      onSubmit({ email: email.trim(), name: name.trim() });
    }
  };

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

        {error && (
          <Fade in={true}>
            <Alert 
              severity="error" 
              icon={<ErrorIcon />}
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.9rem',
                }
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        <TextField 
          label="Email" 
          fullWidth 
          margin="normal" 
          value={email} 
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={handleEmailBlur}
          error={touched.email && !!errors.email}
          helperText={touched.email && errors.email}
          disabled={isLoading}
          sx={{ 
            mb: 2,
            '& .MuiFormHelperText-root.Mui-error': {
              fontSize: '0.8rem',
              marginLeft: 0,
            }
          }}
        />
        <TextField 
          label="Name" 
          fullWidth 
          margin="normal" 
          value={name} 
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={handleNameBlur}
          error={touched.name && !!errors.name}
          helperText={touched.name && errors.name}
          disabled={isLoading}
          sx={{ 
            mb: 2,
            '& .MuiFormHelperText-root.Mui-error': {
              fontSize: '0.8rem',
              marginLeft: 0,
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleSubmit}
            disabled={isLoading || !email.trim() || !name.trim()}
            sx={{ 
              flex: 1, 
              fontWeight: 700, 
              borderRadius: 1, 
              py: 1.2, 
              fontSize: '1.1rem', 
              boxShadow: '0 2px 8px #ffe08288',
              '&:disabled': {
                opacity: 0.6,
              }
            }}
            startIcon={isLoading ? undefined : <EmojiEventsIcon />}
          >
            {isLoading ? 'Creating...' : 'Start'}
          </Button>
          <Button 
            variant="outlined" 
            color="warning"
            onClick={onSkip}
            disabled={isLoading}
            sx={{ 
              flex: 1, 
              fontWeight: 700, 
              borderRadius: 1, 
              py: 1.2, 
              fontSize: '1.1rem', 
              borderWidth: 2,
              '&:disabled': {
                opacity: 0.6,
              }
            }}
          >
            Skip Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm; 