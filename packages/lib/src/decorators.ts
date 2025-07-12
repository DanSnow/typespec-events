import type { DecoratorContext, Model, Program } from '@typespec/compiler';
import { StateKeys } from './lib.js';

export const namespace = 'TypespecEvents';

/**
 * Implementation of the `@event` decorator.
 * Marks a TypeSpec model as a tracking event.
 *
 * @param context Decorator context.
 * @param target Decorator target. Must be a model.
 */
export function $event(context: DecoratorContext, target: Model) {
  context.program.stateMap(StateKeys.isEvent).set(target, true);
}

/**
 * Accessor for the `@event` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target. Must be a model.
 * @returns True if the `@event` decorator is applied to the model, false otherwise.
 */
export function isEvent(program: Program, target: Model): boolean {
  return program.stateMap(StateKeys.isEvent).get(target) === true;
}
