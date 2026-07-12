import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // GEMINI_API_KEY is intentionally never defined here: it must only ever
      // exist as a Supabase Edge Function secret (`supabase secrets set
      // GEMINI_API_KEY=...`), never in a client bundle. SUPABASE_ANON_KEY is
      // safe to ship to the client -- it's meaningless without RLS, which is
      // what actually protects the data.
      define: {
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
