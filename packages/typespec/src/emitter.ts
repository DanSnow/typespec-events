import { type EmitContext, emitFile, type Model, resolvePath } from '@typespec/compiler';
import type { LanguageEmitter } from './emitter/framework/emitter-framework.js';
import { GoEmitter } from './emitter/go-emitter.js';
import { ZodEmitter } from './emitter/zod-emitter.js';
import { type EmitterOptions, EmitterOptionsSchema, InternalEmitterOptionsSchema } from './emitter-options.js';
import { StateKeys } from './lib.js';

function collectNonEventModels(eventModels: Map<Model, string>): Set<Model> {
  const nonEventModels = new Set<Model>();
  const queue: Model[] = [];
  for (const eventModel of eventModels.keys()) {
    queue.push(eventModel);
  }

  while (queue.length > 0) {
    const model = queue.shift();
    if (!model) {
      break;
    }

    for (const prop of model.properties.values()) {
      if (prop.type.kind === 'Model' && !eventModels.has(prop.type)) {
        queue.push(prop.type);
      }
    }

    if (!eventModels.has(model)) {
      nonEventModels.add(model);
    }
  }
  // Reverse the order of the nonEventModels Set
  const reversedNonEventModels = Array.from(nonEventModels).reverse();
  return new Set(reversedNonEventModels);
}

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const program = context.program;
  const eventModels = program.stateMap(StateKeys.isEvent) as Map<Model, string>;

  const emitterOptions = InternalEmitterOptionsSchema.parse(context.options);
  const languages = emitterOptions.languages;

  // Collect all non-event models
  const nonEventModels = collectNonEventModels(eventModels);

  // Create instances of the specified emitters
  const emitters: LanguageEmitter[] = [];
  if (languages.includes('zod')) {
    emitters.push(new ZodEmitter());
  }
  if (languages.includes('go')) {
    emitters.push(new GoEmitter());
  }

  const internalContext: EmitContext<EmitterOptions> = {
    ...context,
    options: emitterOptions,
  };
  // Run each emitter
  for (const emitter of emitters) {
    emitter.init(program, internalContext);
    const { path, content } = emitter.emit([...Array.from(nonEventModels), ...eventModels.keys()], eventModels);
    await emitFile(program, {
      path: resolvePath(context.emitterOutputDir, path),
      content,
    });
  }
}
