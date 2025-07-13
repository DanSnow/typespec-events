---
title: Getting Started
description: Learn how to install, define events, generate code, and integrate with the runtime.
---

# Getting Started with TypeSpec Events

This guide will walk you through setting up `typespec-events` in your project, defining your first tracking events, generating code, and integrating with the runtime library.

## Installation

`typespec-events` is distributed as two packages: `@typespec-events/typespec` (containing the TypeSpec library and emitter) and `@typespec-events/runtime` (containing runtime utilities).

Assuming you are using [pnpm](https://pnpm.io/), you can add the packages to your project:

```bash
pnpm add @typespec-events/typespec @typespec-events/runtime zod
```

You will also need to install TypeSpec and its core dependencies if you haven't already:

```bash
pnpm add @typespec/compiler
```

## Defining Your First Event

Create a TypeSpec file (e.g., `events.tsp`) in your project. Define your tracking events as TypeSpec models and apply the `@event` decorator from the `@typespec-events/typespec` library.

The `@event` decorator requires a string literal name for the event, which must be in `snake_case`.

```tsp
import "@typespec-events/typespec";

using TypespecEvents;

@event("user_signed_up")
model UserSignedUpEvent {
  userId: string;
  timestamp: string;
  referralSource?: string;
}

@event("product_added_to_cart")
model ProductAddedToCartEvent {
  productId: string;
  productName: string;
  quantity: int;
  price: float;
}
```

## Generating Code

To generate code from your TypeSpec definitions, you need to configure the `@typespec-events/typespec` emitter in your `tspconfig.yaml` file.

Create a `tspconfig.yaml` file in your project root (or where your main `.tsp` file is located):

```yaml
emit:
  - "@typespec-events/typespec"

options:
  "@typespec-events/typespec":
    # Specify output directory (optional, defaults to tsp-output)
    # output-dir: ./generated
    # Configure schema naming convention (optional, defaults to camelCase)
    # schemaNamingConvention: PascalCase
```

Now, run the TypeSpec compiler. If your main `.tsp` file is `events.tsp`, you can run:

```bash
tsp compile events.tsp --emit=@typespec-events/typespec
```

This will generate a single file (by default `tsp-output/events.zod.ts`) containing the Zod schemas for your events and an `eventSchemas` object mapping the snake_case event names to their corresponding schemas.

```ts
// Example of generated events.zod.ts (content will vary based on your .tsp)
import { z } from 'zod';

export const UserSignedUpEventSchema = z.object({
  userId: z.string(),
  timestamp: z.string(),
  referralSource: z.string().optional(),
});

export const ProductAddedToCartEventSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int(),
  price: z.number(),
});

export const eventSchemas = {
  user_signed_up: UserSignedUpEventSchema,
  product_added_to_cart: ProductAddedToCartEventSchema,
};
```

## Integrating with the Runtime

The `@typespec-events/runtime` package provides the `defineTracker` function to help you integrate the generated schemas with your application's tracking logic.

Import `defineTracker` and the `eventSchemas` object from your generated file:

```ts
import { defineTracker } from '@typespec-events/runtime';
import { eventSchemas } from './tsp-output/events.zod'; // Adjust path as needed

// Define your actual tracking function
const myTrackingFunction = (eventName: string, properties: any) => {
  // Replace with your analytics library call (e.g., analytics.track)
  console.log(`Sending event: ${eventName}`, properties);
};

// Create your type-safe tracker
const track = defineTracker({
  track: myTrackingFunction,
  events: eventSchemas,
  // validation: false, // Optional: disable runtime validation
});

// Now use the 'track' function with type safety and optional validation
track('user_signed_up', { userId: 'abc-123', timestamp: new Date().toISOString() });

// Example of incorrect usage (will cause a TypeScript error and/or runtime validation error)
// track('user_signed_up', { userId: 123 }); // Type error
// track('unknown_event', { data: '...' }); // Type error
```

The `defineTracker` function returns a `track` function that provides type hints based on your TypeSpec definitions and can perform runtime validation using Zod before calling your actual tracking implementation.

You have now successfully set up `typespec-events`, defined an event, generated code, and integrated it with the runtime!

Next, explore the [Concepts](/guides/concepts/) guide to understand the core ideas behind `typespec-events` in more detail.
