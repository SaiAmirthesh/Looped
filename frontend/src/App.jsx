import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { UserProfileProvider } from './context/UserProfileContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import HabitsPage from './pages/HabitsPage';
import SkillsPage from './pages/SkillsPage';
import QuestsPage from './pages/QuestsPage';
import FocusPage from './pages/FocusPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <UserProfileProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/habits" element={session ? <HabitsPage /> : <Navigate to="/login" replace />} />
          <Route path="/skills" element={session ? <SkillsPage /> : <Navigate to="/login" replace />} />
          <Route path="/quests" element={session ? <QuestsPage /> : <Navigate to="/login" replace />} />
          <Route path="/focus" element={session ? <FocusPage /> : <Navigate to="/login" replace />} />
          <Route path="/calendar" element={session ? <CalendarPage /> : <Navigate to="/login" replace />} />
          <Route path="/leaderboard" element={session ? <LeaderboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProfileProvider>
  );
}

export default App;
