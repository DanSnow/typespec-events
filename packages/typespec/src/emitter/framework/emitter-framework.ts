import type { EmitContext, Model, ModelProperty, Program, Type } from '@typespec/compiler';
import { camelCase, pascalCase } from 'scule';

/**
 * Represents a definition for a field within a generated struct/object.
 */
export interface FieldDefinition {
  name: string;
  type: string;
  // Add other properties needed for language-specific tags, modifiers, etc.
  tags?: string;
  optional?: boolean;
}

/**
 * Represents a definition for a generated struct/object.
 */
export interface StructDefinition {
  name: string;
  fields: FieldDefinition[];
  // Add other properties needed for language-specific attributes, comments, etc.
  comments?: string;
}

/**
 * Abstract base class or interface for language-specific emitters.
 * Concrete implementations will provide the logic for generating code for a specific language.
 */
export interface LanguageEmitter {
  /**
   * Initializes the emitter with the TypeSpec program and context.
   * @param program The TypeSpec program.
   * @param context The emitter context.
   */
  init(program: Program, context: EmitContext): void;

  /**
   * Maps a TypeSpec model property to a language-specific field definition.
   * @param property The TypeSpec model property.
   * @returns The language-specific field definition.
   */
  mapPropertyToField(property: ModelProperty): FieldDefinition;

  /**
   * Emits the code for a language-specific struct definition based on a TypeSpec model.
   * @param model The TypeSpec model.
   * @param structDef The generated struct definition.
   * The generated code should be added to the emitter's internal map of generated schemas.
   */
  emitStruct(model: Model, structDef: StructDefinition): void;

  /**
   * Generates the header content for the output file (e.g., package declaration, imports).
   * @returns The header content string.
   */
  getFileHeader(): string;

  /**
   * Generates the footer content for the output file (e.g., closing brackets, helper functions).
   * @param eventMapEntries An array of strings representing the entries for the event map.
   * @returns The footer content string.
   */
  getFileFooter(eventMapEntries: string[]): string;

  /**
   * Maps a TypeSpec type to a language-specific type string.
   * @param type The TypeSpec type.
   * @returns The language-specific type string.
   */
  mapTypeToLanguageType(type: Type): string;

  // Add methods for handling other TypeSpec types if needed (enums, unions, etc.)
  // mapScalarToLanguageType(scalar: Scalar): string;
  // mapEnumToLanguageType(enumType: Enum): string;
  // mapUnionToLanguageType(unionType: Union): string;
  // mapTupleToLanguageType(tupleType: Tuple): string;
  // mapLiteralToLanguageType(literal: StringLiteral | NumericLiteral | BooleanLiteral): string;
  // mapIntrinsicToLanguageType(intrinsic: IntrinsicType): string;
  // mapArrayToLanguageType(array: ArrayModelType): string;
  // mapOperationToLanguageType(operation: Operation): string;

  /**
   * Gets the map of generated schemas from the language-specific emitter.
   * This is used by the main emitter to collect all generated schemas.
   * @returns A map where keys are schema names and values are the generated code strings.
   */
  getGeneratedSchemas(): Map<string, string>;
}

// Helper function to determine if a property is optional
export function isPropertyOptional(property: ModelProperty): boolean {
  return property.optional === true;
}

// Helper function to get the language-specific name for a model
export function getModelName(model: Model, namingConvention: 'camelCase' | 'PascalCase'): string {
  const name = model.name;
  if (namingConvention === 'PascalCase') {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return name.charAt(0).toLowerCase() + name.slice(1);
}

// Helper function to get the language-specific name for a property
export function getPropertyName(property: ModelProperty, namingConvention: 'camelCase' | 'PascalCase'): string {
  const name = property.name;
  if (namingConvention === 'PascalCase') {
    return pascalCase(name);
  }
  return camelCase(name);
}
