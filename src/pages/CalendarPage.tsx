import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import "../components/LeftSidebar.css"; // Reuse sidebar styles for consistency
import { useNavigate } from "react-router-dom";

const today = new Date();

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
  Image?: any[];
  Day?: string;
}


const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed, 5 = June
  const [currentYear, setCurrentYear] = useState(2025);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const promptPalAuth = localStorage.getItem("promptPalAuth");
        const userId = JSON.parse(promptPalAuth || "{}").userId;
        const res = await axios.get(`${API_BASE}/users/${userId}/tasks`);
        console.log(res.data.data);
        setTasks(res.data.data || []);
      } catch {
        setError("Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

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

  // Mark days with tasks (for now, just highlight them)
  const daysWithTasks = tasks
    .filter(task => {
      if (typeof task.Day === "string") {
        const date = new Date(task.Day);
        // Check if this task is in the current month and year
        return (
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth
        );
      }
      return false;
    })
    .map(task => {
      if (typeof task.Day === "string") {
        return new Date(task.Day).getDate();
      }
      return -1; // or skip, or handle as needed
    })
    .filter(day => day > 0);

  console.log(daysWithTasks);
    

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

  const handleDayClick = (day: number) => {
    const taskForDay = tasks.find(task => {
      if (typeof task.Day === "string") {
        const date = new Date(task.Day);
        return (
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth &&
          date.getDate() === day
        );
      }
      return false;
    });

    if (taskForDay) {
      navigate(`/task/${taskForDay.id}`);
    }
  };

  return (
    <div style={{background: "#fdf7ef", minHeight: "100vh" }}>
      <div style={{ maxWidth: '100vw', maxHeight: '100vh', background: "#fff7e6", borderRadius: 24, boxShadow: "0 2px 8px #f4e2c6", padding: 32 }}>
        <h2 style={{ textAlign: "center", fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Select Challenge By Date</h2>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
          <button onClick={handlePrevMonth} style={{ background: "#fff", border: "1px solid #e0c9a6", borderRadius: "50%", width: 40, height: 40, fontSize: 24, cursor: "pointer", color: "#d6a16d", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 16 }}>&lt;</button>
          <span style={{ fontWeight: 600, fontSize: 20, margin: "0 24px" }}>{monthNames[currentMonth]} {currentYear}</span>
          <button onClick={handleNextMonth} style={{ background: "#fff", border: "1px solid #e0c9a6", borderRadius: "50%", width: 40, height: 40, fontSize: 24, cursor: "pointer", color: "#d6a16d", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 16 }}>&gt;</button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", margin: 32 }}>Loading tasks...</div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "red", margin: 32 }}>{error}</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0, marginBottom: 8, textAlign: "center", color: "#bfa77a", fontWeight: 600 }}>
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
              {weeks.map((week, wi) =>
                week.map((d, di) => {
                  const hasTask = d && daysWithTasks.includes(d);
                  return d ? (
                    <div
                      key={wi + "-" + di}
                      onClick={hasTask ? () => handleDayClick(d) : undefined}
                      style={{
                        height: 70,
                        minHeight: 70,
                        borderRadius: 10,
                        background: hasTask ? "#f7f6f4" : "#f0f0f0",
                        border: hasTask ? "1px solid #e0c9a6" : "1px solid #e0e0e0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: 18,
                        color: hasTask ? (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "#bfa77a" : "#888") : "#ccc",
                        position: "relative",
                        margin: 4,
                        boxSizing: "border-box",
                        boxShadow: hasTask && d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? "0 2px 8px #f4e2c6" : "none",
                        transition: "background 0.2s, border 0.2s",
                        cursor: hasTask ? "pointer" : "not-allowed",
                        opacity: hasTask ? 1 : 0.5
                      }}
                    >
                      <span>{d}</span>
                      {hasTask && (
                        <span style={{ color: "#e57373", fontSize: 22, position: "absolute", bottom: 6 }}>✗</span>
                      )}
                    </div>
                  ) : (
                    <div key={wi + "-" + di}></div>
                  );
                })
              )}
            </div>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32, fontSize: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#4caf50", fontSize: 22 }}>✔</span> Solved Challenge
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#e57373", fontSize: 22 }}>✗</span> Not Started
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 