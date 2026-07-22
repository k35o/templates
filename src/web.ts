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

const COMMITLINT = `export default { extends: ['@commitlint/config-conventional'] };
`;

// Monorepo: packages/* (publishable libs) + apps/* (private apps/examples).
const PNPM_WORKSPACE = `packages:
  - packages/*
  - apps/*

blockExoticSubdeps: true

minimumReleaseAge: 10080
minimumReleaseAgeExclude:
  - '@k8o/*'

strictDepBuilds: true

allowBuilds:
  esbuild: false

verifyDepsBeforeRun: install

saveExact: true
autoInstallPeers: false

catalog:
  '@commitlint/cli': ${VERSIONS['@commitlint/cli']}
  '@commitlint/config-conventional': ${VERSIONS['@commitlint/config-conventional']}
  '@k8o/arte-odyssey': ${VERSIONS['@k8o/arte-odyssey']}
  '@k8o/oxc-config': ${VERSIONS['@k8o/oxc-config']}
  '@tailwindcss/vite': ${VERSIONS['@tailwindcss/vite']}
  '@types/node': ${VERSIONS['@types/node']}
  '@types/react': ${VERSIONS['@types/react']}
  '@types/react-dom': ${VERSIONS['@types/react-dom']}
  '@vitejs/plugin-react': ${VERSIONS['@vitejs/plugin-react']}
  react: ${VERSIONS.react}
  react-dom: ${VERSIONS['react-dom']}
  tailwindcss: ${VERSIONS.tailwindcss}
  typescript: ${VERSIONS.typescript}
  vite: ${VERSIONS.vite}
  vite-plus: ${VERSIONS['vite-plus']}

versioning:
  changelog:
    storage: repository
`;

// Root tsconfig for a React monorepo (DOM + JSX). Package tsconfigs extend it.
const TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "customConditions": ["source"],
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "react-jsx",
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
  }
}
`;

// Root config drives fmt + lint for the whole monorepo.
const ROOT_VITE_CONFIG = `import { fmt, react, test } from '@k8o/oxc-config';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    ...fmt,
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md'],
  },
  lint: {
    extends: [react],
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md'],
    options: {
      typeAware: true,
    },
    settings: {
      react: { version: '${VERSIONS.react}' },
    },
    overrides: [
      {
        files: ['**/*.test.{ts,tsx}'],
        plugins: [...(test.plugins ?? [])],
        rules: test.rules ?? {},
      },
    ],
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
    name: Build / Lint / Types
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
      "matchPackageNames": ["react", "react-dom", "/^@types/react/"],
      "groupName": "react dependencies"
    },
    {
      "matchPackageNames": ["/tailwind/"],
      "groupName": "tailwind dependencies"
    },
    {
      "matchPackageNames": ["/^@commitlint/"],
      "groupName": "commitlint dependencies"
    },
    {
      "matchPackageNames": ["/^pnpm$/"],
      "groupName": "pnpm dependencies"
    },
    {
      "matchPackageNames": ["/^node$/"],
      "groupName": "node dependencies"
    },
    {
      "matchDepTypes": ["peerDependencies"],
      "enabled": false
    }
  ]
}
`;

// --- packages/<pkg> : publishable React component library --------------------

const PKG_TSCONFIG = `{
  "extends": "../../tsconfig.json",
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
`;

const PKG_VITE_CONFIG = `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [react()],
  pack: {
    entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
    format: 'esm',
    dts: true,
    outDir: 'dist',
    unbundle: true,
  },
  test: {
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
  staged: {
    '*': 'vp check --fix',
  },
});
`;

const PKG_CN = `export const cn = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(' ');
`;

const PKG_CN_TEST = `import { cn } from './cn.ts';

test('cn joins truthy class names', () => {
  expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
});
`;

const PKG_HELLO = `import { Button } from '@k8o/arte-odyssey';
import type { FC } from 'react';

export type HelloProps = {
  /** Who to greet. */
  name: string;
};

/**
 * Sample component wrapping @k8o/arte-odyssey's Button.
 * Render it inside <ArteOdysseyProvider> (see apps/playground).
 */
export const Hello: FC<HelloProps> = ({ name }) => (
  <Button>Hello, {name}!</Button>
);
`;

const PKG_INDEX = `export { cn } from './helpers/cn.ts';
export { Hello } from './components/hello.tsx';
export type { HelloProps } from './components/hello.tsx';
`;

// --- apps/playground : private Vite + React app using arte-odyssey -----------

const APP_TSCONFIG = `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["node", "vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"]
}
`;

const APP_VITE_CONFIG = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;

const APP_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>playground</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const APP_MAIN = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app.tsx';

import './styles.css';

const root = document.querySelector('#root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
`;

// The playground demonstrates the @k8o/arte-odyssey stack (provider + tailwind).
// To preview your own package here, add it as a `workspace:*` dependency and
// import it — its `source` export condition resolves to TS source in dev.
const APP_APP = `import { ArteOdysseyProvider, Button } from '@k8o/arte-odyssey';

export const App = () => (
  <ArteOdysseyProvider>
    <main className="grid min-h-dvh place-items-center gap-4 p-8">
      <h1 className="text-2xl font-bold">@PKG_NAME@ playground</h1>
      <Button>Hello, world!</Button>
    </main>
  </ArteOdysseyProvider>
);
`;

const APP_STYLES = `@import 'tailwindcss';
@import '@k8o/arte-odyssey/styles.css';
`;

const APP_VITE_ENV = `/// <reference types="vite/client" />
`;

export const produceWeb = (options: GenerateOptions) => {
  const { bare, repo } = coords(options.name);
  const description = options.description ?? '';

  const rootPackageJson = {
    name: bare,
    version: '0.0.0',
    private: true,
    description,
    license: 'MIT',
    author: 'k8o (https://github.com/k35o)',
    repository: {
      type: 'git',
      url: `git+https://github.com/${repo}.git`,
    },
    type: 'module',
    scripts: {
      build: "vp run --filter './packages/*' --filter './apps/*' build",
      dev: 'vp run --filter ./apps/playground dev',
      test: 'vp run -r test',
      typecheck: 'vp run -r typecheck',
      check: 'vp check',
      'check:write': 'vp check --fix',
      ready: 'vp fmt && vp lint && vp run -r test',
    },
    devDependencies: {
      '@commitlint/cli': 'catalog:',
      '@commitlint/config-conventional': 'catalog:',
      '@k8o/oxc-config': 'catalog:',
      '@types/node': 'catalog:',
      typescript: 'catalog:',
      'vite-plus': 'catalog:',
    },
    engines: {
      node: '>=24.13.0',
    },
    packageManager: `pnpm@${TOOLS.pnpm}`,
  };

  const libPackageJson = {
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
      directory: `packages/${bare}`,
    },
    files: ['dist'],
    type: 'module',
    sideEffects: false,
    exports: {
      '.': {
        source: './src/index.ts',
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
      typecheck: 'tsc --noEmit',
      check: 'vp check',
      'check:write': 'vp check --fix',
    },
    devDependencies: {
      '@k8o/arte-odyssey': 'catalog:',
      '@types/react': 'catalog:',
      '@types/react-dom': 'catalog:',
      '@vitejs/plugin-react': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
      'vite-plus': 'catalog:',
    },
    peerDependencies: {
      '@k8o/arte-odyssey': '>=10',
      react: '>=19',
      'react-dom': '>=19',
    },
  };

  const appPackageJson = {
    name: 'playground',
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      typecheck: 'tsc --noEmit',
    },
    dependencies: {
      '@k8o/arte-odyssey': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
    },
    devDependencies: {
      '@tailwindcss/vite': 'catalog:',
      '@types/react': 'catalog:',
      '@types/react-dom': 'catalog:',
      '@vitejs/plugin-react': 'catalog:',
      tailwindcss: 'catalog:',
      typescript: 'catalog:',
      vite: 'catalog:',
    },
  };

  const intro = description ? `${description}\n\n` : '';
  const readme = `# ${bare}

${intro}A React component library built on [@k8o/arte-odyssey](https://github.com/k35o/arte-odyssey).

## Layout

\`\`\`
packages/${bare}   # the publishable library (${options.name})
apps/playground    # local Vite app to preview it
\`\`\`

## Develop

\`\`\`sh
pnpm install
pnpm dev        # run the playground app
pnpm check      # fmt + lint
pnpm typecheck
pnpm test
pnpm build      # build every package and app
\`\`\`

## Release

Versioned and published with [pnpm's built-in release management](https://pnpm.io/versioning),
driven in CI by [k35o/pnpm-release-action](https://github.com/k35o/pnpm-release-action).
Describe changes with \`pnpm change\`; merging to \`main\` lets the release
workflow open a release PR and publish to npm.
`;

  return {
    files: {
      'package.json': `${JSON.stringify(rootPackageJson, null, 2)}\n`,
      'pnpm-workspace.yaml': PNPM_WORKSPACE,
      '.npmrc': NPMRC,
      '.gitignore': GITIGNORE,
      'mise.toml': MISE_TOML,
      'tsconfig.json': TSCONFIG,
      'vite.config.ts': ROOT_VITE_CONFIG,
      'commitlint.config.js': COMMITLINT,
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
      packages: {
        [bare]: {
          'package.json': `${JSON.stringify(libPackageJson, null, 2)}\n`,
          'tsconfig.json': PKG_TSCONFIG,
          'vite.config.ts': PKG_VITE_CONFIG,
          src: {
            'index.ts': PKG_INDEX,
            components: {
              'hello.tsx': PKG_HELLO,
            },
            helpers: {
              'cn.ts': PKG_CN,
              'cn.test.ts': PKG_CN_TEST,
            },
          },
        },
      },
      apps: {
        playground: {
          'package.json': `${JSON.stringify(appPackageJson, null, 2)}\n`,
          'tsconfig.json': APP_TSCONFIG,
          'vite.config.ts': APP_VITE_CONFIG,
          'index.html': APP_INDEX_HTML,
          src: {
            'main.tsx': APP_MAIN,
            'app.tsx': APP_APP.replaceAll('@PKG_NAME@', options.name),
            'styles.css': APP_STYLES,
            'vite-env.d.ts': APP_VITE_ENV,
          },
        },
      },
    },
  };
};
