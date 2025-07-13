---
title: Emitter Options
description: Configure the TypeSpec Events emitter.
---

# Emitter Options

The `@typespec-events/typespec` emitter can be configured using options in your `tspconfig.yaml` file. These options allow you to customize the code generation process.

To configure the emitter, add an `options` block to your `tspconfig.yaml` file, specifying the options under the emitter's package name:

```yaml
emit:
  - "@typespec-events/typespec"

options:
  "@typespec-events/typespec":
    # Your options go here
    # optionName: value
```

Here are the available options:

## `output-dir`

*   **Type:** `string`
*   **Default:** `./tsp-output`
*   **Description:** Specifies the directory where the generated code file (`events.zod.ts`) will be placed. The path is relative to the `tspconfig.yaml` file.

Example:

```yaml
options:
  "@typespec-events/typespec":
    output-dir: ./generated/events
```

## `schemaNamingConvention`

*   **Type:** `string`
*   **Default:** `"camelCase"`
*   **Allowed values:** `"camelCase"`, `"PascalCase"`
*   **Description:** Determines the naming convention used for the generated Zod schema variables and types.
    *   `"camelCase"`: Generates names like `productViewedEventSchema`.
    *   `"PascalCase"`: Generates names like `ProductViewedEventSchema`.

Example:

```yaml
options:
  "@typespec-events/typespec":
    schemaNamingConvention: PascalCase
```

By using these options, you can tailor the emitter's output to better fit your project's structure and coding standards.
