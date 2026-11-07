# Security Specification - natural-morocco

## Data Invariants
1.  **Products**: Must have a valid name, price, and image. Only admins or owners can create/update.
2.  **Categories**: Publicly readable. Only admins can modify.
3.  **Orders**: Must contain a customer object and items list. Customers can only read their own orders.
4.  **Customers**: Private PII. Users can only read/write their own profile.
5.  **Settings**: Global config. Publicly readable (non-PII), only admins can write.

## The "Dirty Dozen" Payloads (Deny List)
1.  **Identity Spoofing**: Attempting to create a customer document with a different UID than the authenticated user.
2.  **Shadow Update**: Adding a `role: 'admin'` field to a standard customer profile update.
3.  **PII Blanket Read**: Authenticated user trying to list all documents in the `customers` collection.
4.  **Orphaned Order**: Creating an order without a valid customer ID or with a spoofed customer ID.
5.  **Price Poisoning**: A user trying to update a product's price to $0.
6.  **Resource Exhaustion**: Sending a 2MB string in a product description field (exceeding 1MB limit).
7.  **State Shortcutting**: Updating an order status from 'new' directly to 'delivered' by a customer.
8.  **Unauthorized Admin Write**: Non-admin user trying to update `store_settings`.
9.  **ID Injection**: Using a 2KB junk string as a document ID for a product.
10. **Array Bloating**: Adding 5,000 tags to a product document (exceeding max size).
11. **Spoofed Timestamp**: Providing a client-side `createdAt` date in the past for a new order.
12. **Public PII Leak**: Accessing `/customers/{uid}` of another user.

## Security Controls
- **ABAC**: Access based on user role and ownership.
- **Master Gate**: Sub-collections validated against parent records.
- **Zero-Trust**: Default deny for all paths.
