import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// У бэкенда не настроен CORS, поэтому браузер не может ходить к нему напрямую.
// В дев-режиме проксируем /api на бэкенд (server-to-server, без CORS).
// В проде то же делает rewrite в vercel.json. Приложение всегда зовёт /api/* относительно.
const BACKEND = 'https://survey-system-with-ai-powered-results-xnhl.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true, secure: true },
    },
  },
})
