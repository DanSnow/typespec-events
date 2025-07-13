import { createTypeSpecLibrary } from '@typespec/compiler';
import { PACKAGE_NAME } from './consts.js';

export const $lib = createTypeSpecLibrary({
  name: PACKAGE_NAME,
  // Define diagnostics for the library. This will provide a typed API to report diagnostic as well as a auto doc generation.
  diagnostics: {},
  // Defined state keys for storing metadata in decorator.
  state: {
    isEvent: { description: 'Marks a model as a tracking event' },
  },
});

export const {
  reportDiagnostic,
  createDiagnostic,
  stateKeys: StateKeys,
} = $lib;
