import { type CallableMessage, createTypeSpecLibrary, type JSONSchemaType } from '@typespec/compiler';
import type z from 'zod';
import { PACKAGE_NAME } from './consts.js';
import { EmitterOptionsJsonSchema, type EmitterOptionsSchema } from './emitter-options.js';

const reportEventName: CallableMessage<['eventName', 'exampleEventName']> = ({
  eventName,
  exampleEventName,
}: {
  eventName: string;
  exampleEventName: string;
}) => {
  return `Event name "${eventName}" must be in snake_case (e.g., "${exampleEventName}").`;
};

reportEventName.keys = ['eventName', 'exampleEventName'] as const;

export const $lib = createTypeSpecLibrary({
  name: PACKAGE_NAME,
  // Define diagnostics for the library. This will provide a typed API to report diagnostic as well as a auto doc generation.
  diagnostics: {
    'typespec-events-snake-case': {
      messages: {
        default: reportEventName,
      },
      severity: 'error',
    },
  },
  // Defined state keys for storing metadata in decorator.
  state: {
    isEvent: { description: 'Marks a model as a tracking event' },
  },
  emitter: {
    options: EmitterOptionsJsonSchema as JSONSchemaType<z.infer<typeof EmitterOptionsSchema>>,
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
