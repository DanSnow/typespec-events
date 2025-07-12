import { Diagnostic, resolvePath } from '@typespec/compiler';
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from '@typespec/compiler/testing';
import { TypespecEventsX2FEmitterTestLibrary } from '../src/testing/index.js';

export async function createTypespecEventsX2FEmitterTestHost() {
  return createTestHost({
    libraries: [TypespecEventsX2FEmitterTestLibrary],
  });
}

export async function createTypespecEventsX2FEmitterTestRunner() {
  const host = await createTypespecEventsX2FEmitterTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ['@typespec-events&#x2F;emitter'],
    },
  });
}

export async function emitWithDiagnostics(
  code: string
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createTypespecEventsX2FEmitterTestRunner();
  await runner.compileAndDiagnose(code, {
    outputDir: 'tsp-output',
  });
  const emitterOutputDir = './tsp-output/@typespec-events&#x2F;emitter';
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    result[file] = (
      await runner.program.host.readFile(resolvePath(emitterOutputDir, file))
    ).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
