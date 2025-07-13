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

function handleModelType(program: Program, type_: Type): string {
  const type = type_ as Model;
  const properties = type.properties;
  const props: string[] = [];
  for (const prop of properties.values()) {
    const isOptional = prop.optional;
    let propZodString = typeSpecTypeToZodString(program, prop.type);
    if (isOptional) {
      propZodString += '.optional()';
    }
    props.push(`${prop.name}: ${propZodString}`);
  }
  return `z.object({ ${props.join(', ')} })`;
}

function handleUnionType(program: Program, type_: Type): string {
  const type = type_ as Union;
  const variants = Array.from(type.variants.values());
  const nonNullVariants = variants.filter((v: UnionVariant) => !isNullType(v.type));
  if (nonNullVariants.length === 0) {
    return 'z.null()';
  }
  const variantZodStrings = nonNullVariants.map((v: UnionVariant) => typeSpecTypeToZodString(program, v.type));
  let unionString = `z.union([${variantZodStrings.join(', ')}])`;

  const includesNull = variants.some((v: UnionVariant) => isNullType(v.type));
  if (includesNull) {
    unionString += '.nullable()';
  }
  return unionString;
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
  return `z.literal(${type.value})`; // Cast to any to access value
}

function handleTupleType(program: Program, type_: Type): string {
  const type = type_ as Tuple;
  const elementZodStrings = type.values.map((v: Type) => typeSpecTypeToZodString(program, v)); // Cast to any to access values
  return `z.tuple([${elementZodStrings.join(', ')}])`;
}

function handleArrayType(program: Program, type_: Type): string {
  const type = type_ as ArrayModelType; // We know it's a Model because isArrayModel checked it
  const elementType = type.indexer.value; // We know 'value' exists because isArrayModel checked it
  const elementZodString = typeSpecTypeToZodString(program, elementType);
  return `z.array(${elementZodString})`;
}

const typeHandlers: Map<string, (program: Program, type: Type) => string> = new Map([
  ['Model', handleModelType],
  ['Union', handleUnionType],
  ['Scalar', handleScalarType],
  ['String', handleStringType],
  ['Number', handleNumberType],
  ['Boolean', handleBooleanType],
  ['Tuple', handleTupleType],
]);

export function typeSpecTypeToZodString(program: Program, type: Type): string {
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
    return handleArrayType(program, type);
  }

  const handler = typeHandlers.get(type.kind);
  if (handler) {
    return handler(program, type);
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

  const zodSchemas: string[] = [];

  for (const [model, eventName] of eventModels.entries()) {
    let transformedEventName = eventName;
    if (namingConvention === 'PascalCase') {
      transformedEventName = pascalCase(eventName);
    } else {
      // default to camelCase
      transformedEventName = camelCase(eventName);
    }

    const schemaString = typeSpecTypeToZodString(program, model);
    zodSchemas.push(`export const ${transformedEventName}Schema = ${schemaString};`);
  }

  const fileContent = `import { z } from 'zod';\n\n${zodSchemas.join('\n\n')}`;

  await emitFile(program, {
    path: resolvePath(context.emitterOutputDir, 'events.zod.ts'),
    content: fileContent,
  });
}
