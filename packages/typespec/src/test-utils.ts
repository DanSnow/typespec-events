import type { Program, Type } from '@typespec/compiler';
import {
  type BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
} from '@typespec/compiler/testing';
import { stripIndent } from 'proper-tags';

export async function createTestRunner() {
  const host = await createTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: true,
    },
  });
}

export async function compile(
  code: string,
): Promise<{ models: Record<string, Type>; runner: BasicTestRunner; program: Program }> {
  const runner = await createTestRunner();
  const [models, diagnostics] = await runner.compileAndDiagnose(code);
  expectDiagnosticEmpty(diagnostics);

  return { models, runner, program: runner.program };
}

export const typespec = stripIndent;
