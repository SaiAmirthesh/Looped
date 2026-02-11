// components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabase';

export function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check session on mount
    const checkSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setSession(null);
      } else if (currentSession) {
        // Verify session is still valid by refreshing it
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        setSession(refreshError ? null : refreshedSession);
      } else {
        setSession(null);
      }
      
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return session ? children : <Navigate to="/login" replace />;
}