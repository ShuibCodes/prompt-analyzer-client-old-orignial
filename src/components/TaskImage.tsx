import { Box } from '@mui/material';
import { Image } from './types';

interface TaskImageProps {
    image: Image;
}

export default function TaskImage({ image }: TaskImageProps) {
    return (
        <Box>
            <img
                src={`https://prompt-pal-api.onrender.com${image.imageQuestion.formats.thumbnail.url}`}
                alt="Question Image"
                style={{ width: '100%', borderRadius: 8 }}
            />
        </Box>
    );
} 