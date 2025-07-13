import { expect, it } from 'vitest';
import { PACKAGE_NAME } from '../src/consts.js';
import { emit } from './test-host.js';

it('emit events.zod.ts with camelCase (default)', async () => {
  const results = await emit('@event("cta_clicked") model CtaClicked { title: string}');
  expect(results['events.zod.ts']).toMatchSnapshot();
});

it('emit events.zod.ts with PascalCase', async () => {
  const results = await emit('@event("cta_clicked") model CtaClicked { title: string}', {
    options: {
      [PACKAGE_NAME]: {
        schemaNamingConvention: 'PascalCase',
      },
    },
  });
  expect(results['events.zod.ts']).toMatchSnapshot();
});
