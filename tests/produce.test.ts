// Internal import on purpose: this is the exact parser bingo's CLI runs on our
// schema. It only maps a subset of Zod types to value-taking flags, so a z.enum
// `kind` was dropped and `--kind web` parsed as the boolean `kind: true`,
// silently scaffolding a library. Exercising the real parser catches a revert.
import { parseZodArgs } from 'bingo/lib/cli/parsers/parseZodArgs.js';

import template from '../src/template.ts';

test('bingo parses --kind web as the string "web", not a boolean', () => {
  const values = parseZodArgs(
    ['--kind', 'web', '--name', '@k8o/sample-ui'],
    template.options,
  );

  expect(values.kind).toBe('web');
  expect(values.name).toBe('@k8o/sample-ui');
});

test('library kind emits a package.json carrying the name', async () => {
  const { files } = await template.produce({
    options: { kind: 'library', name: '@k8o/sample' },
  });

  expect(JSON.stringify(files?.['package.json'])).toContain('@k8o/sample');
  expect(files?.['vite.config.ts']).toBeTruthy();
  expect(files?.['.github']).toBeTruthy();
});

test('web kind emits packages/ and apps/', async () => {
  const { files } = await template.produce({
    options: { kind: 'web', name: '@k8o/sample-ui' },
  });

  expect(JSON.stringify(files?.['package.json'])).toContain('sample-ui');
  expect(files?.['packages']).toBeTruthy();
  expect(files?.['apps']).toBeTruthy();
});
