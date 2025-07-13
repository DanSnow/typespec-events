---
title: Defining Complex Schemas
description: Learn how to define complex event data structures using TypeSpec.
---

# Defining Complex Event Schemas

TypeSpec allows you to define complex data structures for your events using various modeling capabilities. This guide covers how to use common TypeSpec features to define detailed event schemas that will be accurately reflected in the generated code (e.g., Zod schemas).

## Models

You can define nested objects within your event schemas by using other TypeSpec models.

```tsp
import "@typespec-events/typespec";

using TypespecEvents;

model Address {
  street: string;
  city: string;
  zipCode: string;
}

@event("user_address_updated")
model UserAddressUpdatedEvent {
  userId: string;
  oldAddress?: Address;
  newAddress: Address;
}
```

In this example, the `UserAddressUpdatedEvent` includes nested `Address` models for both the old and new addresses.

## Optional Properties

Use the `?` suffix on a property name to mark it as optional. This is common for properties that may not always be present in every instance of an event.

```tsp
@event("item_purchased")
model ItemPurchasedEvent {
  itemId: string;
  itemName: string;
  price: float;
  discountCode?: string; // Optional property
}
```

## Arrays

Define lists of items using array syntax (`Type[]`).

```tsp
model Tag {
  name: string;
  value: string;
}

@event("article_tagged")
model ArticleTaggedEvent {
  articleId: string;
  tags: Tag[]; // Array of Tag models
}
```

## Unions

Use union types (`Type1 | Type2 | ...`) to indicate that a property can be one of several different types.

```tsp
@event("payment_method_used")
model PaymentMethodUsedEvent {
  userId: string;
  method: "credit_card" | "paypal" | "stripe"; // Union of string literals
  details: CreditCardDetails | PaypalDetails | StripeDetails; // Union of models
}

model CreditCardDetails { /* ... */ }
model PaypalDetails { /* ... */ }
model StripeDetails { /* ... */ }
```

## Nullable Unions

Combine a type with `null` in a union (`Type | null`) to indicate that a property can be the specified type or `null`.

```tsp
@event("user_feedback_submitted")
model UserFeedbackSubmittedEvent {
  userId: string;
  rating: int;
  comment: string | null; // Comment can be a string or null
}
```

## Tuples

Define a fixed-size ordered list of types using tuple syntax `[Type1, Type2, ...]`.

```tsp
@event("coordinate_logged")
model CoordinateLoggedEvent {
  userId: string;
  coordinate: [float, float]; // Tuple for [latitude, longitude]
}
```

## Literal Types

Use string, numeric, or boolean literals to restrict a property's value to a specific constant.

```tsp
@event("status_updated")
model StatusUpdatedEvent {
  entityId: string;
  status: "active" | "inactive" | "pending"; // Union of string literals
  isActive: boolean; // Boolean literal type
  count: 0 | 1 | 2; // Union of numeric literals
}
```

By using these TypeSpec features, you can accurately model the complexity of your tracking event data, ensuring that the generated code provides strong type safety for your application.
