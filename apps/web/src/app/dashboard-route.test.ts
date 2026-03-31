import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

describe('dashboard route structure', () => {
  it('exposes a concrete /dashboard page module', () => {
    const dashboardPagePath = path.resolve(currentDir, '(dashboard)', 'dashboard', 'page.tsx');

    expect(existsSync(dashboardPagePath)).toBe(true);
  });
});
