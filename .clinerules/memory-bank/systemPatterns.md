# System Patterns

The core architectural pattern of this project is a monorepo structure utilizing TypeSpec as the single source of truth for tracking event definitions.

## Key Components

- **TypeSpec Library (`packages/typespec`)**: Contains the core TypeSpec definition files (`.tsp`) for tracking events and potentially custom decorators or functions related to event definition, as well as the custom emitter logic.
- **Playground (`packages/playground`)**: Contains example TypeSpec code demonstrating the usage of the `@typespec-events/typespec` library and provides integration tests to verify the generated output.

## Data Flow

1. Event definitions are written in TypeSpec within the `packages/playground` directory (for examples) or potentially other user projects consuming the `@typespec-events/typespec` library.
2. The TypeSpec compiler, using the custom emitter from `packages/typespec`, processes the `.tsp` files.
3. The emitter generates code (schemas, structs, etc.) in the target languages based on the TypeSpec definitions.
4. Generated code is consumed by frontend and backend applications to ensure consistent tracking event implementation.

## Design Decisions

- **Single Source of Truth**: Centralizing event definitions in TypeSpec prevents inconsistencies.
- **Code Generation**: Automating code generation reduces manual effort and potential errors across different language implementations.
- **Monorepo**: Keeping related packages (library, emitter, playground) within the same repository simplifies development and version management.
