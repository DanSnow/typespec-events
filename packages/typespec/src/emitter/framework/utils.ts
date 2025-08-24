import { isArrayModelType, type Model, type Program } from '@typespec/compiler';

/**
 * Get element model if model is ArrayModel, and if element is not Model, it will return undefined
 * @param program the typespec program
 * @param model the model, maybe ArrayModel
 * @returns element model or undefined
 */
export function getBaseModel(program: Program, model: Model): Model | undefined {
  if (isArrayModelType(program, model)) {
    const elementModel = model.indexer.value;
    if (elementModel.kind !== 'Model') {
      return;
    }
    return elementModel;
  }
  return model;
}
