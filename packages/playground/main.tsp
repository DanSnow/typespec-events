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
