import type { StandardSchemaV1 } from '@standard-schema/spec';

// biome-ignore lint/suspicious/noExplicitAny: This is for properties
type Properties = Record<string, any>;
type PropertiesSchemaType = StandardSchemaV1<Properties>;

type EventSchemaType = Record<string, PropertiesSchemaType>;

interface TypespecEventsErrorInput {
  code: 'invalid_event_name' | 'invalid_event_properties';
  message: string;
  eventName: string;
  eventProperties: Properties;
  schema?: PropertiesSchemaType;
  issues?: readonly StandardSchemaV1.Issue[];
}

export class TypespecEventsError extends Error {
  code: TypespecEventsErrorInput['code'];
  eventName: string;
  eventProperties: Record<string, unknown>;
  schema?: PropertiesSchemaType;
  issues?: readonly StandardSchemaV1.Issue[];

  constructor(input: TypespecEventsErrorInput) {
    super(input.message);
    this.name = 'TypespecEventsError';
    this.message = input.message;
    this.code = input.code;
    this.eventName = input.eventName;
    this.eventProperties = input.eventProperties;
    this.schema = input.schema;
    this.issues = input.issues;
  }
}

// Define the type for the user-provided track function
type UserTrackFunction = (eventName: string, eventProperties: Properties) => void;

// Define the type for the options object passed to defineTracker
interface DefineTrackerOptions<EventSchema extends EventSchemaType> {
  track: UserTrackFunction;
  validation?: boolean; // Optional, default to true
  events: EventSchema;
  onInvalidationError?: (error: TypespecEventsError) => void;
}

// Define the type for the returned type-safe track function
type TypeSafeTrackFunction<EventSchema extends EventSchemaType> = <
  K extends keyof DefineTrackerOptions<EventSchema>['events'],
>(
  eventName: K,
  eventProperties: StandardSchemaV1.InferInput<DefineTrackerOptions<EventSchema>['events'][K]>,
) => void;

function defaultOnInvalidationError(error: TypespecEventsError) {
  throw error;
}

/**
 * Defines a type-safe tracker function with optional Zod validation.
 * @param options - Configuration options including the track function, validation flag, and event schemas.
 * @returns A type-safe track function.
 */
export function defineTracker<EventSchema extends EventSchemaType>(
  options: DefineTrackerOptions<EventSchema>,
): TypeSafeTrackFunction<EventSchema> {
  const { track, validation = true, events, onInvalidationError = defaultOnInvalidationError } = options;

  const typeSafeTrack: TypeSafeTrackFunction<EventSchema> = (eventName, eventProperties) => {
    const schema = events[eventName as string];

    if (!schema) {
      onInvalidationError(
        new TypespecEventsError({
          code: 'invalid_event_name',
          eventName: eventName as string,
          eventProperties,
          message: `Event "${eventName as string}" not found`,
        }),
      );
      track(eventName as string, eventProperties);
      return;
    }

    if (validation) {
      // Validate the event properties against the schema
      const res = schema['~standard'].validate(eventProperties) as StandardSchemaV1.Result<Properties>;
      if (!res.issues) {
        track(eventName as string, res.value);
        return;
      }

      onInvalidationError(
        new TypespecEventsError({
          code: 'invalid_event_properties',
          eventName: eventName as string,
          eventProperties,
          message: 'Invalid properties',
          issues: res.issues,
          schema,
        }),
      );
      // Optionally handle validation errors (e.g., don't track, log to a different service)
      // For now, we'll still track the event even if validation fails
      track(eventName as string, eventProperties);
      return;
    }

    // If validation is disabled call the user's track function
    track(eventName as string, eventProperties);
  };

  return typeSafeTrack;
}
