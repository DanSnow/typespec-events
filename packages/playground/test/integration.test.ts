import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const playgroundRoot = join(__dirname, '..');
const outputDir = join(playgroundRoot, 'tsp-output', '@typespec-events', 'typespec');

describe('Playground Integration Tests', () => {
  it('should generate the expected output file', () => {
    const generatedFilePath = join(outputDir, 'events.zod.ts'); // Assuming Zod emitter output

    // Read the generated file content
    const generatedContent = readFileSync(generatedFilePath, 'utf-8');

    expect(generatedContent.trim()).toMatchSnapshot();
  });
});

// Add a new test suite for runtime usage
describe('Runtime Integration Tests', () => {
  it('should define a tracker and allow tracking valid events', async () => {
    // Dynamic import to avoid issues before compilation/build
    const { eventSchemas } = await import('../tsp-output/@typespec-events/typespec/events.zod');
    const { defineTracker } = await import('@typespec-events/runtime'); // Assuming runtime is built and available

    const mockTrackFunction = vi.fn();

    const tracker = defineTracker({
      track: mockTrackFunction,
      validation: true,
      events: eventSchemas,
    });

    // Test a valid event
    const validProductViewedEvent = { productId: '1', userId: 'user1', timestamp: 123 };
    tracker('product_viewed', validProductViewedEvent);

    // Expect the mock track function to have been called with the correct data
    expect(mockTrackFunction).toHaveBeenCalledTimes(1);
    expect(mockTrackFunction).toHaveBeenCalledWith('product_viewed', validProductViewedEvent);

    // Test another valid event
    const validUserSignedUpEvent = { userId: 'user2', timestamp: 456, email: 'user2@example.com' };
    tracker('user_signed_up', validUserSignedUpEvent);

    expect(mockTrackFunction).toHaveBeenCalledTimes(2);
    expect(mockTrackFunction).toHaveBeenCalledWith('user_signed_up', validUserSignedUpEvent);
  });

  it('should throw a Zod error for invalid event properties when validation is enabled', async () => {
    const { eventSchemas } = await import('../tsp-output/@typespec-events/typespec/events.zod');
    const { defineTracker } = await import('@typespec-events/runtime');

    const mockTrackFunction = vi.fn();

    const tracker = defineTracker({
      track: mockTrackFunction,
      validation: true, // Validation enabled
      events: eventSchemas,
    });

    // Test an invalid event (missing required property)
    const invalidProductViewedEvent = { productId: '1', userId: 'user1' }; // Missing timestamp

    // Expect calling the tracker with invalid data to throw a Zod error
    expect(() => tracker('product_viewed', invalidProductViewedEvent)).toThrow();

    // Ensure the mock track function was NOT called
    expect(mockTrackFunction).not.toHaveBeenCalled();
  });

  it('should not throw errors for invalid event properties when validation is disabled', async () => {
    const { eventSchemas } = await import('../tsp-output/@typespec-events/typespec/events.zod');
    const { defineTracker } = await import('@typespec-events/runtime');

    const mockTrackFunction = vi.fn();

    const tracker = defineTracker({
      track: mockTrackFunction,
      validation: false, // Validation disabled
      events: eventSchemas,
    });

    // Test an invalid event (missing required property)
    const invalidProductViewedEvent = { productId: '1', userId: 'user1' }; // Missing timestamp

    // Expect calling the tracker with invalid data NOT to throw when validation is false
    expect(() => tracker('product_viewed', invalidProductViewedEvent)).not.toThrow();

    // Ensure the mock track function WAS called with the invalid data
    expect(mockTrackFunction).toHaveBeenCalledTimes(1);
    expect(mockTrackFunction).toHaveBeenCalledWith('product_viewed', invalidProductViewedEvent);
  });
});
