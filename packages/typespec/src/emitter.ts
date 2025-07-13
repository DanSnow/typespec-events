import { type EmitContext, emitFile, type Model, resolvePath } from '@typespec/compiler';
import type { LanguageEmitter, StructDefinition } from './emitter/framework/emitter-framework.js';
import { getSchemaName, ZodEmitter } from './emitter/zod-emitter.js'; // Import getSchemaName
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

export async function $onEmit(context: EmitContext) {
  const program = context.program;
  const eventModels = program.stateMap(StateKeys.isEvent) as Map<Model, string>;

  // Determine which emitter to use based on options (for now, only Zod)
  // In the future, we would check context.options for a target language
  const emitter: LanguageEmitter = new ZodEmitter();
  emitter.init(program, context);

  const generatedSchemas = emitter.getGeneratedSchemas();

  const eventMapEntries: string[] = [];

  const emitterOptions = context.options as {
    schemaNamingConvention?: 'camelCase' | 'PascalCase';
  };
  const namingConvention = emitterOptions.schemaNamingConvention ?? 'camelCase';

  // Collect all non-event models using BFS
  const nonEventModels = collectNonEventModels(eventModels);

  // Emit schemas for all non-event models
  for (const model of nonEventModels) {
    const structDef: StructDefinition = {
      name: model.name,
      fields: Array.from(model.properties.values()).map((prop) => emitter.mapPropertyToField(prop)),
    };
    emitter.emitStruct(model, structDef);
  }

  // Collect all event models
  const eventModelsToEmit = new Set<Model>(eventModels.keys());

  // Emit schemas for all event models
  for (const model of eventModelsToEmit) {
    const structDef: StructDefinition = {
      name: model.name,
      fields: Array.from(model.properties.values()).map((prop) => emitter.mapPropertyToField(prop)),
    };
    emitter.emitStruct(model, structDef);
  }

  // Generate event map entries
  for (const [model, eventName] of eventModels.entries()) {
    const schemaName = getSchemaName(program, model, namingConvention);
    if (schemaName) {
      eventMapEntries.push(`  ${JSON.stringify(eventName)}: ${schemaName},`);
    }
  }

  // Combine all generated schemas from the emitter
  const allSchemas = Array.from(generatedSchemas.values());

  // Generate the combined Zod schema and event map file content
  const combinedFileContent = `${emitter.getFileHeader()}
${allSchemas.join('\n\n')}
${emitter.getFileFooter(eventMapEntries)}
`;

  await emitFile(program, {
    path: resolvePath(context.emitterOutputDir, 'events.zod.ts'),
    content: combinedFileContent,
  });
}
