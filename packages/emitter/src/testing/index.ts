import { fileURLToPath } from 'node:url';
import { resolvePath } from '@typespec/compiler';
import { createTestLibrary, type TypeSpecTestLibrary } from '@typespec/compiler/testing';

const packageRoot = resolvePath(fileURLToPath(import.meta.url), '../../../');
export const TypespecEventsEmitterLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: '@typespec-events/emitter',
  packageRoot,
});
