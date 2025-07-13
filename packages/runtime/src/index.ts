import type { ZodIssue, ZodType, z } from 'zod';

interface TypespecEventsErrorInput {
  code: 'invalid_event_name' | 'invalid_event_properties';
  message: string;
  eventName: string;
  eventProperties: Record<string, unknown>;
  schema?: ZodType;
  issues?: ZodIssue[];
}

export class TypespecEventsError extends Error {
  code: TypespecEventsErrorInput['code'];
  eventName: string;
  eventProperties: Record<string, unknown>;
  schema?: ZodType;
  issues?: ZodIssue[];

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

// Define the type for the events map
interface EventSchemas {
  [eventName: string]: ZodType;
}

// Define the type for the user-provided track function
type UserTrackFunction = (eventName: string, eventProperties: Record<string, unknown>) => void;

// Define the type for the options object passed to defineTracker
interface DefineTrackerOptions {
  track: UserTrackFunction;
  validation?: boolean; // Optional, default to true
  events: EventSchemas;
  onInvalidationError?: (error: TypespecEventsError) => void;
}

// Define the type for the returned type-safe track function
type TypeSafeTrackFunction = <K extends keyof DefineTrackerOptions['events']>(
  eventName: K,
  eventProperties: z.infer<DefineTrackerOptions['events'][K]>,
) => void;

function defaultOnInvalidationError(error: TypespecEventsError) {
  throw error;
}

/**
 * Defines a type-safe tracker function with optional Zod validation.
 * @param options - Configuration options including the track function, validation flag, and event schemas.
 * @returns A type-safe track function.
 */
export function defineTracker(options: DefineTrackerOptions): TypeSafeTrackFunction {
  const { track, validation = true, events, onInvalidationError = defaultOnInvalidationError } = options;

  const typeSafeTrack: TypeSafeTrackFunction = (eventName, eventProperties) => {
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
      const res = schema.safeParse(eventProperties);
      if (res.success) {
        track(eventName as string, res.data);
        return;
      }

      onInvalidationError(
        new TypespecEventsError({
          code: 'invalid_event_properties',
          eventName: eventName as string,
          eventProperties,
          message: res.error.message,
          issues: res.error.issues,
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
