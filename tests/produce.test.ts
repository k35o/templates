import template from '../src/template.ts';

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
