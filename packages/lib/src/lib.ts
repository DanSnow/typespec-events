import { createTypeSpecLibrary, paramMessage } from '@typespec/compiler';

export const $lib = createTypeSpecLibrary({
  name: '@typespec-events/lib',
  // Define diagnostics for the library. This will provide a typed API to report diagnostic as well as a auto doc generation.
  diagnostics: {
    'banned-alternate-name': {
      severity: 'error',
      messages: {
        default: paramMessage`Banned alternate name "${'name'}".`,
      },
    },
  },
  // Defined state keys for storing metadata in decorator.
  state: {
    isEvent: { description: 'Marks a model as a tracking event' },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
