import "@typespec-events/typespec";

using TypespecEvents;

@event("user_signed_up")
@doc("User signed up")
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
