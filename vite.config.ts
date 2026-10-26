import { createHash } from 'node:crypto';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Adds a Content-Security-Policy to the production build only (the dev server
 * relies on inline scripts for hot reloading). Inline scripts are allowed by hash.
 */
const contentSecurityPolicy = (supabaseUrl: string): Plugin => ({
  name: 'icthub-csp',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
        ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
      );
      const supabase = new URL(supabaseUrl);
      const policy = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`,
        // The rich-text editor and react-hot-toast set inline styles.
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        `connect-src 'self' ${supabase.origin} wss://${supabase.host} https://ipwho.is`,
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), ...(env.VITE_SUPABASE_URL ? [contentSecurityPolicy(env.VITE_SUPABASE_URL)] : [])],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          // Vendor code changes rarely; separate chunks stay cached across deploys.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
