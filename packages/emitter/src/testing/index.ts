import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const TypespecEventsX2FEmitterTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "@typespec-events&#x2F;emitter",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
