import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { TypespecEventsX2FLibTestLibrary } from "../src/testing/index.js";

export async function createTypespecEventsX2FLibTestHost() {
  return createTestHost({
    libraries: [TypespecEventsX2FLibTestLibrary],
  });
}

export async function createTypespecEventsX2FLibTestRunner() {
  const host = await createTypespecEventsX2FLibTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypespecEventsX2FLib"]
  });
}

