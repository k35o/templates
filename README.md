# @k8o/create

k8o's project generator for [Vite+](https://viteplus.dev). One command spins up
a new repo with the conventions already wired in — supply-chain rules, oxlint /
oxfmt via [`@k8o/oxc-config`](https://github.com/k35o/oxc-config), Changesets,
GitHub Actions CI/release, mise, and Renovate.

## Usage

```sh
vp create @k8o          # interactive: pick library / web, enter a name
vp create @k8o -- --kind library --name @k8o/foo --description "..."
vp create @k8o -- --kind web --name @k8o/foo
```

`vp create @k8o` resolves this package (`@k8o/create`) and runs its generator.

## Kinds

| `--kind`  | Emits                                                                            |
| --------- | -------------------------------------------------------------------------------- |
| `library` | Single-package library: `src` + `tests`, `vp pack` → ESM + `.d.mts`.             |
| `web`     | Monorepo: `packages/<name>` React lib + `apps/playground`, on @k8o/arte-odyssey. |

Both generated repos pass `check` (fmt + lint + types), `test`, and `build`
out of the box.

### What every generated repo gets

- **Supply-chain rules** — `pnpm-workspace.yaml` with `blockExoticSubdeps`,
  `minimumReleaseAge`, `strictDepBuilds`, `verifyDepsBeforeRun`, `saveExact`,
  `autoInstallPeers: false`.
- **Lint / format** — `@k8o/oxc-config` presets via `vp check`.
- **Versioning** — Changesets + a `release.yml` that publishes to npm with
  provenance using the `K35O_BOT` GitHub App.
- **CI** — `ci.yml` (lint / types / tests / changeset) on a composite
  mise-based install action.
- **Toolchain** — pinned `mise.toml`, `renovate.json` extending
  `github>k35o/renovate-config`.

## Layout

```
bin/index.ts       # Bingo runTemplateCLI entry
src/
  template.ts      # createTemplate: { kind, name, description } → dispatch
  library.ts       # produceLibrary()
  web.ts           # produceWeb()
  shared.ts        # base files shared by both kinds (single source)
tests/produce.test.ts
```

Each kind is built by a `produce()` that returns the file tree. The shared base
files (security config, CI, license, mise, …) live once in `src/shared.ts` and
are imported by both — change a convention in one place and both kinds follow.

## Adding a kind

Add a value to the `kind` enum in [`src/template.ts`](src/template.ts), write a
`produce*()` in a new `src/<kind>.ts` reusing `src/shared.ts`, and dispatch to
it. No new package to publish.

## Develop

```sh
pnpm install
pnpm check       # fmt + lint
pnpm typecheck
pnpm test        # generator smoke tests
pnpm dev -- --kind library --name @k8o/scratch --directory /tmp/scratch --offline
pnpm changeset   # describe a change before merging
```
