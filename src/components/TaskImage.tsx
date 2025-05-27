import { Box } from '@mui/material';
import React from 'react';

const API_ROOT = 'https://prompt-pal-api.onrender.com';

const TaskImage: React.FC<{ image: any }> = ({ image }) => (
    <Box>
        <img
            src={`${API_ROOT}${image.imageQuestion.formats.thumbnail.url}`}
            alt="Question Image"
            style={{ width: '100%', borderRadius: 8 }}
        />
    </Box>
);

export default TaskImage; 