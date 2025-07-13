import { fileURLToPath } from 'node:url';
import { resolvePath } from '@typespec/compiler';
import { createTestLibrary, type TypeSpecTestLibrary } from '@typespec/compiler/testing';
import { PACKAGE_NAME } from '../consts.js';

const packageRoot = resolvePath(fileURLToPath(import.meta.url), '../../../');
export const TypespecEventsTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: PACKAGE_NAME,
  packageRoot,
});
