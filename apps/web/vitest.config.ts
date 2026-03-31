import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@sistema-odontologico/auth-core': fileURLToPath(
        new URL('../../packages/auth-core/src/index.ts', import.meta.url),
      ),
      '@sistema-odontologico/permissions': fileURLToPath(
        new URL('../../packages/permissions/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    passWithNoTests: true,
  },
});
