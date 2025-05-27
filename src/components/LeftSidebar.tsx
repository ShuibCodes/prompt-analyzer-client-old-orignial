import { Box, Button, Typography, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import React from 'react';

interface LeftSidebarProps {
  onDailyChallenge: () => void;
  name: string;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onDailyChallenge, name, onLogout }) => (
  <Box sx={{
    width: 260,
    bgcolor: 'background.paper',
    height: '100vh',
    borderRight: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1000,
    p: 0,
    boxShadow: 2
  }}>
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 3, pb: 2 }}>
        <MenuIcon sx={{ color: '#ff6600', fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#ff6600', letterSpacing: 1 }}>Prompt Pal</Typography>
      </Box>
      <Box sx={{ mb: 2, px: 2 }}>
        <Button startIcon={<EmojiEventsIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={onDailyChallenge}>Daily Challenge</Button>
        <Button startIcon={<ListAltIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>All Challenges</Button>
        <Button startIcon={<BoltIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Prompt Improver <Box component="span" sx={{ bgcolor: '#ff5252', color: '#fff', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>NEW</Box></Button>
        <Button startIcon={<GroupsIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Community <Box component="span" sx={{ bgcolor: '#eee', color: '#888', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>Coming Soon</Box></Button>
        <Button startIcon={<SchoolIcon />} fullWidth sx={{ justifyContent: 'flex-start', mb: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, color: '#222', '&:hover': { bgcolor: '#f5f5f5' } }}>Learn <Box component="span" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 1, px: 1, ml: 1, fontSize: 12 }}>Explore</Box></Button>
      </Box>
      <Paper elevation={2} sx={{ bgcolor: '#f5faff', borderRadius: 3, p: 2, mb: 2, mx: 2 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>STATS</Typography>
        <Box sx={{ bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 2, p: 1, mt: 1, mb: 1, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
          <span role="img" aria-label="cloud">☁️</span> No Streak Yet!
        </Box>
        <Box sx={{ bgcolor: '#fff8e1', color: '#ffb300', borderRadius: 2, p: 1, textAlign: 'center', fontWeight: 600, fontSize: 15 }}>
          <span role="img" aria-label="trophy">🏆</span> 0 Challenges Completed!
        </Box>
      </Paper>
      <Paper elevation={2} sx={{ bgcolor: '#fffbe7', borderRadius: 3, p: 2, mb: 2, mx: 2, textAlign: 'center' }}>
        <Typography variant="body2" fontWeight="bold" color="#ff9800">Become a Super Learner</Typography>
        <Button variant="contained" color="warning" fullWidth sx={{ mt: 1, borderRadius: 2, fontWeight: 700 }}>Try for 7 Days Free</Button>
      </Paper>
    </Box>
    <Box sx={{ textAlign: 'center', py: 3, borderTop: '1px solid #eee', bgcolor: '#fafbfc', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <PersonIcon sx={{ color: '#888', fontSize: 22 }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{name}</Typography>
        <Button onClick={onLogout} sx={{ minWidth: 0, p: 0, ml: 1 }}><LogoutIcon sx={{ color: '#888' }} /></Button>
      </Box>
    </Box>
  </Box>
);

export default LeftSidebar; 