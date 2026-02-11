import { useRef, useCallback } from 'react';

/**
 * Returns a debounced version of the callback.
 * Rapid calls within `delay` ms only trigger the last one.
 * Reduces duplicate API requests from visibility + realtime + auth firing together.
 */
export function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      callbackRef.current(...args);
    }, delay);
  }, [delay]);
}
