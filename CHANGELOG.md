# @k8o/create

## 0.2.0

### Minor Changes

- [#4](https://github.com/k35o/templates/pull/4) [`5ef3be6`](https://github.com/k35o/templates/commit/5ef3be63c58f6df38f38b8d0aae02ed60decf015) Thanks [@k35o](https://github.com/k35o)! - Generated repos now stay current via Renovate. The dependency and toolchain
  versions written into scaffolded repos are centralized in a single source of
  truth (`src/versions.ts`) and tracked by a Renovate custom manager, so Renovate
  opens PRs to bump them.

  The README now documents what each kind emits (file trees for `library` and
  `web`) and every entry point (`vp` / `pnpm` / `npm create @k8o`, `npx`).

  Cleanups: the generated `library` CI runs `pnpm typecheck` as its own step, the
  generated `.gitignore` covers `*.tgz`, a dead `customConditions` was removed from
  the library `tsconfig.json`, the changeset `$schema` is pinned to a major range,
  and an empty `--description` no longer produces a malformed README.

### Patch Changes

- [#9](https://github.com/k35o/templates/pull/9) [`6ad3899`](https://github.com/k35o/templates/commit/6ad389983762cfd9ede09ba33ee16214ab5d7431) Thanks [@k35o](https://github.com/k35o)! - Stop the CI `Changeset` job from failing on dependency-bump and release PRs. The
  job now skips (which branch protection treats as success) when the actor is
  `renovate[bot]` or the head branch is `changeset-release/main`, matching the rest
  of the k8o repos. Applied to both this repo's own CI and the `ci.yml` emitted into
  generated `library` / `web` repos.

- [#8](https://github.com/k35o/templates/pull/8) [`ddbf9dd`](https://github.com/k35o/templates/commit/ddbf9dd64b4067f89b2fafcad4aa4e451499d151) Thanks [@k35o](https://github.com/k35o)! - Fix `--kind web` scaffolding the wrong project. bingo's CLI arg parser only maps
  certain Zod types to value-taking flags, and a `z.enum` is not one of them — so
  `--kind web` was parsed as the boolean `kind: true` and silently fell through to
  the `library` branch, producing a single-package repo instead of the web
  monorepo. `kind` is now a union of string literals (`z.union([z.literal('library'),
z.literal('web')])`), which bingo's CLI parses correctly while keeping the exact
  `'library' | 'web'` validation. A regression test asserts every option uses a
  CLI-parseable Zod type.

## 0.1.1

### Patch Changes

- Ship a compiled JavaScript bin. Node refuses to strip TypeScript types for
  files under `node_modules`, so the previous raw-TS `bin/index.ts` failed with
  `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` when the package was installed
  and run via `vp create @k8o`. The bin is now bundled to `dist/index.mjs` with
  `vp pack`.

## 0.1.0

### Minor Changes

- Initial release. `vp create @k8o -- --kind library|web --name @k8o/foo`
  scaffolds a new repository with k8o conventions baked in: pnpm supply-chain
  rules, `@k8o/oxc-config` lint presets, Changesets, GitHub Actions CI/release,
  mise, and Renovate.
