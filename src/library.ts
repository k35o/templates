import {
  coords,
  type GenerateOptions,
  GITIGNORE,
  INSTALL_ACTION,
  LICENSE,
  MISE_TOML,
  NPMRC,
  RELEASE_YML,
} from './shared.ts';
import { TOOLS, VERSIONS } from './versions.ts';

// Single-package repo: pnpm-workspace.yaml carries the supply-chain rules only.
const PNPM_WORKSPACE = `blockExoticSubdeps: true

minimumReleaseAge: 10080
minimumReleaseAgeExclude:
  - '@k8o/*'

strictDepBuilds: true

allowBuilds:
  esbuild: false

verifyDepsBeforeRun: install

saveExact: true
autoInstallPeers: false

versioning:
  changelog:
    storage: repository
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "lib": ["ES2023"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "declaration": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node", "vite-plus/test/globals"]
  },
  "include": ["src/**/*", "tests/**/*", "vite.config.ts"]
}
`;

const VITE_CONFIG = `import { fmt, test, typescript } from '@k8o/oxc-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ...fmt,
    // pnpm's release management owns CHANGELOG.md and .changeset/ (ledger.yaml
    // etc.), so the repo's formatting rules must not touch them
    ignorePatterns: ['CHANGELOG.md', '.changeset'],
  },
  lint: {
    extends: [typescript],
    ignorePatterns: ['CHANGELOG.md', '.changeset'],
    options: {
      typeAware: true,
    },
    overrides: [
      {
        files: ['tests/**/*.test.ts'],
        plugins: [...(test.plugins ?? [])],
        rules: test.rules ?? {},
      },
    ],
  },
  pack: {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    outDir: 'dist',
    unbundle: true,
  },
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  staged: {
    '*.{js,ts,cjs,mjs,jsx,tsx,json,jsonc}': 'vp check --fix',
  },
});
`;

const CI_YML = `name: CI

on:
  pull_request:

permissions:
  contents: read

jobs:
  check:
    name: Lint / Format / Types
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout branch
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: Install
        uses: ./.github/composite-actions/install

      - name: Build
        run: pnpm build

      - name: Run check (fmt + lint)
        run: pnpm check

      - name: Typecheck
        run: pnpm typecheck

  tests:
    name: Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout branch
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: Install
        uses: ./.github/composite-actions/install

      - name: Run tests
        run: pnpm test

  change-intent:
    name: Change intent
    # Dependency bumps (Renovate) and the release PR carry no change intent by design;
    # skipping the job is treated as success by branch protection.
    if: \${{ !startsWith(github.head_ref, 'renovate/') && github.head_ref != 'pnpm-release/main' }}
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout branch
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Verify a change intent is present
        run: |
          git diff --name-only "origin/\${GITHUB_BASE_REF}"...HEAD \\
            | grep -E '^\\.changeset/[^/]+\\.md$' \\
            | grep -v '^\\.changeset/README\\.md$'
`;

const RENOVATE = `{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>k35o/renovate-config"],
  "mise": {
    "enabled": true,
    "managerFilePatterns": ["/^mise\\\\.toml$/"]
  },
  "prConcurrentLimit": 10,
  "packageRules": [
    {
      "matchPackageNames": ["/^pnpm$/"],
      "groupName": "pnpm dependencies"
    },
    {
      "matchPackageNames": ["/^node$/"],
      "groupName": "node dependencies"
    }
  ]
}
`;

const SRC_INDEX = `export const hello = (name: string): string => \`Hello, \${name}!\`;
`;

const TEST_INDEX = `import { hello } from '../src/index.ts';

test('hello greets by name', () => {
  expect(hello('world')).toBe('Hello, world!');
});
`;

export const produceLibrary = (options: GenerateOptions) => {
  const { repo } = coords(options.name);
  const description = options.description ?? '';

  const packageJson = {
    name: options.name,
    version: '0.0.0',
    description,
    keywords: [] as string[],
    homepage: `https://github.com/${repo}#readme`,
    bugs: `https://github.com/${repo}/issues`,
    license: 'MIT',
    author: 'k8o (https://github.com/k35o)',
    repository: {
      type: 'git',
      url: `git+https://github.com/${repo}.git`,
    },
    files: ['dist', 'README.md', 'LICENSE', 'CHANGELOG.md'],
    type: 'module',
    sideEffects: false,
    exports: {
      '.': {
        import: {
          types: './dist/index.d.mts',
          default: './dist/index.mjs',
        },
      },
      './package.json': './package.json',
    },
    publishConfig: {
      access: 'public',
      provenance: true,
    },
    scripts: {
      build: 'vp pack',
      test: 'vp test',
      lint: 'vp lint',
      fmt: 'vp fmt',
      check: 'vp check',
      'check:write': 'vp check --fix',
      typecheck: 'tsc --noEmit',
      prepublishOnly: 'pnpm build',
    },
    devDependencies: {
      '@k8o/oxc-config': VERSIONS['@k8o/oxc-config'],
      '@types/node': VERSIONS['@types/node'],
      typescript: VERSIONS.typescript,
      'vite-plus': VERSIONS['vite-plus'],
    },
    engines: {
      node: '>=24.13.0',
    },
    packageManager: `pnpm@${TOOLS.pnpm}`,
  };

  const intro = description ? `${description}\n\n` : '';
  const readme = `# ${options.name}

${intro}## Install

\`\`\`sh
pnpm add ${options.name}
\`\`\`

## Develop

\`\`\`sh
pnpm install
pnpm check     # fmt + lint
pnpm typecheck
pnpm test
pnpm build     # vp pack -> dist/
\`\`\`

## Release

Versioned and published with [pnpm's built-in release management](https://pnpm.io/versioning),
driven in CI by [k35o/pnpm-release-action](https://github.com/k35o/pnpm-release-action).

\`\`\`sh
pnpm change   # describe the change (writes .changeset/<name>.md)
\`\`\`

Merging to \`main\` lets the release workflow open a release PR and publish to npm.
`;

  return {
    files: {
      'package.json': `${JSON.stringify(packageJson, null, 2)}\n`,
      'pnpm-workspace.yaml': PNPM_WORKSPACE,
      '.npmrc': NPMRC,
      '.gitignore': GITIGNORE,
      'mise.toml': MISE_TOML,
      'tsconfig.json': TSCONFIG,
      'vite.config.ts': VITE_CONFIG,
      'renovate.json': RENOVATE,
      LICENSE,
      'README.md': readme,
      '.github': {
        'composite-actions': {
          install: {
            'action.yml': INSTALL_ACTION,
          },
        },
        workflows: {
          'ci.yml': CI_YML,
          'release.yml': RELEASE_YML,
        },
      },
      src: {
        'index.ts': SRC_INDEX,
      },
      tests: {
        'index.test.ts': TEST_INDEX,
      },
    },
  };
};
