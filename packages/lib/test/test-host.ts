import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Diagnostic, resolvePath } from '@typespec/compiler';
import { createTestHost, createTestWrapper, expectDiagnosticEmpty } from '@typespec/compiler/testing';
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
    compilerOptions: {
      noEmit: false,
      emit: ['@typespec-events/lib'],
    },
  });
}

export async function emitWithDiagnostics(code: string): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createTypespecEventsTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: 'tsp-output',
  });
  const emitterOutputDir = './tsp-output/@typespec-events/lib';
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    // biome-ignore lint/nursery/noAwaitInLoop: This is for testing
    result[file] = (await runner.program.host.readFile(resolvePath(emitterOutputDir, file))).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
