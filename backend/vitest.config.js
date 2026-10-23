import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: { DEMO: 'true', JWT_SECRET: 'test-secret' },
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
})
