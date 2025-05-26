import { useState } from 'react';
import { Container, Typography, TextField, Box, Button } from '@mui/material';
import { LoginFormProps } from './types';

export function LoginForm({ onSubmit, onSkip }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Welcome! Enter your info to begin:
            </Typography>
            <TextField 
                label="Email" 
                fullWidth 
                margin="normal" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
            <TextField 
                label="Name" 
                fullWidth 
                margin="normal" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button 
                    variant="contained" 
                    onClick={() => onSubmit({ email, name })}
                >
                    Start
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={onSkip}
                >
                    Skip Login
                </Button>
            </Box>
        </Container>
    );
} 