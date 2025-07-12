import type { Model } from '@typespec/compiler';
import { type BasicTestRunner, expectDiagnostics } from '@typespec/compiler/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { isEvent } from '../src/decorators.js';
import { createTypespecEventsTestRunner } from './test-host.js';

describe('decorators', () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTypespecEventsTestRunner();
  });

  describe('@event', () => {
    it('set event on model', async () => {
      const { TestEvent } = (await runner.compile('@event @test model TestEvent {}')) as { TestEvent: Model };
      expect(isEvent(runner.program, TestEvent)).toBe(true);
    });

    it('emit diagnostic if not used on a model', async () => {
      const diagnostics = await runner.diagnose('@event op test(): void;');
      expectDiagnostics(diagnostics, {
        severity: 'error',
        code: 'decorator-wrong-target',
        message: 'Cannot apply @event decorator to test since it is not assignable to Model',
      });
    });
  });
});
