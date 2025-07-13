import { z } from 'zod';

export const LanguageSchema = z.array(z.literal(['zod', 'go']));

export const SchemaNamingConventionSchema = z.literal(['camelCase', 'PascalCase']);

export const EmitterOptionsSchema = z
  .object({
    languages: LanguageSchema.optional(),
    schemaNamingConvention: SchemaNamingConventionSchema.optional(),
  })
  .optional();

export const InternalEmitterOptionsSchema = z
  .object({
    languages: LanguageSchema.default(['zod']),
    schemaNamingConvention: SchemaNamingConventionSchema.default('camelCase'),
  })
  .default(() => ({
    languages: ['zod'] as 'zod'[],
    schemaNamingConvention: 'camelCase' as const,
  }));

const { $schema: _, ...jsonSchema } = z.toJSONSchema(EmitterOptionsSchema);

export const EmitterOptionsJsonSchema = jsonSchema;

export type EmitterOptions = z.infer<typeof InternalEmitterOptionsSchema>;
