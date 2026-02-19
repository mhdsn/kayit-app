import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: async (url, options) => {
      const TIMEOUT_MS = 8000;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        try {
          console.warn("⚠️  Supabase fetch retry...");
          await new Promise(r => setTimeout(r, 1000));

          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);

          const response = await fetch(url, {
            ...options,
            signal: controller2.signal,
          });

          clearTimeout(timeoutId2);
          return response;
        } catch (retryError: any) {
          console.error("❌ Supabase fetch échoué après retry");
          throw retryError;
        }
      }
    },
  },
});