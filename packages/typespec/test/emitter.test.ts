import { expect, it } from 'vitest';
import { emit } from './test-host.js';

it('emit events.zod.ts', async () => {
  const results = await emit('@event("cta_clicked") model CtaClicked { title: string}');
  expect(results['events.zod.ts']).toMatchSnapshot();
});
