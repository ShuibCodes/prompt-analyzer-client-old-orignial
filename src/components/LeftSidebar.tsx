import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Calendar,
  Sparkles,
  Image,
  Lightbulb,
  Award,
  User,
  LogOut,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useStreak } from "../contexts/StreakContext";
import "./LeftSidebar.css";

interface LeftSidebarProps {
  userName?: string;
  userInitials?: string;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userName = "Regi Loshi", userInitials = "RL", onLogout }) => {
  const location = useLocation();
  const { streakData, loading, error } = useStreak();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isMobileMenuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return "🥶";
    return "🔥"; // Fire emoji for any active streak
  };

  const getStreakStyle = (streak: number) => {
    if (streak === 0) {
      return {
        backgroundColor: '#3b82f6', // Blue background for no streak
        color: 'white',
      };
    } else {
      return {
        backgroundColor: '#ef4444', // Red background for active streak
        color: 'white',
      };
    }
  };

  const getChallengesBadgeColor = (completed: number) => {
    if (completed === 0) return "#6b7280";
    if (completed >= 50) return "#f59e0b";
    if (completed >= 20) return "#8b5cf6";
    if (completed >= 10) return "#3b82f6";
    return "#10b981";
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar-fixed ${isMobile ? (isMobileMenuOpen ? 'mobile-open' : 'mobile-closed') : ''}`}
      >
        <div className="sidebar-logo-wrap">
          <div className="sidebar-logo-text">Prompt Pal</div>
        </div>
        <nav className="sidebar-nav">
          <a
            className={`sidebar-link${location.pathname === "/dashboard" ? " active" : ""}`}
            href="/dashboard"
            onClick={handleLinkClick}
          >
            <Zap size={24} color="#111" /> Daily Challenge
          </a>
          <a
            className={`sidebar-link${location.pathname === "/calendar" ? " active" : ""}`}
            href="/calendar"
            onClick={handleLinkClick}
          >
            <Calendar size={24} color="#111" /> All Challenges
          </a>
          <div className="sidebar-link" onClick={handleLinkClick}>
            <Sparkles size={24} color="#111" />
            Prompt Improver
            <span className="sidebar-badge sidebar-badge-new">NEW</span>
          </div>
          <a
            className={`sidebar-link${location.pathname === "/image-generation" ? " active" : ""}`}
            href="/image-generation"
            onClick={handleLinkClick}
          >
            <Image size={24} color="#111" />
            Image Prompts
          </a>
          <div className="sidebar-link" onClick={handleLinkClick}>
            <Lightbulb size={24} color="#111" />
            Learn
            <span className="sidebar-badge sidebar-badge-explore">
              Explore <ExternalLink size={14} color="#111" style={{ marginLeft: 4 }} />
            </span>
          </div>
        </nav>
        <div className="sidebar-stats">
          <div className="sidebar-divider">
            <span>STATS</span>
          </div>
          
          {/* Dynamic Streak Section */}
          <div 
            className="sidebar-streak"
            style={!loading && !error ? getStreakStyle(streakData?.currentStreak || 0) : {}}
          >
            {loading ? (
              <>
                <span role="img" aria-label="loading">⏳</span>
                <span>Loading streak...</span>
              </>
            ) : error ? (
              <>
                <span role="img" aria-label="error">❌</span>
                <span>Error loading streak</span>
              </>
            ) : (
              <>
                <span role="img" aria-label="streak">
                  {getStreakEmoji(streakData?.currentStreak || 0)}
                </span>
                <span>
                  {(streakData?.currentStreak || 0) === 0 
                    ? "No Streak Yet!" 
                    : `${streakData?.currentStreak} day streak!`
                  }
                </span>
              </>
            )}
          </div>
          
          {/* Dynamic Challenges Section */}
          <div className="sidebar-challenges">
            <Award size={48} color="#111" />
            <span 
              className="sidebar-challenges-badge"
              style={{ 
                backgroundColor: getChallengesBadgeColor(streakData?.completedTasks || 0),
                color: 'white'
              }}
            >
              {loading ? "..." : (streakData?.completedTasks || 0)}
            </span>
            <span>
              {loading ? "Loading..." : 
               (streakData?.completedTasks || 0) === 1 ? "Challenge Completed!" :
               "Challenges Completed!"}
            </span>
            {!loading && streakData && streakData.completedTasks > 0 && (
              <div style={{ 
                fontSize: '11px', 
                color: '#6b7280', 
                marginTop: '2px' 
              }}>
                {streakData.completedTasks >= 50 ? "Master Prompter! 🏆" :
                 streakData.completedTasks >= 20 ? "Expert Level! 💎" :
                 streakData.completedTasks >= 10 ? "Getting good! 🚀" :
                 streakData.completedTasks >= 5 ? "Nice progress! ⭐" :
                 "Keep it up! 💪"}
              </div>
            )}
          </div>
        </div>
        <div className="sidebar-promo">
          <div className="sidebar-promo-content">
            <span className="sidebar-promo-title">Become a Super Learner</span>
            <button className="sidebar-promo-btn">Try for 7 Days Free</button>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitials}</div>
          <div className="sidebar-user-details">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-actions">
              <a href="/profile" className="sidebar-user-action" onClick={handleLinkClick}>
                <User size={16} color="#111" /> Profile
              </a>
              <div className="sidebar-user-action" onClick={() => { handleLinkClick(); onLogout(); }}>
                <LogOut size={16} color="#111" /> Logout
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSidebar; 