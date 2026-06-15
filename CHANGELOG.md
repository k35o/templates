# @k8o/create

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
