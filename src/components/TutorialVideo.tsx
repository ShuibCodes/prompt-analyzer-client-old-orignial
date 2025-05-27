import { Box, Modal, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TutorialVideoProps {
    open: boolean;
    onClose: () => void;
}

export default function TutorialVideo({ open, onClose }: TutorialVideoProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="tutorial-video-modal"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box sx={{
                position: 'relative',
                width: '80%',
                maxWidth: '800px',
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 2,
            }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        zIndex: 1000,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        width: 40,
                        height: 40,
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.9)',
                        },
                        '& svg': {
                            fontSize: 28,
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                    <video
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            borderRadius: 8,
                        }}
                        controls
                        autoPlay
                        src="https://res.cloudinary.com/dkfnl37kf/video/upload/v1748350824/kiwnvbelflzbbgi8upac.mp4"
                    />
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                    Welcome to Prompt Pal! Watch this quick tutorial to get started.
                </Typography>
            </Box>
        </Modal>
    );
} 