import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['../middleware/**/*.{test,spec}.js', 'src/**/*.{test,spec}.{js,jsx}'],
    environment: 'node',
  },
})
