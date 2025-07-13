# Active Context

## Current Work Focus

Implementing configurable schema naming conventions in the `@typespec-events/typespec` emitter and adding corresponding tests.

## Recent Changes

- Initial memory bank files created based on provided planning document content.
- Updated the `@event` decorator definition in `packages/lib/lib/decorators.tsp` to accept a required string literal `name` parameter.
- Updated the `event` function implementation in `packages/lib/src/decorators.ts` to correctly extract the string value from the string literal argument and store it using the `isEvent` state key.
- Renamed the previous `isEvent` accessor function to `getEventName` in `packages/lib/src/decorators.ts` to return the stored event name string (`string | undefined`).
- Created a new boolean `isEvent` function in `packages/lib/src/decorators.ts` to check for the presence of the `@event` decorator.
- Updated `packages/lib/test/decorators.test.ts` to use `getEventName` and test both the `getEventName` and the new boolean `isEvent` functions.
- Merged the emitter and lib logic into a single package located at `packages/lib`.
- Renamed the package in `packages/lib/package.json` from `@typespec-events/lib` to `@typespec-events/typespec`.
- Updated the emitter logic in `packages/typespec/src/emitter.ts` to use `scule` for camelCase/PascalCase transformation of schema names.
- Made the schema naming convention configurable via the `schemaNamingConvention` option in the emitter's options.
- Updated `packages/typespec/test/emitter.test.ts` to include a test case for the PascalCase naming convention.
- Updated the test snapshot for the PascalCase test case.

## Next Steps

- Continue developing the custom emitter to generate code for Go and Rust structs within the `@typespec-events/typespec` package.
- Create a separate `@typespec-events/runtime` package for utility functions related to sending tracking events.
- Potentially create a helper package for Zod integration if needed.

## Active Decisions and Considerations

- The `alternateName` example decorator and its implementation have been removed as requested.
- The `@event` decorator now requires a string name parameter and stores this name using the existing `isEvent` state key.
- The accessor logic has been split into `isEvent` (boolean) and `getEventName` (string | undefined) for clarity.
- The emitter and library have been merged into a single package for better integration.
- The merged package is named `@typespec-events/typespec`.
- Schema naming in the Zod emitter is now configurable to camelCase (default) or PascalCase.

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
