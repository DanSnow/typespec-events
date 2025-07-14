# typespec-events

Standardize your analytics and tracking events across your entire stack. `typespec-events` uses [TypeSpec](https://typespec.io) as a single source of truth to generate type-safe code for multiple languages, ensuring consistency and reducing maintenance overhead.

The official documentation is available at [here](https://dansnow.github.io/typespec-events/).

## The Problem

Managing tracking events across different teams, codebases, and technologies often leads to inconsistent data, missing events, and a high maintenance burden when changes are required.

## The Solution

With `typespec-events`, you define your events once in a language-agnostic way using TypeSpec. A custom emitter then generates code for your target platforms, ensuring your events are always in sync.

- **Single Source of Truth:** Define all your tracking events in one place.
- **Type-Safe Code Generation:** Generate code for TypeScript (with Zod schemas) and Go (experimental).
- **Consistent Schemas:** Ensure event schemas are consistent across your frontend and backend.
- **Extensible:** The emitter framework is designed to be extended to support more languages in the future.

## Packages

This monorepo contains the following packages:

| Package                   | Description                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| **`packages/typespec`**   | The core TypeSpec library and the multi-language emitter.                                   |
| **`packages/runtime`**    | A lightweight, type-safe runtime for consuming generated event schemas.                     |
| **`docs`**                | The official documentation website, built with [Starlight](https://starlight.astro.build/). |
| **`packages/playground`** | An example project demonstrating usage and for integration testing.                         |

## Quick Start

1.  **Install the necessary packages:**

    ```bash
    pnpm add @typespec-events/typespec @typespec-events/runtime @typespec/compiler zod
    ```

2.  **Define your events in a `.tsp` file:**

    ```tsp
    // main.tsp
    import "@typespec-events/typespec";
    using TypespecEvents;

    @event("user_signed_up")
    model UserSignedUpEvent {
      userId: string;
      email: string;
    }
    ```

3.  **Configure your `tspconfig.yaml`:**

    ```yaml
    emit:
      - "@typespec-events/typespec"
    ```

4.  **Generate the code:**

    ```bash
    tsp compile .
    ```

5.  **Use the generated code:**

    ```typescript
    // In your application code
    import { defineTracker } from '@typespec-events/runtime';
    import { eventSchemas } from './tsp-output/@typespec-events/events.zod';

    const track = defineTracker({
      track: (eventName, properties) => {
        console.log(`Tracking: ${eventName}`, properties);
      },
      events: eventSchemas,
    });

    track('user_signed_up', { userId: '123', email: 'test@example.com' });
    ```

For more detailed information, please visit the **Official Documentation**.

## Development

This project uses [pnpm](https://pnpm.io/) for package management and [Moon](https://moonrepo.dev/) for task running.

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Run tests:**
    ```bash
    pnpm run test
    ```

3.  **Build all packages:**
    ```bash
    pnpm run build
    ```

