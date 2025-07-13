// This file contains the Go emitter logic.

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
function getStructName(
  program: Program,
  type: Type,
  _namingConvention: 'camelCase' | 'PascalCase',
): string | undefined {
  if (type.kind === 'Model') {
    // Check if it's an event model
    const eventName = program.stateMap(StateKeys.isEvent).get(type);
    if (eventName) {
      // It's an event model, use its transformed name
      return pascalCase(eventName);
    }
    // It's a non-event model, use its own name transformed
    return pascalCase(type.name);
  }
  // Return undefined for types that don't have a dedicated schema name
  return;
}

// Export the getStructName function
export { getStructName };

function handleScalarType(_program: Program, type_: Type): string {
  const type = type_ as Scalar;
  switch (type.name) {
    case 'string':
      return 'string';
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
    case 'integer':
      return 'int';
    case 'float32':
    case 'float64':
    case 'decimal':
    case 'decimal128':
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'plainDate':
    case 'plainTime':
    case 'utcDateTime':
    case 'offsetDateTime':
    case 'duration':
    case 'bytes':
      return 'string';
    case 'url':
      return 'string';
    default:
      return 'interface{}';
  }
}

function handleStringType(_program: Program, type_: Type): string {
  const type = type_ as StringLiteral;
  return `"${type.value}"`;
}

function handleNumberType(_program: Program, type_: Type): string {
  const type = type_ as NumericLiteral;
  return `${type.value}`;
}

function handleBooleanType(_program: Program, type_: Type): string {
  const type = type_ as BooleanLiteral;
  return `${type.value}`;
}

function handleTupleType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as Tuple;
  const elementGoStrings = type.values.map((v: Type) =>
    typeSpecTypeToGoString(program, v, namingConvention, generatedSchemas),
  );
  return `[${elementGoStrings.length}]interface{}{${elementGoStrings.join(', ')}}`;
}

function handleArrayType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as ArrayModelType;
  const elementType = type.indexer.value;
  const elementGoString = typeSpecTypeToGoString(program, elementType, namingConvention, generatedSchemas);
  return `[]${elementGoString}`;
}

function handleModelType(
  program: Program,
  type_: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  const type = type_ as Model;

  // Check if this model has already been generated as a separate schema
  const structName = getStructName(program, type, namingConvention);
  if (structName && generatedSchemas.has(structName)) {
    return structName;
  }

  const properties = type.properties;
  const fields: string[] = [];
  for (const prop of properties.values()) {
    const isOptional = prop.optional;
    let propGoString = typeSpecTypeToGoString(program, prop.type, namingConvention, generatedSchemas);
    if (isOptional) {
      propGoString = `*${propGoString}`;
    }
    fields.push(`${pascalCase(prop.name)} ${propGoString} \`json:"${camelCase(prop.name)}"\``);
  }
  return `struct { ${fields.join('; ')} }`;
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
    return 'nil';
  }
  const variantGoStrings = nonNullVariants.map((v: UnionVariant) =>
    typeSpecTypeToGoString(program, v.type, namingConvention, generatedSchemas),
  );
  return `interface{}{${variantGoStrings.join(', ')}}`;

  // const includesNull = variants.some((v: UnionVariant) => isNullType(v.type));
  // if (includesNull) {
  //   unionString += '.nullable()';
  // }
  // return unionString;
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

export function typeSpecTypeToGoString(
  program: Program,
  type: Type,
  namingConvention: 'camelCase' | 'PascalCase',
  generatedSchemas: Map<string, string>,
): string {
  if (isNullType(type)) {
    return 'nil';
  }
  if (isNeverType(type)) {
    return 'interface{}';
  }
  if (isUnknownType(type)) {
    return 'interface{}';
  }
  if (isVoidType(type)) {
    return 'interface{}';
  }

  // Handle arrays before general models
  if (type.kind === 'Model' && isArrayModelType(program, type)) {
    return handleArrayType(program, type, namingConvention, generatedSchemas);
  }

  // Check if this model has already been generated as a separate schema
  if (type.kind === 'Model') {
    const structName = getStructName(program, type, namingConvention);
    if (structName && generatedSchemas.has(structName)) {
      return structName; // Return the schema name instead of generating inline
    }
  }

  const handler = typeHandlers.get(type.kind);
  if (handler) {
    return handler(program, type, namingConvention, generatedSchemas);
  }

  // Fallback for unhandled types
  return 'interface{}';
}

export class GoEmitter implements LanguageEmitter {
  private program!: Program;
  private context!: EmitContext<EmitterOptions>;
  private namingConvention: EmitterOptions['schemaNamingConvention'] = 'camelCase';

  init(program: Program, context: EmitContext<EmitterOptions>): void {
    this.program = program;
    this.context = context;
    const emitterOptions = context.options;
    this.namingConvention = emitterOptions.schemaNamingConvention;
  }

  emit(models: Model[], eventModels: Map<Model, string>): { path: string; content: string } {
    const generatedSchemas = new Map<string, string>();
    const eventMapEntries: string[] = [];
    const structDefinitions: string[] = [];

    // Generate struct definitions for all models
    for (const model of models) {
      this.emitModel(model, generatedSchemas, structDefinitions);
    }

    // Generate event map entries
    for (const [model, eventName] of eventModels.entries()) {
      const schemaName = getStructName(this.program, model, this.namingConvention);
      if (schemaName) {
        eventMapEntries.push(`  ${JSON.stringify(eventName)}: ${schemaName},`);
      }
    }

    // Combine all generated schemas
    // Generate the combined Go file content
    const combinedFileContent = `package main\n\n
${structDefinitions.join('\n\n')}
\n\n// Event Schemas\nvar EventSchemas = map[string]interface{}{
${eventMapEntries.join('\n')}
}`;

    return {
      path: 'events.go',
      content: combinedFileContent,
    };
  }

  private emitModel(model: Model, generatedSchemas: Map<string, string>, structDefinitions: string[]) {
    const properties = model.properties;
    const fields: string[] = [];
    for (const prop of properties.values()) {
      const isOptional = prop.optional;
      let propGoString = typeSpecTypeToGoString(this.program, prop.type, this.namingConvention, generatedSchemas);
      if (isOptional) {
        propGoString = `*${propGoString}`;
      }
      fields.push(`${pascalCase(prop.name)} ${propGoString} \`json:"${camelCase(prop.name)}"\``);
    }
    const structString = `type ${pascalCase(model.name)} struct { ${fields.join('; ')} }`;

    // Get the schema name and add to generated schemas
    const structName = getStructName(this.program, model, this.namingConvention);
    if (structName) {
      generatedSchemas.set(structName, structString);
      structDefinitions.push(structString);
    }
  }
}
