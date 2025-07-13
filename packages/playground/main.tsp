import "@typespec-events/typespec";

using TypespecEvents;

@event("UserSignedUp")
model UserSignedUpEvent {
  userId: string;
  timestamp: int64;
  email: string;
}

@event("ProductViewed")
model ProductViewedEvent {
  productId: string;
  userId?: string;
  timestamp: int64;
}
