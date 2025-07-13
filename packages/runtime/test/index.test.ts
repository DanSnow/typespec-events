import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { defineTracker } from '../src/index';

// Define some mock Zod schemas for testing
const ProductViewedSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  timestamp: z.number(),
});

const UserSignedUpSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});

const MockEvents = {
  product_viewed: ProductViewedSchema,
  user_signed_up: UserSignedUpSchema,
};

describe('defineTracker', () => {
  it('should return a type-safe track function', () => {
    const mockTrack = vi.fn();
    const tracker = defineTracker({
      track: mockTrack,
      events: MockEvents,
    });

    // Test type safety (this is primarily a compile-time check, but we can test runtime behavior)
    // Correct usage
    tracker('product_viewed', { productId: '1', userId: '1', timestamp: 123 });
    expect(mockTrack).toHaveBeenCalledWith('product_viewed', {
      productId: '1',
      userId: '1',
      timestamp: 123,
    });
    mockTrack.mockClear();

    tracker('user_signed_up', { userId: '2', email: 'test@example.com' });
    expect(mockTrack).toHaveBeenCalledWith('user_signed_up', {
      userId: '2',
      email: 'test@example.com',
    });
    mockTrack.mockClear();
  });

  it('should call the track function with validated properties when validation is enabled', () => {
    const mockTrack = vi.fn();
    const tracker = defineTracker({
      track: mockTrack,
      validation: true,
      events: MockEvents,
    });

    const validEvent = { productId: '1', userId: '1', timestamp: 123 };
    tracker('product_viewed', validEvent);
    expect(mockTrack).toHaveBeenCalledWith('product_viewed', validEvent);
    mockTrack.mockClear();
  });

  it('should report a validation error when validation fails and validation is enabled', () => {
    const mockTrack = vi.fn();

    const tracker = defineTracker({
      track: mockTrack,
      validation: true,
      events: MockEvents,
    });

    const invalidEvent = { productId: '1', userId: '1' }; // Missing timestamp
    expect(() => {
      tracker('product_viewed', invalidEvent);
    }).toThrowErrorMatchingInlineSnapshot(`
      [TypespecEventsError: [
        {
          "code": "invalid_type",
          "expected": "number",
          "received": "undefined",
          "path": [
            "timestamp"
          ],
          "message": "Required"
        }
      ]]
    `);

    expect(mockTrack).not.toBeCalled();
  });

  it('should call the track function directly when validation is disabled', () => {
    const mockTrack = vi.fn();

    const tracker = defineTracker({
      track: mockTrack,
      validation: false, // Validation disabled
      events: MockEvents,
    });

    const invalidEvent = { productId: '1', userId: '1' }; // Missing timestamp
    tracker('product_viewed', invalidEvent);

    expect(mockTrack).toHaveBeenCalledWith('product_viewed', invalidEvent);
    mockTrack.mockClear();
  });

  it('should warn and call track for unknown events', () => {
    const mockTrack = vi.fn();

    const tracker = defineTracker({
      track: mockTrack,
      events: MockEvents,
    });

    const unknownEventName = 'unknown_event';
    const eventProperties = { foo: 'bar' };
    expect(() => {
      tracker(unknownEventName as string, eventProperties); // Cast to string to bypass type checking for test
    }).toThrowErrorMatchingInlineSnapshot(`[TypespecEventsError: Event "unknown_event" not found]`);

    expect(mockTrack).not.toBeCalled();
  });
});
