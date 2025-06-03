import { Box } from '@mui/material';
import { ReactNode } from 'react';
import LeftSidebar from './LeftSidebar';

interface BaseLayoutProps {
    name: string;
    onLogout: () => void;
    children: ReactNode;
}

export default function BaseLayout({ name, onLogout, children }: BaseLayoutProps) {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <LeftSidebar 
                userName={name}
                onLogout={onLogout}
            />
            <Box sx={{ 
                flexGrow: 1, 
                ml: { xs: 0, md: '260px' },
                minHeight: '100vh'
            }}>
                {children}
            </Box>
        </Box>
    );
} 