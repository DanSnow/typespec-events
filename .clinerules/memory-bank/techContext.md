# Tech Context

This project utilizes TypeSpec as the primary language for defining tracking events.

## Technologies Used

- **TypeSpec**: The core language for defining event schemas and metadata.
- **TypeScript/Zod**: Target language/framework for frontend code generation.
- **Go**: Target language for backend code generation.
- **Rust**: Target language for backend code generation.
- **Moon**: Task runner used for managing build and test workflows in the monorepo.
- **Vitest**: Test framework used for running unit and integration tests.

## Development Setup

- A monorepo structure is used, containing the TypeSpec library and the custom emitter.
- Development involves writing TypeSpec definitions and developing/maintaining the custom emitter.

## Technical Constraints

- The custom emitter must be capable of generating correct and idiomatic code for TypeScript/Zod, Go, and Rust based on TypeSpec definitions.

## Dependencies

- TypeSpec compiler and related libraries.
- Dependencies required for the custom emitter (e.g., TypeSpec compiler APIs).
- Dependencies for generated code in target languages (e.g., Zod for TypeScript).
- Moon for task management.
- Vitest for testing.
