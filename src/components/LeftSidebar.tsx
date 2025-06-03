import React from "react";
import {
  Zap,
  Calendar,
  Sparkles,
  Image,
  Lightbulb,
  Award,
  User,
  LogOut,
  ExternalLink
} from "lucide-react";
import { useLocation } from "react-router-dom";
import "./LeftSidebar.css";

interface LeftSidebarProps {
  userName?: string;
  userInitials?: string;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ userName = "Regi Loshi", userInitials = "RL", onLogout }) => {
  const location = useLocation();
  return (
    <div className="sidebar-fixed">
      <div className="sidebar-logo-wrap">
        <div className="sidebar-logo-text">Prompt Pal</div>
      </div>
      <nav className="sidebar-nav">
        <a
          className={`sidebar-link${location.pathname === "/dashboard" ? " active" : ""}`}
          href="/dashboard"
        >
          <Zap size={24} color="#111" /> Daily Challenge
        </a>
        <div className="sidebar-link">
          <Calendar size={24} color="#111" /> All Challenges
        </div>
        <div className="sidebar-link">
          <Sparkles size={24} color="#111" />
          Prompt Improver
          <span className="sidebar-badge sidebar-badge-new">NEW</span>
        </div>
        <a
          className={`sidebar-link${location.pathname === "/image-generation" ? " active" : ""}`}
          href="/image-generation"
        >
          <Image size={24} color="#111" />
          Image Prompts
        </a>
        <div className="sidebar-link">
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
        <div className="sidebar-streak">
          <span role="img" aria-label="ice">🥶</span>
          <span>No Streak Yet!</span>
        </div>
        <div className="sidebar-challenges">
          <Award size={48} color="#111" />
          <span className="sidebar-challenges-badge">0</span>
          <span>Challenges Completed!</span>
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
            <a href="/profile" className="sidebar-user-action">
              <User size={16} color="#111" /> Profile
            </a>
            <div className="sidebar-user-action" onClick={onLogout}>
              <LogOut size={16} color="#111" /> Logout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar; 