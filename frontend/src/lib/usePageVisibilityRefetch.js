/**
 * Refetches data when the user returns to the tab (e.g. after Alt+Tab or switching websites).
 * Fixes "stuck loading" when the tab was backgrounded and Supabase/API connections went stale.
 */
import { useEffect } from 'react';

export function usePageVisibilityRefetch(refetch) {
  useEffect(() => {
    if (typeof refetch !== 'function') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);
}
