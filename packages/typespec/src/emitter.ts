import {
  type EmitContext,
  emitFile,
  isNeverType,
  isNullType,
  isUnknownType,
  isVoidType,
  type Model,
  type Program,
  resolvePath,
  type Type,
  type UnionVariant,
} from '@typespec/compiler';
import { StateKeys } from './lib.js';

function typeSpecTypeToZodString(program: Program, type: Type): string {
  if (type.kind === 'Model') {
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
  if (type.kind === 'Union') {
    const variants = Array.from(type.variants.values());
    const nonNullVariants = variants.filter(
      (v: UnionVariant) => !isNullType(v.type)
    );
    if (nonNullVariants.length === 0) {
      return 'z.null()';
    }
    const variantZodStrings = nonNullVariants.map((v: UnionVariant) =>
      typeSpecTypeToZodString(program, v.type)
    );
    let unionString = `z.union([${variantZodStrings.join(', ')}])`;

    const includesNull = variants.some((v: UnionVariant) => isNullType(v.type));
    if (includesNull) {
      unionString += '.nullable()';
    }
    return unionString;
  }
  if (type.kind === 'Scalar') {
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
      case 'uuid':
        return 'z.string().uuid()';
      default:
        return 'z.unknown()';
    }
  }
  if (type.kind === 'String') {
    return `z.literal("${type.value}")`;
  }
  if (type.kind === 'Number') {
    return `z.literal(${type.value})`;
  }
  if (type.kind === 'Boolean') {
    return `z.literal(${type.value})`;
  }
  if (isNullType(type)) {
    return 'z.null()';
  }
  if (type.kind === 'Tuple') {
    const elementZodStrings = type.values.map((v) =>
      typeSpecTypeToZodString(program, v)
    );
    return `z.tuple([${elementZodStrings.join(', ')}])`;
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

  // Fallback for unhandled types
  return 'z.unknown()';
}

export async function $onEmit(context: EmitContext) {
  const program = context.program;
  const eventModels = program.stateMap(StateKeys.isEvent) as Map<Model, string>;

  const zodSchemas: string[] = [];

  for (const [model, eventName] of eventModels.entries()) {
    const schemaString = typeSpecTypeToZodString(program, model);
    zodSchemas.push(`export const ${eventName}Schema = ${schemaString};`);
  }

  const fileContent = `import { z } from 'zod';\n\n${zodSchemas.join('\n\n')}`;

  await emitFile(program, {
    path: resolvePath(context.emitterOutputDir, 'events.zod.ts'),
    content: fileContent,
  });
}
