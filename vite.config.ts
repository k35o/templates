import { fmt, test, typescript } from '@k8o/oxc-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ...fmt,
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md'],
  },
  lint: {
    extends: [typescript],
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md'],
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
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  staged: {
    '*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc}': 'vp check --fix',
  },
});
