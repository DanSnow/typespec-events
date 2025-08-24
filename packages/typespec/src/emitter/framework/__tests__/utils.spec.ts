import { isArrayModelType } from '@typespec/compiler';
import invariant from 'tiny-invariant';
import { describe, expect, it } from 'vitest';
import { compile, typespec } from '../../../test-utils.js';
import { getBaseModel } from '../utils.js';

describe('getBaseModel', () => {
  it.each([
    [
      typespec`
        model PropertyModel {
            item: int32;
        }
        @test
        model TestModel {
            property: PropertyModel;
        }
        `,
      true,
    ],
    [
      typespec`
        model PropertyModel {
            item: int32;
        }
        @test
        model TestModel {
            property: PropertyModel[];
        }
        `,
      true,
    ],
    [
      typespec`
        @test
        model TestModel {
            property: int32[];
        }
        `,
      false,
    ],
  ])('should extract base model', async (code: string, isModel: boolean) => {
    const {
      program,
      models: { TestModel },
    } = await compile(code);

    // basic verify for code
    invariant(TestModel.kind === 'Model', 'Model is not Model type');
    const property = TestModel.properties.get('property');
    invariant(property, 'missing property');
    const propertyModel = property.type;
    invariant(propertyModel.kind === 'Model', 'missing property model');

    const baseModel = getBaseModel(program, propertyModel);
    if (isModel) {
      expect(baseModel?.kind).toBe('Model');
      invariant(baseModel, 'missing baseModel');
      expect(isArrayModelType(program, baseModel), 'baseModel should not be ArrayModel').toBe(false);
    } else {
      expect(baseModel).toBeUndefined();
    }
  });
});
