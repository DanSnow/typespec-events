import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Diagnostic, resolvePath } from '@typespec/compiler';
import { createTestHost, createTestWrapper, expectDiagnosticEmpty } from '@typespec/compiler/testing';
import { TypespecEventsEmitterLibrary } from '../src/testing/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createTypespecEventsEmitterTestHost() {
  return createTestHost({
    libraries: [TypespecEventsEmitterLibrary],
  });
}

export async function createTypespecEventsEmitterTestRunner() {
  const host = await createTypespecEventsEmitterTestHost();
  const distDir = resolve(__dirname, '../dist');

  // No idea why the dist folder isn't add to test fs
  await host.addRealFolder('/test/node_modules/@typespec-events/emitter/dist', distDir);

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ['@typespec-events/emitter'],
    },
  });
}

export async function emitWithDiagnostics(code: string): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createTypespecEventsEmitterTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: 'tsp-output',
  });
  const emitterOutputDir = './tsp-output/@typespec-events/emitter';
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    // TODO: fix this
    // biome-ignore lint/nursery/noAwaitInLoop: TODO
    result[file] = (await runner.program.host.readFile(resolvePath(emitterOutputDir, file))).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
