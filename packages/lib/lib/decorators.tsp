import "../dist/src/decorators.js";

using TypeSpec.Reflection;

namespace TypespecEvents;

/**
 * Marks a TypeSpec model as a tracking event.
 */
extern dec event(target: Model);
