import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'looped-auth-token',
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Track if Supabase is ready after visibility change
let isRecovering = false;
let recoveryPromise = null;

/**
 * Wait for Supabase to complete its auto-recovery after tab becomes visible
 */
export const waitForSupabaseReady = async () => {
    // If already recovering, wait for that to complete
    if (recoveryPromise) {
        console.log('🔌 Waiting for existing recovery...');
        return await recoveryPromise;
    }
    
    if (isRecovering) {
        console.log('🔌 Recovery in progress, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
    }
    
    isRecovering = true;
    
    recoveryPromise = new Promise(async (resolve) => {
        console.log('🔌 Waiting for Supabase ready state...');
        
        // Give Supabase time to auto-recover (it does this on visibility change)
        await new Promise(r => setTimeout(r, 1500));
        
        // Now verify we have a valid session
        let sessionValid = false;
        for (let i = 0; i < 3; i++) {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (session && !error) {
                    console.log('🔌 Supabase is ready!');
                    sessionValid = true;
                    break;
                }
            } catch (err) {
                console.log(`🔌 Check ${i + 1} failed, retrying...`);
            }
            await new Promise(r => setTimeout(r, 500));
        }
        
        isRecovering = false;
        recoveryPromise = null;
        resolve(sessionValid);
    });
    
    return await recoveryPromise;
};