import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 is a Vite plugin. There is no tailwind.config.js and no
// postcss.config.js — theme tokens live in src/index.css under @theme.
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // @spendwise/shared is an npm workspace symlinked to ../shared, which is
    // outside the Vite project root, so file access must be widened to reach it.
    fs: { allow: ['..'] },
    // Deliberately NO dev proxy for /api.
    //
    // A proxy would make requests same-origin in development, so CORS and
    // cookie settings would go untested until deployment — exactly the trap
    // ARCHITECTURE.md §5.7 flags. Calling the API on its real origin means a
    // misconfiguration fails immediately, on day one, instead of at deploy.
  },
});
