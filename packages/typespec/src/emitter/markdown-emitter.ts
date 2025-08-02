import type { Model, Program, Type } from '@typespec/compiler';
import { getDoc } from '@typespec/compiler';
import { markdownTable } from 'markdown-table';
import { getModelName, type LanguageEmitter } from './framework/emitter-framework.js';

export class MarkdownEmitter implements LanguageEmitter {
  private program!: Program;
  private namingConvention: 'camelCase' | 'PascalCase' = 'PascalCase'; // Markdown usually uses PascalCase for types

  init(program: Program): void {
    this.program = program;
    // For markdown, we'll default to PascalCase for readability, but could make it configurable.
    // this.namingConvention = context.options.schemaNamingConvention;
  }

  emit(models: Model[], eventModels: Map<Model, string>): { path: string; content: string } {
    let content = '# Event Definitions\n\n';

    for (const [model, eventName] of eventModels.entries()) {
      content += this.emitEventModel(model, eventName);
    }

    if (models.length > eventModels.size) {
      content += '\n# Other Models\n\n';
      for (const model of models) {
        if (!eventModels.has(model)) {
          content += this.emitNonEventModel(model);
        }
      }
    }

    return {
      path: 'events.md',
      content,
    };
  }

  private emitEventModel(model: Model, eventName: string): string {
    let content = `## Event: \`${eventName}\`\n\n`;
    const modelDoc = getDoc(this.program, model);
    if (modelDoc) {
      content += `${modelDoc}\n\n`;
    }
    const eventTableData: string[][] = [['Property Name', 'Type', 'Optional', 'Description']];
    for (const prop of model.properties.values()) {
      const propName = prop.name;
      const propType = this.getTypeSpecTypeName(prop.type);
      const isOptional = prop.optional ? 'Yes' : 'No';
      const propDoc = getDoc(this.program, prop);
      eventTableData.push([`\`${propName}\``, `\`${propType}\``, isOptional, propDoc || '']);
    }
    content += `${markdownTable(eventTableData)}\n\n`;
    return content;
  }

  private emitNonEventModel(model: Model): string {
    let content = `## Model: \`${getModelName(model, this.namingConvention)}\`\n\n`;
    const modelDoc = getDoc(this.program, model);
    if (modelDoc) {
      content += `${modelDoc}\n\n`;
    }
    const modelTableData: string[][] = [['Property Name', 'Type', 'Optional', 'Description']];
    for (const prop of model.properties.values()) {
      const propName = prop.name;
      const propType = this.getTypeSpecTypeName(prop.type);
      const isOptional = prop.optional ? 'Yes' : 'No';
      const propDoc = getDoc(this.program, prop);
      modelTableData.push([`\`${propName}\``, `\`${propType}\``, isOptional, propDoc || '']);
    }
    content += `${markdownTable(modelTableData)}\n\n`;
    return content;
  }

  private getTypeSpecTypeName(type: Type): string {
    // This is a simplified version. A more robust implementation would recursively
    // resolve types, handle unions, arrays, etc.
    if (type.kind === 'Model') {
      if (type.name === 'string' || type.name === 'number' || type.name === 'boolean') {
        return type.name;
      }
      if (type.name === 'Array') {
        // Assuming array type is like `Type[]`
        const elementType = type.indexer?.value;
        return elementType ? `${this.getTypeSpecTypeName(elementType)}[]` : 'unknown[]';
      }
      return getModelName(type, this.namingConvention);
    }
    if (type.kind === 'Scalar') {
      return type.name;
    }
    if (type.kind === 'Union') {
      return Array.from(type.variants.values())
        .map((v: { type: Type }) => this.getTypeSpecTypeName(v.type))
        .join(' | ');
    }
    if (type.kind === 'String' || type.kind === 'Number' || type.kind === 'Boolean') {
      return JSON.stringify(type.value);
    }
    if (type.kind === 'Tuple') {
      return `[${type.values.map((v: Type) => this.getTypeSpecTypeName(v)).join(', ')}]`;
    }
    // Fallback for unhandled types
    return type.kind.toLowerCase();
  }
}
