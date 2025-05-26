import { Box } from '@mui/material';
import { TaskImageProps } from './types';

const API_ROOT = 'https://prompt-pal-api.onrender.com';

export function TaskImage({ image }: TaskImageProps) {
    return (
        <Box>
            <img
                src={`${API_ROOT}${image.imageQuestion.formats.thumbnail.url}`}
                alt="Question Image"
                style={{ width: '100%', borderRadius: 8 }}
            />
        </Box>
    );
} 