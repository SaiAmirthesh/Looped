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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully');
          setSession(currentSession);
        }
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setSession(null);
        }
      }
    );

    let isRefreshing = false;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isRefreshing) {
        console.log('👁️ Page visible - forcing connection refresh');
        
        isRefreshing = true;
        
        try {
          // NUCLEAR OPTION: Force reconnect Supabase realtime
          await supabase.realtime.disconnect();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get session with short timeout
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 2000)
          );
          
          try {
            const { data: { session: currentSession } } = await Promise.race([
              sessionPromise, 
              timeoutPromise
            ]);
            
            if (currentSession) {
              setSession(currentSession);
              console.log('✅ Session recovered');
            }
          } catch (timeoutErr) {
            console.log('⚠️ Session check timed out, triggering refresh');
            // Force a refresh to recover
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession) {
              setSession(refreshedSession);
              console.log('✅ Session refreshed after timeout');
            }
          }
          
          // Reconnect realtime
          await supabase.realtime.connect();
          
        } catch (error) {
          console.error('❌ Visibility recovery error:', error);
        } finally {
          setTimeout(() => {
            isRefreshing = false;
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
