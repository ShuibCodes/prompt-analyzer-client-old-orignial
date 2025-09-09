// src/components/MobileDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Fab, Snackbar, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import SwipeableTaskCard from './SwipeableTaskCard';
import { useSwipeGestures } from '../hooks/useSwipeGestures';

interface Task {
  id: string;
  name: string;
  question: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  completed?: boolean;
  score?: number;
  Image?: Array<{
    imageQuestion?: {
      formats?: {
        thumbnail?: { url: string };
      };
    };
  }>;
}

interface MobileDashboardProps {
  tasks: Task[];
  currentTaskIndex: number;
  onTaskChange: (index: number) => void;
  onTaskSelect: (task: Task) => void;
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    completedTasks: number;
  } | undefined;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  tasks,
  currentTaskIndex,
  onTaskChange,
  onTaskSelect,
  streakData
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [swipeHint, setSwipeHint] = useState<string | null>(null);

  // Show instructions for first-time users
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenSwipeInstructions');
    if (!hasSeenInstructions) {
      setShowInstructions(true);
      setTimeout(() => {
        setShowInstructions(false);
        localStorage.setItem('hasSeenSwipeInstructions', 'true');
      }, 3000);
    }
  }, []);

  // Swipe between tasks
  const taskSwipeProps = useSwipeGestures({
    onSwipeLeft: () => {
      if (currentTaskIndex < tasks.length - 1) {
        onTaskChange(currentTaskIndex + 1);
        setSwipeHint('Next task!');
        setTimeout(() => setSwipeHint(null), 1000);
      }
    },
    onSwipeRight: () => {
      if (currentTaskIndex > 0) {
        onTaskChange(currentTaskIndex - 1);
        setSwipeHint('Previous task!');
        setTimeout(() => setSwipeHint(null), 1000);
      }
    },
    threshold: 100,
  });

  const currentTask = tasks[currentTaskIndex];

  const handleShowHint = () => {
    // This would trigger hint display logic
    console.log('Show hint for task:', currentTask.id);
  };

  const handleToggleFavorite = () => {
    // This would toggle favorite status
    console.log('Toggle favorite for task:', currentTask.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Prompt Pal Challenge: ${currentTask.name}`,
          text: currentTask.question,
          url: window.location.href,
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback for browsers without native sharing
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          `Check out this Prompt Pal challenge: ${currentTask.name}\n\n${currentTask.question}\n\n${window.location.href}`
        );
        setSwipeHint('Link copied to clipboard!');
        setTimeout(() => setSwipeHint(null), 2000);
      }
    }
  };

  return (
    <Box className="mobile-dashboard-container">
      {/* Enhanced Header with Swipe Hints */}
      <Box className="mobile-dashboard-header" sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Zap size={24} color="#667eea" />
          <Typography variant="h6" fontWeight="bold" color="#667eea">
            Daily Challenge
          </Typography>
        </Box>
        
        {/* Task Navigation Indicators */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {tasks.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentTaskIndex ? '#667eea' : '#e0e0e0',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>

        {/* Swipe Navigation Arrows */}
        <Box sx={{ 
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          px: 2,
        }}>
          {currentTaskIndex > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.5, x: 0 }}
              style={{ pointerEvents: 'auto' }}
            >
              <ArrowLeft size={20} color="#667eea" />
            </motion.div>
          )}
          {currentTaskIndex < tasks.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.5, x: 0 }}
              style={{ pointerEvents: 'auto', marginLeft: 'auto' }}
            >
              <ArrowRight size={20} color="#667eea" />
            </motion.div>
          )}
        </Box>
      </Box>

      {/* Stats Bar */}
      {streakData && (
        <div className="mobile-stats-bar">
          <div className="mobile-stat-card" style={{ '--accent-color': '#ef4444' } as React.CSSProperties}>
            <span className="mobile-stat-icon">🔥</span>
            <div className="mobile-stat-value">{streakData.currentStreak}</div>
            <div className="mobile-stat-label">Day Streak</div>
          </div>
          <div className="mobile-stat-card" style={{ '--accent-color': '#22c55e' } as React.CSSProperties}>
            <span className="mobile-stat-icon">🏆</span>
            <div className="mobile-stat-value">{streakData.longestStreak}</div>
            <div className="mobile-stat-label">Best</div>
          </div>
          <div className="mobile-stat-card" style={{ '--accent-color': '#3b82f6' } as React.CSSProperties}>
            <span className="mobile-stat-icon">📝</span>
            <div className="mobile-stat-value">{streakData.completedTasks}</div>
            <div className="mobile-stat-label">Total</div>
          </div>
        </div>
      )}

      {/* Swipeable Task Container */}
      <Box 
        {...taskSwipeProps}
        sx={{ 
          flex: 1, 
          overflow: 'hidden',
          position: 'relative',
          px: 2,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTaskIndex}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {currentTask && (
              <SwipeableTaskCard
                task={currentTask}
                onShowHint={handleShowHint}
                onToggleFavorite={handleToggleFavorite}
                onShare={handleShare}
                onSelect={() => onTaskSelect(currentTask)}
                showSwipeInstructions={showInstructions}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          zIndex: 1000,
        }}
        onClick={() => onTaskSelect(currentTask)}
      >
        <Zap size={24} />
      </Fab>

      {/* Swipe Hints and Instructions */}
      <Snackbar
        open={!!swipeHint}
        autoHideDuration={1500}
        onClose={() => setSwipeHint(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" sx={{ fontWeight: 'bold' }}>
          {swipeHint}
        </Alert>
      </Snackbar>

      {/* First-time Instructions */}
      <Snackbar
        open={showInstructions}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          variant="filled"
          sx={{ 
            bgcolor: '#667eea',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 3,
          }}
        >
          💡 Swipe left for hints, right for favorites, up to share!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MobileDashboard;