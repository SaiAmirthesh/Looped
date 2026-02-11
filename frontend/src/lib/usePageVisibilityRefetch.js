// usePageVisibilityRefetch.js - REPLACE

import { useEffect, useRef } from 'react';
import { waitForSupabaseReady } from './supabaseClient';

export function usePageVisibilityRefetch(refetch) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const isRefetchingRef = useRef(false);

  useEffect(() => {
    if (typeof refetchRef.current !== 'function') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isRefetchingRef.current) {
        console.log('🔄 Page visible - waiting for Supabase recovery');
        isRefetchingRef.current = true;
        
        try {
          // CRITICAL: Wait for Supabase auto-recovery to complete
          const ready = await waitForSupabaseReady();
          
          if (!ready) {
            console.error('❌ Supabase not ready, skipping refetch');
            return;
          }
          
          console.log('🔄 Refetching data...');
          await refetchRef.current();
          console.log('✅ Refetch complete');
        } catch (error) {
          console.error('❌ Refetch failed:', error);
        } finally {
          isRefetchingRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}