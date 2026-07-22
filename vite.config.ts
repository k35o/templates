import { fmt, test, typescript } from '@k8o/oxc-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ...fmt,
    // pnpm's release management owns CHANGELOG.md and .changeset/ (ledger.yaml
    // etc.), so our formatting rules must not touch them
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md', '.changeset'],
  },
  lint: {
    extends: [typescript],
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md', '.changeset'],
    options: {
      typeAware: true,
    },
    overrides: [
      {
        files: ['**/*.test.ts'],
        plugins: [...(test.plugins ?? [])],
        rules: test.rules ?? {},
      },
    ],
  },
  pack: {
    // Bundle the TS bin + its local imports into one ESM file. Node refuses to
    // strip types for files under node_modules, so the published bin must be
    // JavaScript (bingo / zod stay external and are installed as deps).
    entry: ['bin/index.ts'],
    format: 'esm',
    outDir: 'dist',
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  staged: {
    '*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc}': 'vp check --fix',
  },
});
