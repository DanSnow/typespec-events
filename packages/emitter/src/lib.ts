import { createTypeSpecLibrary } from '@typespec/compiler';

export const $lib = createTypeSpecLibrary({
  name: '@typespec-events/emitter',
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
