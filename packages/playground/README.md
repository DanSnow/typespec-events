# @typespec-events/playground

This package contains example TypeSpec code demonstrating how to use the `@typespec-events/typespec` library to define tracking events.

## Zod Emitter

To compile the TypeSpec examples in this directory and generate Zod schemas, navigate to the root of the monorepo and run:

```bash
pnpm run compile:playground
```

This will use the `@typespec-events/typespec` emitter to process the `.tsp` files in this playground and generate output based on the configured emitters. The output will be in `tsp-output/@typespec-events/events.zod.ts`.

## Go Emitter

To generate Go structs from the TypeSpec definitions, you'll need to modify the `tspconfig.yaml` in this directory to select the `go` emitter:

```yaml
emit:
  - "@typespec-events/typespec"

options:
  "@typespec-events/typespec":
    languages: [go]
```

Then, run the compiler:

```bash
pnpm run compile:playground
```

This will generate an `events.go` file in `tsp-output/@typespec-events/`.
