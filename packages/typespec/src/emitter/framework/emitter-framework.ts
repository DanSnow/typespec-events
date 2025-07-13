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
  /**
   * Emits the code for a language-specific struct definition based on a TypeSpec model.
   * @param models All TypeSpec models.
   * @param eventModels The TypeSpec event models.
   * @returns The path and content of the generated file.
   */
  emit(models: Model[], eventModels: Map<Model, string>): { path: string; content: string };
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
