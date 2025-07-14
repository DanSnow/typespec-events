---
title: Go Emitter
description: Learn how to generate Go code from your TypeSpec definitions.
---

# Go Emitter (Experimental)

The `typespec-events` project includes an experimental emitter for generating Go structs from your TypeSpec event definitions. This allows you to maintain a single source of truth for your tracking events and use them in your Go applications.

## Configuration

To use the Go emitter, you need to configure it in your `tspconfig.yaml` file. Set the `emitter` option to `go`:

```yaml
emit:
  - "@typespec-events/typespec"

options:
  "@typespec-events/typespec":
    languages: [go]
```

## Generating Code

Once you've configured the emitter, you can generate Go code by running the TypeSpec compiler:

```bash
tsp compile your-events.tsp --emit=@typespec-events/typespec
```

This will generate an `events.go` file in the specified output directory (defaulting to `tsp-output/@typespec-events/`).

## Generated Code Example

Given the following TypeSpec definition:

```tsp
import "@typespec-events/typespec";

using TypespecEvents;

@event("user_signed_up")
model UserSignedUpEvent {
  userId: string;
  timestamp: int64;
  email: string;
}

@event("product_viewed")
model ProductViewedEvent {
  productId: string;
  userId?: string;
  timestamp: int64;
}
```

The Go emitter will generate the following `events.go` file:

```go
package main

import "time"

type UserSignedUpEvent {
	UserId    string    `json:"userId"`
	Timestamp time.Time `json:"timestamp"`
	Email     string    `json:"email"`
}

type ProductViewedEvent {
	ProductId string    `json:"productId"`
	UserId    *string   `json:"userId,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

var EventSchemas = map[string]interface{}{
	"user_signed_up":   UserSignedUpEvent{},
	"product_viewed": ProductViewedEvent{},
}
```

## Using the Generated Code

TODO