import { createTemplate } from 'bingo';
import { z } from 'zod';

import { produceLibrary } from './library.ts';
import { produceWeb } from './web.ts';

export default createTemplate({
  about: {
    name: '@k8o/create',
    description: "k8o's Vite+ project generator — run `vp create @k8o`.",
  },

  options: {
    // A union of literals (not z.enum) on purpose: bingo's CLI arg parser only
    // maps ZodString/ZodLiteral/ZodUnion to value-taking flags — a ZodEnum is
    // dropped, so `--kind web` parses as the boolean `kind: true` and silently
    // falls through to the library branch. The union keeps the exact
    // 'library' | 'web' validation while staying CLI-parseable.
    kind: z
      .union([z.literal('library'), z.literal('web')])
      .describe('What to scaffold: a library or a web (React) package'),
    name: z
      .string()
      .regex(
        /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u,
        'Must be a valid (optionally @scoped) npm package name',
      )
      .describe('Package name, e.g. @k8o/foo'),
    description: z.string().optional().describe('One-line package description'),
  },

  produce({ options }) {
    return options.kind === 'web'
      ? produceWeb(options)
      : produceLibrary(options);
  },
});
