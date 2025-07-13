import type { DecoratorContext, Model, Program, StringLiteral } from '@typespec/compiler';
import { StateKeys } from './lib.js';

export const namespace = 'TypespecEvents';

export const $decorators = {
  [namespace]: {
    event,
  },
};

/**
 * Implementation of the `@event` decorator.
 * Marks a TypeSpec model as a tracking event and stores its name.
 *
 * @param context Decorator context.
 * @param target Decorator target. Must be a model.
 * @param name The name of the event (as a string literal).
 */
export function event(context: DecoratorContext, target: Model, name: StringLiteral) {
  context.program.stateMap(StateKeys.isEvent).set(target, name.value);
}

/**
 * Accessor to get the event name from the `@event` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target. Must be a model.
 * @returns The event name string if the `@event` decorator is applied with a name, otherwise undefined.
 */
export function getEventName(program: Program, target: Model): string | undefined {
  return program.stateMap(StateKeys.isEvent).get(target);
}

/**
 * Accessor to check if the `@event` decorator is applied to a model.
 *
 * @param program TypeSpec program.
 * @param target Decorator target. Must be a model.
 * @returns True if the `@event` decorator is applied, false otherwise.
 */
export function isEvent(program: Program, target: Model): boolean {
  return getEventName(program, target) != null;
}
