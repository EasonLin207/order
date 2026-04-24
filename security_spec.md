# Security Specification

## Data Invariants
- A MenuItem must have a valid `restaurantId`.
- An Order must have a valid `restaurantId` and `itemId`.
- Only admin (logged in user) can modify restaurants and menu items.
- Customers (public) can create orders and read menu/restaurants.

## The Dirty Dozen (Potential Attacks)
1. Unauthorized user creating a restaurant.
2. Unauthorized user deleting a restaurant.
3. Unauthorized user updating menu prices.
4. User creating an order for a non-existent restaurant.
5. User updating an order status they didn't create (though for now we allow admin update).
6. Injecting jumbo IDs for documents.
7. Spoofing `createdAt` to be in the future.
8. Deleting orders without permission.
9. Listing all orders across all restaurants (unprotected query).
10. Creating an order with negative price.
11. Creating an order with zero or negative quantity.
12. Modifying `restaurantId` of an existing order.

## Testing Strategy
We will implement rules that check:
- `isSignedIn()` for admin operations.
- `isValidMenuItem` and `isValidOrder` schema checks.
- Immutability of critical fields.
- Server-side timestamps.
