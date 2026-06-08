import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Конфиг только для тестов. esbuild.jsx: 'automatic' нужен, потому что vitest
// транслирует JSX через esbuild (в отличие от dev/build на oxc) и без этого
// требовал бы ручной импорт React в каждом файле.
export default defineConfig({
  plugins: [react()],
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
