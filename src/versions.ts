// Single source of truth for the dependency versions that @k8o/create writes
// into generated repositories.
//
// These live in TypeScript (not a package.json), so Renovate cannot see them by
// default. The `// renovate:` annotations below are matched by a custom manager
// in this repo's renovate.json — so Renovate opens PRs to bump these, and the
// next @k8o/create release ships fresh versions to every newly generated repo.

export const VERSIONS = {
  // renovate: datasource=npm depName=@changesets/changelog-github
  '@changesets/changelog-github': '0.7.0',
  // renovate: datasource=npm depName=@changesets/cli
  '@changesets/cli': '2.31.0',
  // renovate: datasource=npm depName=@commitlint/cli
  '@commitlint/cli': '21.0.2',
  // renovate: datasource=npm depName=@commitlint/config-conventional
  '@commitlint/config-conventional': '21.0.2',
  // renovate: datasource=npm depName=@k8o/arte-odyssey
  '@k8o/arte-odyssey': '10.1.0',
  // renovate: datasource=npm depName=@k8o/oxc-config
  '@k8o/oxc-config': '0.1.3',
  // renovate: datasource=npm depName=@tailwindcss/vite
  '@tailwindcss/vite': '4.3.0',
  // renovate: datasource=npm depName=@types/node
  '@types/node': '24.13.1',
  // renovate: datasource=npm depName=@types/react
  '@types/react': '19.2.17',
  // renovate: datasource=npm depName=@types/react-dom
  '@types/react-dom': '19.2.3',
  // renovate: datasource=npm depName=@vitejs/plugin-react
  '@vitejs/plugin-react': '6.0.2',
  // renovate: datasource=npm depName=react
  react: '19.2.7',
  // renovate: datasource=npm depName=react-dom
  'react-dom': '19.2.7',
  // renovate: datasource=npm depName=tailwindcss
  tailwindcss: '4.3.0',
  // renovate: datasource=npm depName=typescript
  typescript: '6.0.3',
  // renovate: datasource=npm depName=vite
  vite: '8.0.16',
  // renovate: datasource=npm depName=vite-plus
  'vite-plus': '0.1.24',
} as const;

// Toolchain versions for the generated `mise.toml` + `packageManager` field.
export const TOOLS = {
  // renovate: datasource=node-version depName=node
  node: '24.16.0',
  // renovate: datasource=npm depName=pnpm
  pnpm: '11.5.1',
} as const;
