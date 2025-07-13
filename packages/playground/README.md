# @typespec-events/playground

This package contains example TypeSpec code demonstrating how to use the `@typespec-events/typespec` library to define tracking events.

To compile the TypeSpec examples in this directory, navigate to the root of the monorepo and run:

```bash
pnpm run compile:playground
```

This will use the `@typespec-events/typespec` emitter to process the `.tsp` files in this playground and generate output based on the configured emitters (e.g., Zod/TypeScript).
