import {
  type ArrayModelType,
  type BooleanLiteral,
  type EmitContext,
  emitFile,
  isArrayModelType,
  isNeverType,
  isNullType,
  isUnknownType,
  isVoidType,
  type Model,
  type NumericLiteral,
  type Program,
  resolvePath,
  type Scalar,
  type StringLiteral,
  type Tuple,
  type Type,
  type Union,
  type UnionVariant,
} from '@typespec/compiler';
import { camelCase, pascalCase } from 'scule';
import { StateKeys } from './lib.js';

// New function to get the schema name for a given TypeSpec type
function getSchemaName(program: Program, type: Type, namingConvention: 'camelCase' | 'PascalCase'): string | undefined {
  if (type.kind === 'Model') {
    // Check if it's an event model
    const eventName = program.stateMap(StateKeys.isEvent).get(type);
    if (eventName) {
      // It's an event model, use its transformed name
      return namingConvention === 'PascalCase' ? pascalCase(eventName) : camelCase(eventName);
    }
    // It's a non-event model, use its own name transformed
    return namingConvention === 'PascalCase' ? pascalCase(type.name) : camelCase(type.name);
  }
  // Return undefined for types that don't have a dedicated schema name
  return;
}

function handleScalarType(_program: Program, type_: Type): string {
  const type = type_ as Scalar;
  switch (type.name) {
    case 'string':
      return 'z.string()';
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'integer':
      return 'z.number().int()';
    case 'float32':
    case 'float64':
    case 'decimal':
    case 'decimal128':
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'plainDate':
    case 'plainTime':
    case 'utcDateTime':
    case 'offsetDateTime':
    case 'duration':
    case 'bytes':
      return 'z.string()';
    case 'url':
      return 'z.string().url()';
    default:
      return 'z.unknown()';
  }
}

function handleStringType(_program: Program, type_: Type): string {
  const type = type_ as StringLiteral;
  return `z.literal("${type.value}")`;
}

function handleNumberType(_program: Program, type_: Type): string {
  const type = type_ as NumericLiteral;
  return `z.literal(${type.value})`;
}

function handleBooleanType(_program: Program, type_: Type): string {
  const type = type_ as BooleanLiteral;
  return `z.literal(${type.value})`;
}

function handleTupleType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as Tuple;
  const elementZodStrings = type.values.map((v: Type) =>
    typeSpecTypeToZodString(program, v, namingConvention, generatedSchemas),
  );
  return `z.tuple([${elementZodStrings.join(', ')}])`;
}

function handleArrayType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as ArrayModelType;
  const elementType = type.indexer.value;
  const elementZodString = typeSpecTypeToZodString(program, elementType, namingConvention, generatedSchemas);
  return `z.array(${elementZodString})`;
}

function handleModelType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as Model;
  const properties = type.properties;
  const props: string[] = [];
  for (const prop of properties.values()) {
    const isOptional = prop.optional;
    let propZodString = typeSpecTypeToZodString(program, prop.type, namingConvention, generatedSchemas);
    if (isOptional) {
      propZodString += '.optional()';
    }
    props.push(`${prop.name}: ${propZodString}`);
  }
  return `z.object({ ${props.join(', ')} })`;
}

function handleUnionType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as Union;
  const variants = Array.from(type.variants.values());
  const nonNullVariants = variants.filter((v: UnionVariant) => !isNullType(v.type));
  if (nonNullVariants.length === 0) {
    return 'z.null()';
  }
  const variantZodStrings = nonNullVariants.map((v: UnionVariant) =>
    typeSpecTypeToZodString(program, v.type, namingConvention, generatedSchemas),
  );
  let unionString = `z.union([${variantZodStrings.join(', ')}])`;

  const includesNull = variants.some((v: UnionVariant) => isNullType(v.type));
  if (includesNull) {
    unionString += '.nullable()';
  }
  return unionString;
}

const typeHandlers: Map<
  string,
  (
    program: Program,
    type: Type,
    namingConvention: 'camelCase' | 'PascalCase',
    generatedSchemas: Map<string, string>,
  ) => string
> = new Map([
  ['Model', handleModelType],
  ['Union', handleUnionType],
  ['Scalar', handleScalarType],
  ['String', handleStringType],
  ['Number', handleNumberType],
  ['Boolean', handleBooleanType],
  ['Tuple', handleTupleType],
]);

export function typeSpecTypeToZodString(
  program: Program,
  type: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  if (isNullType(type)) {
    return 'z.null()';
  }
  if (isNeverType(type)) {
    return 'z.never()';
  }
  if (isUnknownType(type)) {
    return 'z.unknown()';
  }
  if (isVoidType(type)) {
    return 'z.void()';
  }

  // Handle arrays before general models
  if (type.kind === 'Model' && isArrayModelType(program, type)) {
    return handleArrayType(program, type, namingConvention, generatedSchemas);
  }

  // Check if this model has already been generated as a separate schema
  if (type.kind === 'Model') {
    const schemaName = getSchemaName(program, type, namingConvention);
    if (schemaName && generatedSchemas.has(schemaName)) {
      return schemaName; // Return the schema name instead of generating inline
    }
  }

  const handler = typeHandlers.get(type.kind);
  if (handler) {
    return handler(program, type, namingConvention, generatedSchemas);
  }

  // Fallback for unhandled types
  return 'z.unknown()';
}

export async function $onEmit(context: EmitContext) {
  const program = context.program;
  const eventModels = program.stateMap(StateKeys.isEvent) as Map<Model, string>;

  const emitterOptions = context.options as {
    schemaNamingConvention?: 'camelCase' | 'PascalCase';
  };
  const namingConvention = emitterOptions.schemaNamingConvention ?? 'camelCase'; // Default to camelCase

  const generatedSchemas = new Map<string, string>(); // Map to store generated schemas for non-event models

  // First pass: Identify and generate schemas for non-event models used within event models
  for (const model of eventModels.keys()) {
    for (const prop of model.properties.values()) {
      if (prop.type.kind === 'Model' && !eventModels.has(prop.type)) {
        const schemaName = getSchemaName(program, prop.type, namingConvention);
        if (schemaName && !generatedSchemas.has(schemaName)) {
          const schemaString = handleModelType(program, prop.type, namingConvention, generatedSchemas); // Recursively handle nested models
          generatedSchemas.set(schemaName, `export const ${schemaName} = ${schemaString};`);
        }
      }
    }
  }

  const eventSchemas: string[] = [];
  const eventMapEntries: string[] = [];

  // Second pass: Generate schemas for event models and the event map
  for (const [model, eventName] of eventModels.entries()) {
    let transformedEventName = eventName;
    if (namingConvention === 'PascalCase') {
      transformedEventName = pascalCase(eventName);
    } else {
      // default to camelCase
      transformedEventName = camelCase(eventName);
    }

    // Use the modified typeSpecTypeToZodString which will reference generatedSchemas
    const schemaString = typeSpecTypeToZodString(program, model, namingConvention, generatedSchemas);
    eventSchemas.push(`export const ${transformedEventName}Schema = ${schemaString};`);

    // Collect mapping entry: original event name -> transformed schema name
    eventMapEntries.push(`  ${JSON.stringify(eventName)}: ${transformedEventName}Schema,`);
  }

  // Combine all generated schemas (nested models + event models)
  const allSchemas = Array.from(generatedSchemas.values()).concat(eventSchemas);

  // Generate the combined Zod schema and event map file content
  const combinedFileContent = `import { z } from 'zod';

${allSchemas.join('\n\n')}

export const eventSchemas = {
${eventMapEntries.join('\n')}
} as const;
`;

  await emitFile(program, {
    path: resolvePath(context.emitterOutputDir, 'events.zod.ts'),
    content: combinedFileContent,
  });
}
