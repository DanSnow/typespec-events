import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "@typespec-events&#x2F;emitter",
  diagnostics: {},
});

export const { reportDiagnostic, createDiagnostic } = $lib;
