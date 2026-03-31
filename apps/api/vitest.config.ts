import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${resolve(rootDir, 'src')}/` },
      { find: '@sistema-odontologico/audit-core', replacement: resolve(rootDir, '../../packages/audit-core/src/index.ts') },
      { find: '@sistema-odontologico/auth-core', replacement: resolve(rootDir, '../../packages/auth-core/src/index.ts') },
      { find: '@sistema-odontologico/permissions', replacement: resolve(rootDir, '../../packages/permissions/src/index.ts') },
      { find: '@sistema-odontologico/tenancy-core', replacement: resolve(rootDir, '../../packages/tenancy-core/src/index.ts') },
      { find: '@sistema-odontologico/types', replacement: resolve(rootDir, '../../packages/types/src/index.ts') },
      { find: '@sistema-odontologico/validation', replacement: resolve(rootDir, '../../packages/validation/src/index.ts') },
    ],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.ts'],
    globals: true,
  },
});
