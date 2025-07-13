import { describe, expect, it } from 'vitest';
import { PACKAGE_NAME } from '../src/consts.js';
import { typeSpecTypeToZodString } from '../src/emitter/zod-emitter.js';
import { assertDefined, compileTypeSpec, emit } from './test-host.js';

it('emit events.zod.ts with camelCase (default)', async () => {
  const results = await emit('@event("cta_clicked") model CtaClicked { title: string}');
  expect(results['events.zod.ts']).toMatchSnapshot();
});

it('emit events.zod.ts with PascalCase', async () => {
  const results = await emit('@event("cta_clicked") model CtaClicked { title: string}', {
    options: {
      [PACKAGE_NAME]: {
        schemaNamingConvention: 'PascalCase',
      },
    },
  });
  expect(results['events.zod.ts']).toMatchSnapshot();
});

describe('typeSpecTypeToZodString', () => {
  it('should handle simple model', async () => {
    const { program, diagnostics } = await compileTypeSpec('model SimpleModel { name: string, age: integer }');
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('SimpleModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ name: z.string(), age: z.number().int() })',
    );
  });

  it('should handle model with optional properties', async () => {
    const { program, diagnostics } = await compileTypeSpec('model OptionalModel { name?: string, age?: integer }');
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('OptionalModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ name: z.string().optional(), age: z.number().int().optional() })',
    );
  });

  it('should handle nested models', async () => {
    const { program, diagnostics } = await compileTypeSpec(`
      model Address { street: string, city: string }
      model User { name: string, address: Address }
    `);
    expect(diagnostics.length).toBe(0);
    const userModel = program.resolveTypeReference('User')[0];
    assertDefined(userModel);
    expect(typeSpecTypeToZodString(program, userModel, 'camelCase', new Map())).toBe(
      'z.object({ name: z.string(), address: z.object({ street: z.string(), city: z.string() }) })',
    );
  });

  it('should handle arrays of primitive types', async () => {
    const { program, diagnostics } = await compileTypeSpec('model ArrayModel { names: string[], ages: integer[] }');
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('ArrayModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ names: z.array(z.string()), ages: z.array(z.number().int()) })',
    );
  });

  it('should handle arrays of models', async () => {
    const { program, diagnostics } = await compileTypeSpec(`
      model Item { id: string }
      model ItemList { items: Item[] }
    `);
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('ItemList')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ items: z.array(z.object({ id: z.string() })) })',
    );
  });

  it('should handle unions', async () => {
    const { program, diagnostics } = await compileTypeSpec('model UnionModel { value: string | integer | boolean }');
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('UnionModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ value: z.union([z.string(), z.number().int(), z.boolean()]) })',
    );
  });

  it('should handle nullable unions', async () => {
    const { program, diagnostics } = await compileTypeSpec(
      'model NullableUnionModel { value: string | null | integer }',
    );
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('NullableUnionModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ value: z.union([z.string(), z.number().int()]).nullable() })',
    );
  });

  it('should handle tuples', async () => {
    const { program, diagnostics } = await compileTypeSpec('model TupleModel { coords: [string, integer, boolean] }');
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('TupleModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ coords: z.tuple([z.string(), z.number().int(), z.boolean()]) })',
    );
  });

  it('should handle literal types', async () => {
    const { program, diagnostics } = await compileTypeSpec(
      `model LiteralModel { status: "success" | "failure", code: 200 | 500, enabled: true }`,
    );
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('LiteralModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ status: z.union([z.literal("success"), z.literal("failure")]), code: z.union([z.literal(200), z.literal(500)]), enabled: z.literal(true) })',
    );
  });

  it('should handle various scalar types', async () => {
    const { program, diagnostics } = await compileTypeSpec(
      'model ScalarModel { s: string, i: integer, f: float32, b: boolean, d: plainDate, u: url }',
    );
    expect(diagnostics.length).toBe(0);
    const model = program.resolveTypeReference('ScalarModel')[0];
    assertDefined(model);
    expect(typeSpecTypeToZodString(program, model, 'camelCase', new Map())).toBe(
      'z.object({ s: z.string(), i: z.number().int(), f: z.number(), b: z.boolean(), d: z.string(), u: z.string().url() })',
    );
  });

  it('emit nested models in correct order', async () => {
    const results = await emit(`
      model City { name: string, zip: int32 }
      model Address { street: string, city: City }
      @event("user_address_updated")
      model UserAddressUpdated { userId: string, address: Address }
    `);
    expect(results['events.zod.ts']).toMatchSnapshot();
  });
});
