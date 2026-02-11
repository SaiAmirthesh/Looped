import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { getUserProfile, createUserProfile } from './lib/supabaseAPI';
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

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session and initialize user profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Initialize user profile in database if logged in
      if (session?.user) {
        try {
          // Try to get existing profile
          await getUserProfile();
        } catch (error) {
          // Profile doesn't exist, create it
          console.log('Creating user profile...');
          try {
            await createUserProfile(session.user.id, session.user.email);
            console.log('User profile created successfully');
          } catch (createError) {
            console.error('Error creating user profile:', createError);
          }
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      // Initialize profile on sign in
      if (_event === 'SIGNED_IN' && session?.user) {
        try {
          await getUserProfile();
        } catch (error) {
          try {
            await createUserProfile(session.user.id, session.user.email);
          } catch (createError) {
            console.error('Error creating user profile:', createError);
          }
        }
      }
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

        <Route
          path="/dashboard"
          element={session ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/habits"
          element={session ? <HabitsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/skills"
          element={session ? <SkillsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/quests"
          element={session ? <QuestsPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/focus"
          element={session ? <FocusPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/calendar"
          element={session ? <CalendarPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={session ? <ProfilePage /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
