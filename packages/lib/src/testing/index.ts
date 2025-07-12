import { resolvePath } from '@typespec/compiler';
import {
  createTestLibrary,
  TypeSpecTestLibrary,
} from '@typespec/compiler/testing';
import { fileURLToPath } from 'url';

export const TypespecEventsX2FLibTestLibrary: TypeSpecTestLibrary =
  createTestLibrary({
    name: '@typespec-events&#x2F;lib',
    packageRoot: resolvePath(fileURLToPath(import.meta.url), '../../../../'),
  });
