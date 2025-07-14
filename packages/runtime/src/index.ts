import type { StandardSchemaV1 } from '@standard-schema/spec';

// biome-ignore lint/suspicious/noExplicitAny: This is for properties
type Properties = Record<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: This is for properties
type PropertiesSchema = StandardSchemaV1<Record<string, any>>;

interface TypespecEventsErrorInput<Schema extends PropertiesSchema> {
  code: 'invalid_event_name' | 'invalid_event_properties';
  message: string;
  eventName: string;
  eventProperties: Properties;
  schema?: Schema;
  issues?: readonly StandardSchemaV1.Issue[];
}

export class TypespecEventsError<Schema extends PropertiesSchema> extends Error {
  code: TypespecEventsErrorInput<Schema>['code'];
  eventName: string;
  eventProperties: Record<string, unknown>;
  schema?: Schema;
  issues?: readonly StandardSchemaV1.Issue[];

  constructor(input: TypespecEventsErrorInput<Schema>) {
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

// Define the type for the events map
interface EventSchemas<Schema extends PropertiesSchema> {
  [eventName: string]: Schema;
}

// Define the type for the user-provided track function
type UserTrackFunction = (eventName: string, eventProperties: Properties) => void;

// Define the type for the options object passed to defineTracker
interface DefineTrackerOptions<Schema extends PropertiesSchema> {
  track: UserTrackFunction;
  validation?: boolean; // Optional, default to true
  events: EventSchemas<Schema>;
  onInvalidationError?: (error: TypespecEventsError<Schema>) => void;
}

// Define the type for the returned type-safe track function
type TypeSafeTrackFunction<Schema extends PropertiesSchema> = <K extends keyof DefineTrackerOptions<Schema>['events']>(
  eventName: K,
  eventProperties: StandardSchemaV1.InferInput<DefineTrackerOptions<Schema>['events'][K]>,
) => void;

function defaultOnInvalidationError<Schema extends StandardSchemaV1<object>>(error: TypespecEventsError<Schema>) {
  throw error;
}

/**
 * Defines a type-safe tracker function with optional Zod validation.
 * @param options - Configuration options including the track function, validation flag, and event schemas.
 * @returns A type-safe track function.
 */
export function defineTracker<Schema extends PropertiesSchema>(
  options: DefineTrackerOptions<Schema>,
): TypeSafeTrackFunction<Schema> {
  const { track, validation = true, events, onInvalidationError = defaultOnInvalidationError } = options;

  const typeSafeTrack: TypeSafeTrackFunction<Schema> = (eventName, eventProperties) => {
    const schema = events[eventName as string];

    if (!schema) {
      onInvalidationError(
        new TypespecEventsError({
          code: 'invalid_event_name',
          eventName: eventName as string,
          eventProperties,
          message: `Event "${eventName}" not found`,
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
