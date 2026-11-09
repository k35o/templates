import type { GenerateOptions } from './shared.ts';
import {
  coords,
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
  - '@better-css-modules/*'
  - '@k8o/*'
  - '@k8ordo/*'

strictDepBuilds: true

allowBuilds:
  esbuild: false

verifyDepsBeforeRun: install

saveExact: true
autoInstallPeers: false

catalog:
  '@better-css-modules/cli': ${VERSIONS['@better-css-modules/cli']}
  '@better-css-modules/core': ${VERSIONS['@better-css-modules/core']}
  '@better-css-modules/vite': ${VERSIONS['@better-css-modules/vite']}
  '@commitlint/cli': ${VERSIONS['@commitlint/cli']}
  '@commitlint/config-conventional': ${VERSIONS['@commitlint/config-conventional']}
  '@k8o/oxc-config': ${VERSIONS['@k8o/oxc-config']}
  '@k8ordo/i18n': ${VERSIONS['@k8ordo/i18n']}
  '@k8ordo/ui': ${VERSIONS['@k8ordo/ui']}
  '@types/node': ${VERSIONS['@types/node']}
  '@types/react': ${VERSIONS['@types/react']}
  '@types/react-dom': ${VERSIONS['@types/react-dom']}
  '@vitejs/plugin-react': ${VERSIONS['@vitejs/plugin-react']}
  react: ${VERSIONS.react}
  react-dom: ${VERSIONS['react-dom']}
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
    // pnpm's release management owns CHANGELOG.md and .changeset/ (ledger.yaml
    // etc.), so the repo's formatting rules must not touch them
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md', '.changeset'],
  },
  lint: {
    extends: [react],
    ignorePatterns: ['CHANGELOG.md', '**/CHANGELOG.md', '.changeset'],
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
      "matchPackageNames": ["/^@k8ordo/"],
      "groupName": "k8ordo dependencies"
    },
    {
      "matchPackageNames": ["/^@better-css-modules/"],
      "groupName": "better-css-modules dependencies"
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
    // @k8ordo/ui's components import their CSS, which Node cannot load.
    // Inlining it runs it through Vite, which handles the CSS imports.
    server: { deps: { inline: [/@k8ordo\\/ui/u] } },
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

const PKG_HELLO = `import { Button } from '@k8ordo/ui';
import type { FC } from 'react';

export type HelloProps = {
  /** Who to greet. */
  name: string;
};

/**
 * Sample component wrapping @k8ordo/ui's Button.
 * The app loads @k8ordo/ui's stylesheet and renders it inside <UIProvider>
 * (see apps/playground).
 */
export const Hello: FC<HelloProps> = ({ name }) => (
  <Button>Hello, {name}!</Button>
);
`;

const PKG_HELLO_TEST = `import { renderToString } from 'react-dom/server';

import { Hello } from './hello.tsx';

test('Hello greets the name', () => {
  expect(renderToString(<Hello name="k8o" />)).toContain('k8o');
});
`;

const PKG_INDEX = `export { cn } from './helpers/cn.ts';
export { Hello } from './components/hello.tsx';
export type { HelloProps } from './components/hello.tsx';
`;

// --- apps/playground : private Vite + React app using @k8ordo/ui -------------

// rootDirs lets TypeScript read the class names better-css-modules generates
// into __generated__ for each *.module.css.
const APP_TSCONFIG = `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["node", "vite/client"],
    "rootDirs": [".", "./__generated__"]
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "vite.config.ts",
    "better-css-modules.config.ts",
    "__generated__"
  ]
}
`;

const APP_VITE_CONFIG = `import betterCssModules from '@better-css-modules/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), betterCssModules()],
  // @k8ordo/ui's CSS is written for these browsers. Vite's default target
  // makes Lightning CSS rewrite it for older ones: nesting flattened, :dir()
  // turned into :lang() selectors that no longer follow dir.
  build: { cssTarget: ['chrome146', 'edge146', 'firefox151', 'safari26'] },
});
`;

const APP_BCM_CONFIG = `import { defineConfig } from '@better-css-modules/core';

export default defineConfig({
  globalCss: ['./src/styles.css'],
  layer: 'components',
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

// The playground demonstrates the @k8ordo/ui stack (provider + CSS Modules on
// its tokens). To preview your own package here, add it as a `workspace:*`
// dependency and import it — its `source` export condition resolves to TS
// source in dev.
const APP_APP = `import { Button, Heading, UIProvider } from '@k8ordo/ui';

import styles from './app.module.css';

export const App = () => (
  <UIProvider>
    <main className={styles.root}>
      <Heading level="h1">@PKG_NAME@ playground</Heading>
      <Button>Hello, world!</Button>
    </main>
  </UIProvider>
);
`;

const APP_MODULE_CSS = `.root {
  display: grid;
  place-content: center;
  place-items: center;
  gap: calc(var(--spacing) * 4);
  min-height: 100dvh;
  padding: calc(var(--spacing) * 8);
}
`;

const APP_STYLES = `@import '@k8ordo/ui/styles.css';
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
      check: 'vp run -r typegen && vp check && vp run -r check:css',
      'check:write': 'vp run -r typegen && vp check --fix',
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
      '@k8ordo/i18n': 'catalog:',
      '@k8ordo/ui': 'catalog:',
      '@types/react': 'catalog:',
      '@types/react-dom': 'catalog:',
      '@vitejs/plugin-react': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
      'vite-plus': 'catalog:',
    },
    peerDependencies: {
      '@k8ordo/ui': '>=2',
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
      typegen: 'better-css-modules generate',
      typecheck: 'better-css-modules generate && tsc --noEmit',
      'check:css': 'better-css-modules check',
    },
    dependencies: {
      '@k8ordo/i18n': 'catalog:',
      '@k8ordo/ui': 'catalog:',
      react: 'catalog:',
      'react-dom': 'catalog:',
    },
    devDependencies: {
      '@better-css-modules/cli': 'catalog:',
      '@better-css-modules/core': 'catalog:',
      '@better-css-modules/vite': 'catalog:',
      '@types/react': 'catalog:',
      '@types/react-dom': 'catalog:',
      '@vitejs/plugin-react': 'catalog:',
      typescript: 'catalog:',
      vite: 'catalog:',
    },
  };

  const intro = description ? `${description}\n\n` : '';
  const readme = `# ${bare}

${intro}A React component library built on [@k8ordo/ui](https://ordo.k8o.me).

## Layout

\`\`\`
packages/${bare}   # the publishable library (${options.name})
apps/playground    # local Vite app to preview it
\`\`\`

## Develop

\`\`\`sh
pnpm install
pnpm dev        # run the playground app
pnpm check      # fmt + lint + CSS Modules check (better-css-modules)
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
      '.gitignore': `${GITIGNORE}__generated__\n`,
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
              'hello.test.tsx': PKG_HELLO_TEST,
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
          'better-css-modules.config.ts': APP_BCM_CONFIG,
          'index.html': APP_INDEX_HTML,
          src: {
            'main.tsx': APP_MAIN,
            'app.tsx': APP_APP.replaceAll('@PKG_NAME@', options.name),
            'app.module.css': APP_MODULE_CSS,
            'styles.css': APP_STYLES,
            'vite-env.d.ts': APP_VITE_ENV,
          },
        },
      },
    },
  };
};
