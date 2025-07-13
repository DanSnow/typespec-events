# System Patterns

The core architectural pattern of this project is a monorepo structure utilizing TypeSpec as the single source of truth for tracking event definitions.

## Key Components

- **TypeSpec Library (`packages/typespec`)**: Contains the core TypeSpec definition files (`.tsp`) for tracking events and potentially custom decorators or functions related to event definition, as well as the custom emitter logic (including Zod emitter and Go/Rust emitters under development).
- **Go Emitter**: Logic within `packages/typespec` responsible for generating Go structs and related code from TypeSpec definitions (under development).
- **Rust Emitter**: Logic within `packages/typespec` responsible for generating Rust structs and related code from TypeSpec definitions (under development).
- **Playground (`packages/playground`)**: Contains example TypeSpec code demonstrating the usage of the `@typespec-events/typespec` library and provides integration tests to verify the generated output.
- **Runtime (`packages/runtime`)**: Provides utility functions for consuming the generated code in target applications.

## Data Flow

1. Event definitions are written in TypeSpec within the `packages/playground` directory (for examples) or potentially other user projects consuming the `@typespec-events/typespec` library.
2. The TypeSpec compiler, using the custom emitter from `packages/typespec`, processes the `.tsp` files.
3. The emitter (within `packages/typespec`) generates code (e.g., Zod schemas, Go structs, Rust structs) in the target languages based on the TypeSpec definitions.
4. Generated code is consumed by frontend and backend applications, often in conjunction with the `@typespec-events/runtime` package, to ensure consistent tracking event implementation.

## Design Decisions

- **Single Source of Truth**: Centralizing event definitions in TypeSpec prevents inconsistencies.
- **Code Generation**: Automating code generation reduces manual effort and potential errors across different language implementations.
- **Monorepo**: Keeping related packages (library, emitter, playground) within the same repository simplifies development and version management.

## Emitter Framework

The emitter framework provides a common structure for creating custom emitters for different languages. It consists of the following key components:

-   **LanguageEmitter**: An interface that defines the methods that all language emitters must implement.
-   **StructDefinition**: A data structure that represents a struct in the target language.
-   **FieldDefinition**: A data structure that represents a field in a struct.
-   **mapTypeToLanguageType**: A function that maps TypeSpec types to types in the target language.
-   **emitStruct**: A function that generates the code for a struct in the target language.
