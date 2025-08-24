import { type EmitContext, emitFile, type Model, type Program, resolvePath } from '@typespec/compiler';
import type { LanguageEmitter } from './emitter/framework/emitter-framework.js';
import { getBaseModel } from './emitter/framework/utils.js';
import { GoEmitter } from './emitter/go-emitter.js';
import { MarkdownEmitter } from './emitter/markdown-emitter.js';
import { ZodEmitter } from './emitter/zod-emitter.js';
import { type EmitterOptions, EmitterOptionsSchema } from './emitter-options.js';
import { StateKeys } from './lib.js';

/**
 * BFS traverse helper
 * @param initialItems  Initial queue
 * @param callback callback to process items
 */
function traverse<T>(initialItems: T[], callback: (item: T, addToQueue: (...moreItems: T[]) => void) => void) {
  const queue = initialItems.slice();

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) {
      break;
    }
    callback(item, (...moreItems) => {
      queue.push(...moreItems);
    });
  }
}

function collectNonEventModels(eventModels: Map<Model, string>, program: Program): Set<Model> {
  const nonEventModels = new Set<Model>();

  traverse(Array.from(eventModels.keys()), (model: Model, addToQueue) => {
    for (const prop of model.properties.values()) {
      if (prop.type.kind === 'Model' && !eventModels.has(prop.type)) {
        const baseModel = getBaseModel(program, prop.type);
        if (!baseModel) {
          continue;
        }
        addToQueue(baseModel);
      }
    }

    if (!eventModels.has(model)) {
      nonEventModels.add(model);
    }
  });

  // Reverse the order of the nonEventModels Set
  const reversedNonEventModels = Array.from(nonEventModels).reverse();
  return new Set(reversedNonEventModels);
}

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const program = context.program;
  const eventModels = program.stateMap(StateKeys.isEvent) as Map<Model, string>;

  const emitterOptions = EmitterOptionsSchema.parse(context.options);
  const languages = emitterOptions.languages;

  // Collect all non-event models
  const nonEventModels = collectNonEventModels(eventModels, program);

  // Create instances of the specified emitters
  const emitters: LanguageEmitter[] = [];
  if (languages.includes('zod')) {
    emitters.push(new ZodEmitter());
  }
  if (languages.includes('go')) {
    emitters.push(new GoEmitter());
  }
  if (languages.includes('markdown')) {
    emitters.push(new MarkdownEmitter());
  }

  const internalContext: EmitContext<EmitterOptions> = {
    ...context,
    options: emitterOptions,
  };
  // Run each emitter
  await Promise.all(
    emitters.map(async (emitter) => {
      emitter.init(program, internalContext);
      const { path, content } = emitter.emit([...Array.from(nonEventModels), ...eventModels.keys()], eventModels);
      await emitFile(program, {
        path: resolvePath(context.emitterOutputDir, path),
        content,
      });
    }),
  );
}
