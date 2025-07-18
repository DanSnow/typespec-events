import {
  type ArrayModelType,
  type BooleanLiteral,
  type EmitContext,
  isArrayModelType,
  isNeverType,
  isNullType,
  isUnknownType,
  isVoidType,
  type Model,
  type NumericLiteral,
  type Program,
  type Scalar,
  type StringLiteral,
  type Tuple,
  type Type,
  type Union,
  type UnionVariant,
} from '@typespec/compiler';
import { camelCase, pascalCase } from 'scule';
import type { EmitterOptions } from '../emitter-options.js';
import { StateKeys } from '../lib.js';
import type { LanguageEmitter } from './framework/emitter-framework.js';

// New function to get the schema name for a given TypeSpec type
function getSchemaName(program: Program, type: Type, namingConvention: 'camelCase' | 'PascalCase'): string | undefined {
  if (type.kind === 'Model') {
    // Check if it's an event model
    const eventName = program.stateMap(StateKeys.isEvent).get(type);
    if (eventName) {
      // It's an event model, use its transformed name
      return `${namingConvention === 'PascalCase' ? pascalCase(eventName) : camelCase(eventName)}Schema`;
    }
    // It's a non-event model, use its own name transformed
    return `${namingConvention === 'PascalCase' ? pascalCase(type.name) : camelCase(type.name)}Schema`;
  }
  // Return undefined for types that don't have a dedicated schema name
  return;
}

// Export the getSchemaName function
export { getSchemaName };

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

  // Check if this model has already been generated as a separate schema
  const schemaName = getSchemaName(program, type, namingConvention);
  if (schemaName && generatedSchemas.has(schemaName)) {
    return schemaName;
  }

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

export class ZodEmitter implements LanguageEmitter {
  private program!: Program;
  private namingConvention: 'camelCase' | 'PascalCase' = 'camelCase';

  init(program: Program, context: EmitContext<EmitterOptions>): void {
    this.program = program;
    const emitterOptions = context.options;
    this.namingConvention = emitterOptions.schemaNamingConvention;
  }

  emit(models: Model[], eventModels: Map<Model, string>): { path: string; content: string } {
    const generatedSchemas = new Map<string, string>();
    const eventMapEntries: string[] = [];

    // Generate schemas for all models
    for (const model of models) {
      this.emitModel(model, generatedSchemas);
    }

    // Generate event map entries
    for (const [model, eventName] of eventModels.entries()) {
      const schemaName = getSchemaName(this.program, model, this.namingConvention);
      if (schemaName) {
        eventMapEntries.push(`  ${JSON.stringify(eventName)}: ${schemaName},`);
      }
    }

    // Combine all generated schemas
    const allSchemas = Array.from(generatedSchemas.values());

    // Generate the combined Zod schema and event map file content
    const combinedFileContent = `import { z } from 'zod';\n
${allSchemas.join('\n\n')}
\n\nexport const eventSchemas = {
${eventMapEntries.join('\n')}
} as const;
`;

    return {
      path: 'events.zod.ts',
      content: combinedFileContent,
    };
  }

  private emitModel(model: Model, generatedSchemas: Map<string, string>) {
    const properties = model.properties;
    const props: string[] = [];
    for (const prop of properties.values()) {
      const isOptional = prop.optional;
      let propZodString = typeSpecTypeToZodString(this.program, prop.type, this.namingConvention, generatedSchemas);
      if (isOptional) {
        propZodString += '.optional()';
      }
      props.push(`${prop.name}: ${propZodString}`);
    }
    const schemaString = `z.object({ ${props.join(', ')} })`;

    // Get the schema name and add to generated schemas
    const schemaName = getSchemaName(this.program, model, this.namingConvention);
    if (schemaName) {
      generatedSchemas.set(schemaName, `export const ${schemaName} = ${schemaString};`);
    }
  }
}
