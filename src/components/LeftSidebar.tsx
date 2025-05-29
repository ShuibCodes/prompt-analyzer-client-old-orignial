import { Box, Button, Typography, Paper, useTheme, useMediaQuery, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ImageIcon from '@mui/icons-material/Image';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LeftSidebarProps {
  onDailyChallenge: () => void;
  name: string;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ onDailyChallenge, name, onLogout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleImageGeneration = () => {
    navigate('/image-generation');
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: { xs: 2, md: 3 }, pb: 2 }}>
        <MenuIcon sx={{ color: '#ff6600', fontSize: { xs: 24, md: 32 } }} />
        <Typography variant="h5" fontWeight="bold" sx={{ 
          color: '#ff6600', 
          letterSpacing: 1,
          fontSize: { xs: '1.25rem', md: '1.5rem' }
        }}>
          Prompt Pal
        </Typography>
      </Box>
      <Box sx={{ mb: 2, px: { xs: 1, md: 2 } }}>
        <Button 
          startIcon={<EmojiEventsIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' },
            py: 1.5
          }} 
          onClick={onDailyChallenge}
        >
          Daily Challenge
        </Button>
        <Button 
          startIcon={<ListAltIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' },
            py: 1.5
          }}
        >
          All Challenges
        </Button>
        <Button 
          startIcon={<ImageIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' },
            py: 1.5,
            minHeight: 'auto'
          }}
          onClick={handleImageGeneration}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            width: '100%',
            gap: 1,
            flexWrap: 'nowrap'
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                color: '#222',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1
              }}
            >
              Image Gen Prompts
            </Typography>
            <Box component="span" sx={{ 
              bgcolor: '#9c27b0', 
              color: '#fff', 
              borderRadius: 1, 
              px: 0.75, 
              py: 0.25,
              fontSize: { xs: 9, md: 10 },
              fontWeight: 'bold',
              letterSpacing: 0.5,
              flexShrink: 0,
              minWidth: 'auto'
            }}>
              NEW
            </Box>
          </Box>
        </Button>
        <Button 
          startIcon={<BoltIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' } 
          }}
        >
          Prompt Improver 
          <Box component="span" sx={{ 
            bgcolor: '#ff5252', 
            color: '#fff', 
            borderRadius: 1, 
            px: 1, 
            ml: 1, 
            fontSize: { xs: 10, md: 12 } 
          }}>
            NEW
          </Box>
        </Button>
        <Button 
          startIcon={<GroupsIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' } 
          }}
        >
          Community 
          <Box component="span" sx={{ 
            bgcolor: '#eee', 
            color: '#888', 
            borderRadius: 1, 
            px: 1, 
            ml: 1, 
            fontSize: { xs: 10, md: 12 } 
          }}>
            Coming Soon
          </Box>
        </Button>
        <Button 
          startIcon={<SchoolIcon />} 
          fullWidth 
          sx={{ 
            justifyContent: 'flex-start', 
            mb: 1, 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 500, 
            color: '#222',
            fontSize: { xs: '0.875rem', md: '1rem' },
            '&:hover': { bgcolor: '#f5f5f5' } 
          }}
        >
          Learn 
          <Box component="span" sx={{ 
            bgcolor: '#e3f2fd', 
            color: '#1976d2', 
            borderRadius: 1, 
            px: 1, 
            ml: 1, 
            fontSize: { xs: 10, md: 12 } 
          }}>
            Explore
          </Box>
        </Button>
      </Box>
      <Paper elevation={2} sx={{ 
        bgcolor: '#f5faff', 
        borderRadius: 3, 
        p: { xs: 1.5, md: 2 }, 
        mb: 2, 
        mx: { xs: 1, md: 2 } 
      }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{
          fontSize: { xs: '0.7rem', md: '0.75rem' }
        }}>
          STATS
        </Typography>
        <Box sx={{ 
          bgcolor: '#e3f2fd', 
          color: '#1976d2', 
          borderRadius: 2, 
          p: 1, 
          mt: 1, 
          mb: 1, 
          textAlign: 'center', 
          fontWeight: 600, 
          fontSize: { xs: 13, md: 15 } 
        }}>
          <span role="img" aria-label="cloud">☁️</span> No Streak Yet!
        </Box>
        <Box sx={{ 
          bgcolor: '#fff8e1', 
          color: '#ffb300', 
          borderRadius: 2, 
          p: 1, 
          textAlign: 'center', 
          fontWeight: 600, 
          fontSize: { xs: 13, md: 15 } 
        }}>
          <span role="img" aria-label="trophy">🏆</span> 0 Challenges Completed!
        </Box>
      </Paper>
      <Paper elevation={2} sx={{ 
        bgcolor: '#fffbe7', 
        borderRadius: 3, 
        p: { xs: 1.5, md: 2 }, 
        mb: 2, 
        mx: { xs: 1, md: 2 }, 
        textAlign: 'center' 
      }}>
        <Typography variant="body2" fontWeight="bold" color="#ff9800" sx={{
          fontSize: { xs: '0.875rem', md: '1rem' }
        }}>
          Become a Super Learner
        </Typography>
        <Button 
          variant="contained" 
          color="warning" 
          fullWidth 
          sx={{ 
            mt: 1, 
            borderRadius: 2, 
            fontWeight: 700,
            fontSize: { xs: '0.875rem', md: '1rem' }
          }}
        >
          Try for 7 Days Free
        </Button>
      </Paper>
    </>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={toggleSidebar}
          sx={{
            position: 'fixed',
            top: 16,
            left: 'auto',
            right: 16,
            zIndex: 1200,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: 'white' }
          }}
        >
          <MenuIcon />
        </IconButton>
        {isOpen && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1100
            }}
            onClick={toggleSidebar}
          />
        )}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: isOpen ? 0 : '-100%',
            width: '80%',
            maxWidth: 300,
            height: '100vh',
            bgcolor: 'background.paper',
            zIndex: 1150,
            transition: 'left 0.3s ease-in-out',
            boxShadow: 2,
            display: 'flex',
            flexDirection: 'column',
            pt: 6,
          }}
        >
          <Box sx={{ flex: 1, overflowY: 'auto', pb: 10 }}>
            {sidebarContent}
          </Box>
          {isOpen && (
            <Box sx={{
              position: 'fixed',
              left: 0,
              bottom: 0,
              width: '80%',
              maxWidth: 300,
              bgcolor: '#fafbfc',
              borderTop: '1px solid #eee',
              py: 2,
              zIndex: 1201,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: '#888', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  {name}
                </Typography>
                <Button onClick={onLogout} sx={{ minWidth: 0, p: 0, ml: 1 }}>
                  <LogoutIcon sx={{ color: '#888', fontSize: 18 }} />
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </>
    );
  }

  return (
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
      <Box sx={{ flex: 1, overflowY: 'auto' }}>{sidebarContent}</Box>
      <Box sx={{
        textAlign: 'center',
        py: 3,
        borderTop: '1px solid #eee',
        bgcolor: '#fafbfc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: '#888', fontSize: 22 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
          <Button onClick={onLogout} sx={{ minWidth: 0, p: 0, ml: 1 }}><LogoutIcon sx={{ color: '#888' }} /></Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LeftSidebar; 