import "../dist/decorators.js";

using TypeSpec.Reflection;

namespace TypespecEvents;

/**
 * Marks a TypeSpec model as a tracking event and provides an event name.
 */
extern dec event(target: Model, name: string);
