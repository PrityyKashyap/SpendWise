import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Tailwind v4 is a Vite plugin. There is no tailwind.config.js and no
// postcss.config.js — theme tokens live in src/index.css under @theme.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      // 'prompt', not 'autoUpdate'. An automatic update reloads the page the
      // moment a new build lands, which on a finance app can throw away a
      // half-typed expense. The user is asked instead (PwaUpdatePrompt.jsx).
      registerType: 'prompt',

      // Registration is done by hand in PwaUpdatePrompt so the update and
      // offline-ready states drive real UI rather than a console message.
      injectRegister: null,

      manifest: {
        name: 'SpendWise',
        short_name: 'SpendWise',
        description: 'Smart personal finance and expense tracking',
        // Launching an installed app onto the marketing page would feel wrong;
        // /dashboard is the app. Logged-out users are redirected to /login by
        // the existing route guard, which is the correct app behaviour.
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#171B4D',
        background_color: '#F8FAFC',
        categories: ['finance', 'productivity'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Separate entry: a maskable icon is padded for the OS to crop, so
          // reusing it as 'any' would render the mark visibly too small.
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // The app shell only: JS, CSS, HTML and icons. Everything in public/
        // is copied into dist, so this already covers the icons — listing them
        // again under includeAssets would precache each one twice.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],

        // The charting library is ~420KB across six lazily-loaded chunks, and
        // every chart it draws needs API data that is unavailable offline
        // anyway. Precaching them would nearly double the install size to buy
        // the ability to render an empty chart.
        globIgnores: ['**/assets/*Chart-*.js'],

        // Deep links must resolve to the SPA shell when offline, exactly as the
        // SPA rewrite does on the server.
        navigateFallback: '/index.html',
        // /api is the backend's prefix. It is a different origin in every
        // deployment, but denying it here means a same-origin proxy added later
        // cannot accidentally start serving the app shell in place of JSON.
        navigateFallbackDenylist: [/^\/api\//],

        /*
         * Deliberately NO runtimeCaching.
         *
         * Everything under /api is somebody's financial history. With no rule
         * matching it, the service worker does not touch those requests at all:
         * they go to the network, and when the network is gone they fail
         * honestly. A cached balance is worse than no balance — it is a wrong
         * number presented as a current one, and a cached response would also
         * outlive logout in the browser's storage.
         */
        cleanupOutdatedCaches: true,
        // Do not take over the page mid-session; the update prompt does that
        // only when the user agrees.
        skipWaiting: false,
        clientsClaim: false,
      },

      // A service worker in dev caches stale modules and makes HMR behave
      // strangely; it is the production build that needs testing anyway.
      devOptions: { enabled: false },
    }),
  ],

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
