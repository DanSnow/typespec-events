import type { Model } from '@typespec/compiler';
import { type BasicTestRunner, expectDiagnostics } from '@typespec/compiler/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from '../src/consts.js';
import { getEventName, isEvent } from '../src/decorators.js';
import { createTypespecEventsTestRunner } from './test-host.js';

describe('decorators', () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTypespecEventsTestRunner();
  });

  describe('@event', () => {
    it('sets and retrieves event name on model', async () => {
      const eventName = 'my_test_event'; // Changed to snake_case
      const { TestEvent } = (await runner.compile(`@event("${eventName}") @test model TestEvent {}`)) as {
        TestEvent: Model;
      };
      expect(getEventName(runner.program, TestEvent)).toBe(eventName);
    });

    it('correctly identifies a model as an event', async () => {
      const eventName = 'another_test_event'; // Changed to snake_case
      const { TestEvent, NotAnEvent } = (await runner.compile(`
        @event("${eventName}") @test model TestEvent {}
        @test model NotAnEvent {}
        `)) as {
        TestEvent: Model;
        NotAnEvent: Model;
      };
      expect(isEvent(runner.program, TestEvent)).toBe(true);
      expect(isEvent(runner.program, NotAnEvent)).toBe(false);
    });

    it('emits diagnostic if not used on a model', async () => {
      const diagnostics = await runner.diagnose('@event("invalid_event") op test(): void;'); // Changed to snake_case
      expectDiagnostics(diagnostics, {
        severity: 'error',
        code: 'decorator-wrong-target',
        message: 'Cannot apply @event decorator to test since it is not assignable to Model',
      });
    });

    it('emits diagnostic if event name is not snake_case', async () => {
      const diagnostics = await runner.diagnose(`@event("CamelCaseEvent") @test model InvalidEventName {}`);
      expectDiagnostics(diagnostics, {
        severity: 'error',
        code: `${PACKAGE_NAME}/typespec-events-snake-case`,
        message: `Event name "CamelCaseEvent" must be in snake_case (e.g., "camel_case_event").`,
      });
    });
  });
});
