import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/src/**/*.test.ts', 'api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // lcov format required for Codecov integration
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['**/dist/**', '**/node_modules/**', '**/*.test.ts'],
      // Code coverage thresholds - CI will fail if below these
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
})
