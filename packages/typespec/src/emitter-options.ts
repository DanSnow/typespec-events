import { z } from 'zod';

export const LanguageSchema = z.array(z.literal(['zod', 'go']));

export const SchemaNamingConventionSchema = z.literal(['camelCase', 'PascalCase']);

export const EmitterOptionsSchema = z
  .object({
    languages: LanguageSchema.default(['zod']),
    schemaNamingConvention: SchemaNamingConventionSchema.default('camelCase'),
  })
  .default(() => ({
    languages: ['zod'] as 'zod'[],
    schemaNamingConvention: 'camelCase' as const,
  }));

export const EmitterOptionsJsonSchema = z.toJSONSchema(EmitterOptionsSchema, { io: 'input', target: 'draft-7' });

export type EmitterOptions = z.infer<typeof EmitterOptionsSchema>;
