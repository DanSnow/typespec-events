import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CompilerOptions, type Diagnostic, type Program, resolvePath } from '@typespec/compiler';
import { createTestHost, createTestWrapper, expectDiagnosticEmpty } from '@typespec/compiler/testing';
import { PACKAGE_NAME } from '../src/consts.js';
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
  await host.addRealFolder(`/test/node_modules/${PACKAGE_NAME}/dist`, distDir);

  return createTestWrapper(host, {
    autoUsings: ['TypespecEvents'],
    compilerOptions: {
      noEmit: false,
      emit: [PACKAGE_NAME],
    },
  });
}

export function assertDefined<T>(value: T | undefined | null): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error('Expected value to be defined');
  }
}

export async function compileTypeSpec(code: string): Promise<{ program: Program; diagnostics: readonly Diagnostic[] }> {
  const runner = await createTypespecEventsTestRunner();
  await runner.compileAndDiagnose(code);
  return { program: runner.program, diagnostics: runner.program.diagnostics };
}

export async function emitWithDiagnostics(
  code: string,
  compilerOptions?: CompilerOptions
): Promise<[Record<string, string>, readonly Diagnostic[]]> {
  const runner = await createTypespecEventsTestRunner();
  const defaultCompilerOptions: CompilerOptions = {
    noEmit: false,
    emit: [PACKAGE_NAME],
    outputDir: 'tsp-output',
    options: {}, // Initialize options object
  };
  // Merge provided compilerOptions with default compiler options
  const mergedCompilerOptions: CompilerOptions = {
    ...defaultCompilerOptions,
    ...compilerOptions, // Merge top-level compiler options
    options: {
      // Merge the options property specifically
      ...defaultCompilerOptions.options, // Start with default options
      ...(compilerOptions?.options || {}), // Merge any options provided by the test, including the nested emitter options
    },
  };

  // Ensure the emitter is in the 'emit' array if not already
  if (mergedCompilerOptions.emit && !mergedCompilerOptions.emit.includes(PACKAGE_NAME)) {
    mergedCompilerOptions.emit.push(PACKAGE_NAME);
  }

  await runner.compileAndDiagnose(code, mergedCompilerOptions);
  const emitterOutputDir = `./tsp-output/${PACKAGE_NAME}`;
  const files = await runner.program.host.readDir(emitterOutputDir);

  const result: Record<string, string> = {};
  for (const file of files) {
    // biome-ignore lint/nursery/noAwaitInLoop: This is for testing
    result[file] = (await runner.program.host.readFile(resolvePath(emitterOutputDir, file))).text;
  }
  return [result, runner.program.diagnostics];
}

export async function emit(code: string, compilerOptions?: CompilerOptions): Promise<Record<string, string>> {
  const [result, diagnostics] = await emitWithDiagnostics(code, compilerOptions);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
