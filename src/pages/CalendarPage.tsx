import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "../components/LeftSidebar.css"; // Reuse sidebar styles for consistency
import { useNavigate } from "react-router-dom";
import { usePullToRefreshWithFeedback } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';

// Get current date
const today = new Date();
const todayYear = today.getFullYear();
const todayMonth = today.getMonth();
const todayDate = today.getDate();

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  // Returns 0 (Sunday) to 6 (Saturday)
  return new Date(year, month, 1).getDay();
}

interface Task {
  id: string;
  name: string;
  question: string;
  idealPrompt: string;
  Image?: unknown[];
  Day?: string;
}

interface CompletedTask {
  taskId: string;
  taskName: string;
  taskDay: string;
  score: number;
  percentageScore: number;
  attempts: number;
  completedAt: string;
}

interface CalendarPageProps {
  userId: string;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ userId }) => {
  // Set current month and year to today's date
  const [currentMonth, setCurrentMonth] = useState(todayMonth); // 0-indexed
  const [currentYear, setCurrentYear] = useState(todayYear);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const navigate = useNavigate();

  // Enhanced refresh handler with pull-to-refresh support
  const handleRefresh = useCallback(async () => {
    try {
      setError(null);
      
      // Refetch tasks and completed tasks
      const tasksPromise = axios.get(`${API_BASE}/users/${userId}/tasks`);
      const completedPromise = axios.get(`${API_BASE}/users/${userId}/completed-tasks`);
      
      const [tasksRes, completedRes] = await Promise.all([tasksPromise, completedPromise]);
      
      console.log('Refreshed tasks:', tasksRes.data.data);
      console.log('Refreshed completed tasks:', completedRes.data.data);
      
      setTasks(tasksRes.data.data || []);
      setCompletedTasks(completedRes.data.data || []);
      
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {
      console.error('Failed to refresh calendar data:', err);
      setError("Failed to refresh tasks");
      throw err;
    }
  }, [userId]);

  // Add pull-to-refresh setup
  const pullToRefreshProps = usePullToRefreshWithFeedback({
    onRefresh: handleRefresh,
    threshold: 70,
    maxDistance: 100,
    resistance: 0.7,
    showVisualFeedback: true,
    customMessages: {
      pulling: 'Pull to refresh calendar...',
      ready: 'Release to refresh!',
      refreshing: 'Updating tasks...',
    },
  });

  // Original data fetching logic
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch all tasks
        const tasksRes = await axios.get(`${API_BASE}/users/${userId}/tasks`);
        console.log('All tasks:', tasksRes.data.data);
        setTasks(tasksRes.data.data || []);

        // Fetch completed tasks
        const completedRes = await axios.get(`${API_BASE}/users/${userId}/completed-tasks`);
        console.log('Completed tasks:', completedRes.data.data);
        setCompletedTasks(completedRes.data.data || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError("Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth); // 0 = Sunday

  // Build weeks: each week is an array of 7 cells (null or day number)
  const weeks: (number | null)[][] = [];
  let day = 1;
  for (let w = 0; w < 6; w++) {
    const week: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if ((w === 0 && d < firstDayOfWeek) || day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day);
        day++;
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Add "Go to Today" function
  const goToToday = () => {
    setCurrentMonth(todayMonth);
    setCurrentYear(todayYear);
  };

  // Get task status for a specific day
  const getTaskStatusForDay = (day: number) => {
    // Check if there's a task for this day
    const taskForDay = tasks.find(task => {
      if (typeof task.Day === "string") {
        const taskDate = new Date(task.Day);
        return (
          taskDate.getFullYear() === currentYear &&
          taskDate.getMonth() === currentMonth &&
          taskDate.getDate() === day
        );
      }
      return false;
    });

    if (!taskForDay) {
      return { hasTask: false, isCompleted: false, task: null, completedTask: null };
    }

    // Check if this task is completed
    const completedTask = completedTasks.find(completed => 
      completed.taskId === taskForDay.id
    );

    return {
      hasTask: true,
      isCompleted: !!completedTask,
      task: taskForDay,
      completedTask: completedTask || null
    };
  };

  const handleDayClick = (day: number) => {
    const status = getTaskStatusForDay(day);
    if (status.hasTask && status.task) {
      navigate(`/task/${status.task.id}`);
    }
  };

  // Check if a day is today
  const isToday = (day: number) => {
    return day === todayDate && 
           currentMonth === todayMonth && 
           currentYear === todayYear;
  };

  // Check if a day is in the past
  const isPastDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    return dayDate < today;
  };

  // Format task details for tooltip
  const formatTaskTooltip = (day: number) => {
    const status = getTaskStatusForDay(day);
    if (!status.hasTask || !status.task) return null;

    const task = status.task;
    const completedTask = status.completedTask;

    return (
      <div style={{
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        maxWidth: "300px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        zIndex: 1000,
        lineHeight: "1.4"
      }}>
        <div style={{ fontWeight: "600", marginBottom: "8px", color: "#ffd700" }}>
          {task.name}
        </div>
        <div style={{ marginBottom: "6px" }}>
          <strong>Status:</strong> {status.isCompleted ? "✅ Completed" : "❌ Not Started"}
        </div>
        {completedTask && (
          <>
            <div style={{ marginBottom: "4px" }}>
              <strong>Score:</strong> {completedTask.score.toFixed(1)}/5.0 ({completedTask.percentageScore}%)
            </div>
            <div style={{ marginBottom: "4px" }}>
              <strong>Attempts:</strong> {completedTask.attempts}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              Completed: {new Date(completedTask.completedAt).toLocaleDateString()}
            </div>
          </>
        )}
        {!completedTask && (
          <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
            Click to start this challenge
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      style={{
        background: "#fdf7ef", 
        minHeight: "100vh", 
        position: "relative",
        overflow: "auto"
      }}
      ref={pullToRefreshProps.containerRef as React.MutableRefObject<HTMLDivElement | null>}
      {...pullToRefreshProps}
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        refreshState={pullToRefreshProps.refreshState as 'refreshing' | 'ready' | 'pulling' | 'idle'}
        pullDistance={pullToRefreshProps.pullDistance}
        progressPercentage={pullToRefreshProps.progressPercentage}
        message={pullToRefreshProps.feedbackMessage}
      />
      
      <div style={{ 
        maxWidth: '100vw', 
        maxHeight: '100vh', 
        background: "#fff7e6", 
        borderRadius: 24, 
        boxShadow: "0 2px 8px #f4e2c6", 
        padding: 32,
        transform: pullToRefreshProps.isRefreshing 
          ? 'translateY(50px)' 
          : `translateY(${Math.min(pullToRefreshProps.pullDistance * 0.2, 15)}px)`,
        transition: pullToRefreshProps.isRefreshing 
          ? 'transform 0.3s ease' 
          : 'none',
      }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
          Challenge Calendar
        </h2>
        
        {/* Navigation Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16
        }}>
          <button 
            onClick={handlePrevMonth} 
            style={{ 
              background: "#fff", 
              border: "1px solid #e0c9a6", 
              borderRadius: "50%", 
              width: 40, 
              height: 40, 
              fontSize: 24, 
              cursor: "pointer", 
              color: "#d6a16d", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
          >
            &lt;
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexDirection: "column" }}>
            <span style={{ fontWeight: 600, fontSize: 20 }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={goToToday}
              style={{
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 16px",
                fontSize: 14,
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Go to Today
            </button>
          </div>
          
          <button 
            onClick={handleNextMonth} 
            style={{ 
              background: "#fff", 
              border: "1px solid #e0c9a6", 
              borderRadius: "50%", 
              width: 40, 
              height: 40, 
              fontSize: 24, 
              cursor: "pointer", 
              color: "#d6a16d", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}
          >
            &gt;
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: "center", margin: 32 }}>Loading tasks...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "red", margin: 32, background: "#ffebee", padding: 16, borderRadius: 8 }}>
            <strong>Error:</strong> {error}
            <br />
            <button 
              onClick={handleRefresh} 
              style={{ 
                marginTop: 8, 
                padding: "8px 16px", 
                background: "#f44336", 
                color: "white", 
                border: "none", 
                borderRadius: 4, 
                cursor: "pointer" 
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(7, 1fr)", 
              gap: 0, 
              marginBottom: 8, 
              textAlign: "center", 
              color: "#bfa77a", 
              fontWeight: 600 
            }}>
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            
            {/* Calendar grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
              {weeks.map((week, wi) =>
                week.map((d, di) => {
                  if (!d) {
                    return <div key={`${wi}-${di}`} style={{ height: 70, margin: 4 }}></div>;
                  }
                  
                  const status = getTaskStatusForDay(d);
                  const hasTask = status.hasTask;
                  const isCompleted = status.isCompleted;
                  const todayFlag = isToday(d);
                  const pastDay = isPastDay(d);
                  
                  // Dynamic styling based on status
                  let backgroundColor = "#f0f0f0"; // default (no task)
                  let borderColor = "#e0e0e0";
                  let textColor = "#ccc";
                  
                  if (hasTask) {
                    if (isCompleted) {
                      backgroundColor = "#e8f5e8"; // green for completed
                      borderColor = "#4caf50";
                      textColor = "#2e7d32";
                    } else {
                      backgroundColor = "#fff3e0"; // orange for available
                      borderColor = "#ff9800";
                      textColor = "#ef6c00";
                    }
                  }
                  
                  if (todayFlag) {
                    backgroundColor = "#e3f2fd"; // blue for today
                    borderColor = "#2196f3";
                    textColor = "#1976d2";
                  }
                  
                  return (
                    <div
                      key={`${wi}-${di}`}
                      onClick={hasTask ? () => handleDayClick(d) : undefined}
                      onMouseEnter={(e) => {
                        if (hasTask) {
                          setHoveredDay(d);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPosition({ 
                            x: rect.left + rect.width / 2, 
                            y: rect.top - 10 
                          });
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredDay(null);
                        setTooltipPosition(null);
                      }}
                      style={{
                        height: 70,
                        minHeight: 70,
                        borderRadius: 10,
                        background: backgroundColor,
                        border: `2px solid ${borderColor}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 18,
                        color: textColor,
                        position: "relative",
                        margin: 4,
                        boxSizing: "border-box",
                        boxShadow: todayFlag ? "0 4px 12px rgba(33, 150, 243, 0.3)" : "none",
                        transition: "all 0.2s ease",
                        cursor: hasTask ? "pointer" : "not-allowed",
                        opacity: pastDay && !hasTask ? 0.3 : 1,
                        transform: hasTask && hoveredDay === d ? "scale(1.05)" : "scale(1)"
                      }}
                    >
                      <span>{d}</span>
                      
                      {/* Today indicator */}
                      {todayFlag && (
                        <div style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "#2196f3",
                          color: "white",
                          fontSize: "8px",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          fontWeight: "bold"
                        }}>
                          TODAY
                        </div>
                      )}
                      
                      {/* Task status indicator */}
                      {hasTask && (
                        <span style={{ 
                          color: isCompleted ? "#4caf50" : "#ff9800", 
                          fontSize: 22, 
                          position: "absolute", 
                          bottom: 6 
                        }}>
                          {isCompleted ? "✓" : "○"}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
        
        {/* Legend */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: 32, 
          marginTop: 32, 
          fontSize: 16,
          flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, background: "#e3f2fd", border: "2px solid #2196f3", borderRadius: 4 }}></div>
            Today
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4caf50", fontSize: 22 }}>✓</span> Completed
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ff9800", fontSize: 22 }}>○</span> Available
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, background: "#f0f0f0", border: "2px solid #e0e0e0", borderRadius: 4 }}></div>
            No Task
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay !== null && tooltipPosition && (
        <div
          style={{
            position: "fixed",
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translateX(-50%) translateY(-100%)",
            pointerEvents: "none",
            zIndex: 1000,
            animation: "fadeIn 0.2s ease-in-out"
          }}
        >
          {formatTaskTooltip(hoveredDay)}
        </div>
      )}
      
      {/* CSS Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-100%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(-100%) translateY(0px);
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;