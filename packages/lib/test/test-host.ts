import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTestHost, createTestWrapper } from '@typespec/compiler/testing';
import { TypespecEventsTestLibrary } from '../src/testing/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createTypespecEventsTestHost() {
  return createTestHost({
    libraries: [TypespecEventsTestLibrary],
  });
}

export async function createTypespecEventsTestRunner() {
  const host = await createTypespecEventsTestHost();
  const distDir = resolve(__dirname, '../dist');

  // No idea why the dist folder isn't add to test fs
  await host.addRealFolder('/test/node_modules/@typespec-events/lib/dist', distDir);

  return createTestWrapper(host, {
    autoUsings: ['TypespecEvents'],
  });
}
