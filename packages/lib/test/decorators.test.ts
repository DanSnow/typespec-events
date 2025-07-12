import { strictEqual } from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { Model } from '@typespec/compiler';
import { type BasicTestRunner, expectDiagnostics } from '@typespec/compiler/testing';
import { isEvent } from '../src/decorators.js';
import { createTypespecEventsX2FLibTestRunner } from './test-host.js';

describe('decorators', () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTypespecEventsX2FLibTestRunner();
  });

  describe('@event', () => {
    it('set event on model', async () => {
      const { test } = (await runner.compile('@event @test model TestEvent {}')) as { test: Model };
      strictEqual(isEvent(runner.program, test), true);
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
