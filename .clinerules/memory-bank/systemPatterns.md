# System Patterns

The core architectural pattern of this project is a monorepo structure utilizing TypeSpec as the single source of truth for tracking event definitions.

## Key Components

- **TypeSpec Library (`packages/lib`)**: Contains the core TypeSpec definition files (`.tsp`) for tracking events and potentially custom decorators or functions related to event definition.
- **TypeSpec Emitter (`packages/emitter`)**: Contains the custom emitter logic responsible for reading the TypeSpec definitions from the library and generating code for various target languages/platforms (Zod/TypeScript, Go, Rust).

## Data Flow

1. Event definitions are written in TypeSpec within the `packages/lib` directory.
2. The TypeSpec compiler, using the custom emitter from `packages/emitter`, processes the `.tsp` files.
3. The emitter generates code (schemas, structs, etc.) in the target languages based on the TypeSpec definitions.
4. Generated code is consumed by frontend and backend applications to ensure consistent tracking event implementation.

## Design Decisions

- **Single Source of Truth**: Centralizing event definitions in TypeSpec prevents inconsistencies.
- **Code Generation**: Automating code generation reduces manual effort and potential errors across different language implementations.
- **Monorepo**: Keeping the library and emitter within the same repository simplifies development and version management.
