# Active Context

## Current Work Focus

Implementing the `@typespec-events/runtime` package and enhancing the `@typespec-events/typespec` emitter to support the planned user consumption pattern demonstrated by the `track.ts` file. The current focus is specifically on the Zod and TypeScript related tasks, including enforcing snake_case for event names and combining generated output into a single file.

## Recent Changes

- Initial memory bank files created based on provided planning document content.
- Updated the `@event` decorator definition in `packages/lib/lib/decorators.tsp` to accept a required string literal `name` parameter.
- Updated the `event` function implementation in `packages/lib/src/decorators.ts` to correctly extract the string value from the string literal argument and store it using the `isEvent` state key.
- Renamed the previous `isEvent` accessor function to `getEventName` in `packages/lib/src/decorators.ts` to return the stored event name string (`string | undefined`).
- Created a new boolean `isEvent` function in `packages/lib/src/decorators.ts` to check for the presence of the `@event` decorator.
- Updated `packages/lib/test/decorators.test.ts` to use `getEventName` and test both the `getEventName` and the new boolean `isEvent` functions.
- Merged the emitter and lib logic into a single package located at `packages/lib`.
- Renamed the package in `packages/lib/package.json` from `@typespec-events/lib` to `@typespec-events/typespec`.
- Updated the emitter logic in `packages/typespec/src/emintter.ts` to use `scule` for camelCase/PascalCase transformation of schema names.
- Made the schema naming convention configurable via the `schemaNamingConvention` option in the emitter's options.
- Updated `packages/typespec/test/emitter.test.ts` to include a test case for the PascalCase naming convention.
- Updated the test snapshot for the PascalCase test case.
- Refactored the `typeSpecTypeToZodString` function in `packages/typespec/src/emitter.ts` for better maintainability by extracting logic into helper functions.
- Exported the `typeSpecTypeToZodString` function from `packages/typespec/src/emitter.ts` to enable direct testing.
- Added comprehensive test cases for `typeSpecTypeToZodString` in `packages/typespec/test/emitter.test.ts` covering various TypeSpec types (models, optional properties, nested models, arrays, unions, nullable unions, tuples, literal types, and scalar types).
- Fixed the failing scalar types test by removing the non-standard `uuid` type from the test case in `packages/typespec/test/emitter.test.ts`. All tests are now passing.
- **Created the `packages/playground` package**: Added `package.json`, `main.tsp` (example TypeSpec), `README.md`, `moon.yml` (compile and test tasks), and `tsconfig.json`.
- **Added an integration test** in `packages/playground/test/integration.test.ts` to verify the content of the generated output file.
- Reviewed the planned user consumption pattern based on the provided `track.ts` file content.
- Created the `packages/runtime` package with initial `package.json`, `src/index.ts`, and `test/index.test.ts` files.
- Implemented the `defineTracker` function in `packages/runtime/src/index.ts` with basic type safety and optional Zod validation.
- Added initial unit tests for `defineTracker` in `packages/runtime/test/index.test.ts`.
- Installed `zod` dependency in `packages/runtime`.
- Added a diagnostic in the `@typespec-events/typespec` decorator implementation to enforce snake_case for `@event` names.
- Added and successfully ran a test in `packages/typespec/test/decorators.test.ts` for the new snake_case diagnostic.
- **Enhanced the `@typespec-events/typespec` emitter** (`packages/typespec/src/emitter.ts`) to generate a single `events.zod.ts` file containing both Zod schema definitions and an exported `eventSchemas` object mapping snake_case event names to schemas.
- **Updated integration tests** in `packages/playground/test/integration.test.ts` to verify the content of the combined `events.zod.ts` output and added test cases demonstrating usage with the `@typespec-events/runtime`'s `defineTracker` function.
- Confirmed successful implementation by running `moon run typespec:test`.
- Implemented BFS algorithm in `$onEmit` to ensure correct schema generation order.
- Added a new test case to `packages/typespec/test/emitter.test.ts` to prevent regressions in schema generation order.

## Next Steps

- Update `packages/playground/main.tsp` to use snake_case event names.
- Continue developing the custom emitter for Go and Rust structs.
- Potentially create a helper package for Zod integration if needed.

## Active Decisions and Considerations

- The `alternateName` example decorator and its implementation have been removed as requested.
- The `@event` decorator now requires a string name parameter and stores this name using the existing `isEvent` state key.
- The accessor logic has been split into `isEvent` (boolean) and `getEventName` (string | undefined) for clarity.
- The emitter and library have been merged into a single package for better integration.
- The merged package is named `@typespec-events/typespec`.
- Schema naming in the Zod emitter is now configurable to camelCase (default) or PascalCase.
- The `typeSpecTypeToZodString` function has been refactored and exported for improved testability.
- Comprehensive tests for `typeSpecTypeToZodString` have been added and are passing.
- The `playground` package serves as an example of library usage and a location for integration tests that verify emitter output.
- Integration tests in the playground verify the content of generated files after compilation, rather than programmatically compiling within the test.
- The plan is to create a dedicated `@typespec-events/runtime` package for the tracking utility functions.
- The emitter will be responsible for generating the mapping of event names to schemas, which will be consumed by the runtime package.
- **New Decision**: Combine the generated Zod schemas and the event map into a single `events.zod.ts` file.
- **New Decision**: Enforce snake_case for `@event` decorator names using a diagnostic.
- **New Decision**: The `eventSchemas` map keys will use the original snake_case event names.

## Learnings and Project Insights

- Successfully navigating TypeSpec decorator implementation involves coordinating changes between `.tsp` definition files and corresponding TypeScript implementation files.
- Build processes in the monorepo require updating references in related files (like `index.ts` and test files) when code is removed or changed.
- Implementing emitter logic requires careful attention to TypeSpec compiler API details and correct import paths.
- Correctly handling TypeSpec literal types (like `StringLiteral`) is crucial when accessing decorator arguments in the implementation.
- Adhering to naming conventions (e.g., `is` prefix for boolean functions) improves code clarity.
- The project is progressing according to the plan outlined in `progress.md`.
- Merging the emitter and library simplifies the project structure and development workflow.
- **Passing emitter options in tests**: Emitter-specific options are passed within the `options` property of the `CompilerOptions` object provided to the test runner's `compileAndDiagnose` function. These options are then available in the emitter's `EmitContext.options`.
- **Running tests with Moon**: Tests are run using `moon run typespec:test`. To update snapshots, the command `moon run typespec:test -- --update` is used. The `--` is necessary to pass arguments (`--update`) to the underlying test runner (Vitest) via Moon.
- **Reviewing snapshots**: After running tests that modify snapshots, it is important to review the changes in the snapshot file (`test/__snapshots__/emitter.test.ts.snap`) to ensure they match the expected output before committing.
- **Testing TypeSpec compiler interactions**: When testing functions that interact with the TypeSpec compiler (like `typeSpecTypeToZodString`), it is important to compile the TypeSpec code within the test using `compileTypeSpec` and assert on the diagnostics to ensure the TypeSpec code is valid before proceeding with testing the function's output.
- **Standard TypeSpec library types**: Be aware of the standard types available in the TypeSpec standard library and import them explicitly if needed in test TypeSpec code. Non-standard types will result in compilation errors.
- **Setting up a new package with Moon tasks**: New packages require a `package.json` and can have their own `moon.yml` to define package-specific tasks (like `compile` and `test`). Dependencies between tasks in different packages can be defined using `deps` with relative paths or workspace names.
- **Writing integration tests that verify generated files**: Integration tests can compile the source code (e.g., TypeSpec) using a Moon task and then use standard file system operations (`node:fs`) to read the generated output files and assert their content. This approach separates the compilation step from the test execution.
- The `track.ts` file content provided by the user demonstrates the desired consumption pattern for the generated code and runtime library.
- **Decision Confirmed**: The `@typespec-events/typespec` emitter now generates a single `events.zod.ts` file with both schemas and the `eventSchemas` map.
- **Decision Confirmed**: The `eventSchemas` map keys use the original snake_case event names.
- **Decision Confirmed**: Integration tests in `packages/playground` have been updated to verify the combined output and runtime usage.
