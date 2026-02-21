import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rqhxfwpmxaulcjjwpdnx.supabase.co';

// ✅ FIX ERR_HTTP2_PROTOCOL_ERROR :
// Le proxy Vite route les requêtes Supabase via HTTP/1.1
// Ce qui évite les erreurs HTTP/2 sur Windows/Chrome
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/supabase-api': {
        target: SUPABASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        secure: true,
        // Force HTTP/1.1 côté serveur de dev
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy error:', err.message);
          });
        },
      },
    },
  },
});
