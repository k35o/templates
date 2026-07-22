# @k8o/create

k8o's project generator for [Vite+](https://viteplus.dev). One command scaffolds
a new repository with the conventions already wired in — supply-chain rules,
oxlint / oxfmt via [`@k8o/oxc-config`](https://github.com/k35o/oxc-config),
pnpm release management, GitHub Actions CI/release, mise, and Renovate.

## Usage

`@k8o/create` is the package behind the `create` shorthand, so every entry point
runs the same generator:

```sh
vp create @k8o            # interactive: pick library / web, enter a name
pnpm create @k8o
npm create @k8o
npx @k8o/create

# non-interactive — pass options after `--` (npx takes them directly):
vp create @k8o   -- --kind library --name @k8o/foo --description "..."
pnpm create @k8o -- --kind web --name @k8o/foo
npx @k8o/create --kind library --name @k8o/foo
```

`--directory <dir>` sets the target directory; `--offline` skips the
post-scaffold network steps.

## Kinds

| `--kind`  | Emits                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| `library` | Single-package TypeScript library (`vp pack` → ESM + `.d.mts`).                  |
| `web`     | Monorepo: `packages/<name>` React lib + `apps/playground`, on @k8o/arte-odyssey. |

Both generated repos pass `check` (fmt + lint), `typecheck`, `test`, and `build`
out of the box.

## What gets generated

<details>
<summary><code>--kind library</code></summary>

```
<name>/
├─ src/index.ts
├─ tests/index.test.ts
├─ .github/
│  ├─ composite-actions/install/action.yml
│  └─ workflows/{ci.yml, release.yml}
├─ package.json  pnpm-workspace.yaml  tsconfig.json  vite.config.ts
├─ .gitignore  .npmrc  mise.toml  renovate.json
└─ LICENSE  README.md
```

</details>

<details>
<summary><code>--kind web</code></summary>

```
<name>/
├─ packages/<name>/        # publishable React lib (uses @k8o/arte-odyssey)
│  ├─ src/index.ts
│  ├─ src/components/hello.tsx
│  ├─ src/helpers/{cn.ts, cn.test.ts}
│  └─ package.json  tsconfig.json  vite.config.ts
├─ apps/playground/        # private Vite app to preview the stack
│  ├─ src/{main.tsx, app.tsx, styles.css, vite-env.d.ts}
│  └─ index.html  package.json  tsconfig.json  vite.config.ts
├─ .github/{composite-actions, workflows}
├─ package.json  pnpm-workspace.yaml (catalog)  tsconfig.json  vite.config.ts
├─ commitlint.config.js  .gitignore  .npmrc  mise.toml  renovate.json
└─ LICENSE  README.md
```

</details>

### Conventions every generated repo gets

- **Supply-chain rules** — `pnpm-workspace.yaml` with `blockExoticSubdeps`,
  `minimumReleaseAge`, `strictDepBuilds`, `verifyDepsBeforeRun`, `saveExact`,
  `autoInstallPeers: false`.
- **Lint / format** — `@k8o/oxc-config` presets via `vp check`.
- **Versioning / release** —
  [pnpm's built-in release management](https://pnpm.io/versioning) driven by
  [k35o/pnpm-release-action](https://github.com/k35o/pnpm-release-action), with
  a `release.yml` that publishes to npm with provenance via OIDC trusted
  publishing and the `K35O_BOT` GitHub App.
- **CI** — `ci.yml` (lint / types / tests / change intent) on a composite,
  mise-based install action.
- **Toolchain** — pinned `mise.toml`, `renovate.json` extending
  `github>k35o/renovate-config`.

## How emitted versions stay current (Renovate)

The dependency versions written into generated repos live in
[`src/versions.ts`](src/versions.ts) — the single source of truth. They are
TypeScript literals (not a `package.json`), so each carries a `// renovate:`
annotation that a **custom manager** in [`renovate.json`](renovate.json) matches.
Renovate then opens PRs to bump them; merging a bump and cutting a release ships
fresh versions to every newly generated repo.

> Renovate must be enabled on this repository (via the Renovate GitHub App) for
> that to run.

## Source layout

```
bin/index.ts       # Bingo runTemplateCLI entry (bundled to dist/index.mjs)
src/
  template.ts      # createTemplate: { kind, name, description } → dispatch
  library.ts       # produceLibrary()
  web.ts           # produceWeb()
  shared.ts        # base files shared by both kinds
  versions.ts      # emitted dependency versions (Renovate-managed)
tests/produce.test.ts
```

The published `bin` is the bundled `dist/index.mjs` (`vp pack`): Node refuses to
strip TypeScript types under `node_modules`, so the bin must ship as JavaScript.

## Adding a kind

Add a value to the `kind` enum in [`src/template.ts`](src/template.ts), write a
`produce*()` in `src/<kind>.ts` reusing `src/shared.ts` + `src/versions.ts`, and
dispatch to it. No new package to publish.

## Develop

```sh
pnpm install
pnpm check       # fmt + lint
pnpm typecheck
pnpm test        # generator smoke tests
pnpm dev -- --kind library --name @k8o/scratch --directory /tmp/scratch --offline
pnpm change      # describe a change before merging (writes .changeset/<name>.md)
```
