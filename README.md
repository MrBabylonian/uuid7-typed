# uuid7-typed

A type-safe TypeScript wrapper for UUIDv7 generation with comprehensive validation and utility methods.

## Overview

`uui7-typed` provides a robust, type-safe interface for working with UUIDv7 identifiers in TypeScript applications. UUIDv7 is a time-ordered UUID variant that combines a timestamp with random data, making it ideal for database primary keys and distributed systems where ordering matters.

This library uses TypeScript's branded type system to distinguish validated UUIDv7 strings from regular strings at compile time, preventing accidental misuse of unvalidated strings where a UUID is expected.

## Features

- **Type Safety**: Branded `UUID7` type prevents mixing regular strings with validated UUIDs
- **Time-Ordered**: UUIDv7 format includes timestamp for natural chronological sorting
- **Comprehensive Validation**: Strict format validation with detailed error messages
- **Utility Methods**: Extract timestamps, compare UUIDs, and batch generation
- **Zero Runtime Overhead**: Type safety is compile-time only
- **Fail-Fast Design**: Clear error messages for invalid inputs

## Installation

```bash
npm install uui7-typed
```

## Quick Start

```typescript
import { UUID7Generator, UUID7 } from 'uui7-typed';

// Generate a new UUID
const uuid: UUID7 = UUID7Generator.create();
console.log(uuid); // "01234567-89ab-7def-8123-456789abcdef"

// Type safety in action
function getUser(id: UUID7) {
  // Your implementation here
}

getUser(uuid);           // ✅ Works
getUser("random-string"); // ❌ TypeScript error!
```

## Usage Examples

### Basic UUID Generation

```typescript
import { UUID7Generator } from 'uui7-typed';

// Generate a single UUID
const uuid = UUID7Generator.create();
console.log(uuid); // "01923f4a-7b3d-7123-8456-426614174000"

// Generate multiple UUIDs
const uuids = UUID7Generator.createMany(5);
console.log(uuids.length); // 5
```

### String Validation and Conversion

```typescript
// Strict validation (throws on invalid input)
try {
  const uuid = UUID7Generator.fromString("01923f4a-7b3d-7123-8456-426614174000");
  console.log("Valid UUID:", uuid);
} catch (error) {
  console.error("Invalid UUID format");
}

// Safe validation (returns null on invalid input)
const maybeUuid = UUID7Generator.tryFromString("potentially-invalid-uuid");
if (maybeUuid) {
  console.log("Valid UUID:", maybeUuid);
} else {
  console.log("Invalid UUID format");
}

// Check validity without conversion
if (UUID7Generator.isValid(someString)) {
  // TypeScript now knows someString is a UUID7
  const timestamp = UUID7Generator.getTimestamp(someString);
}
```

### Timestamp Extraction

```typescript
const uuid = UUID7Generator.create();
const creationTime = UUID7Generator.getTimestamp(uuid);
console.log("UUID created at:", creationTime.toISOString());
```

### Chronological Comparison

```typescript
const older = UUID7Generator.create();
// Small delay to ensure different timestamps
await new Promise(resolve => setTimeout(resolve, 1));
const newer = UUID7Generator.create();

const comparison = UUID7Generator.compare(older, newer);
console.log(comparison); // -1 (older comes before newer)

// Sorting an array of UUIDs chronologically
const uuids = UUID7Generator.createMany(10);
uuids.sort(UUID7Generator.compare);
```

## API Reference

### Types

#### `UUID7`

A branded type representing a validated UUIDv7 string. While it's still a string at runtime, TypeScript treats it as a distinct type for compile-time safety.

```typescript
type UUID7 = string & { readonly __brand: unique symbol; };
```

### Classes

#### `UUID7Generator`

A static utility class for generating and managing UUIDv7 identifiers.

##### Methods

###### `create(): UUID7`

Generates a new UUIDv7 with guaranteed uniqueness and time-ordering properties.

- **Returns**: A type-safe UUIDv7 string
- **Throws**: `Error` when UUID generation fails or produces an invalid format

###### `createMany(count: number): UUID7[]`

Generates multiple UUIDv7 identifiers in a single operation.

- **Parameters**: 
  - `count`: The number of UUIDs to generate (must be a non-negative integer)
- **Returns**: An array of type-safe UUIDv7 strings
- **Throws**: `Error` when count is negative or not an integer

###### `fromString(value: string): UUID7`

Converts a string to a type-safe UUIDv7 with strict validation.

- **Parameters**: 
  - `value`: The string to validate and convert
- **Returns**: A type-safe UUIDv7 instance
- **Throws**: `Error` when the input string is not a valid UUIDv7 format

###### `tryFromString(value: string): UUID7 | null`

Safely attempts to convert a string to a UUIDv7 without throwing errors.

- **Parameters**: 
  - `value`: The string to validate and potentially convert
- **Returns**: A type-safe UUIDv7 instance if valid, or null if invalid

###### `isValid(value: string): value is UUID7`

Validates whether a string conforms to the UUIDv7 format specification. Acts as a type guard.

- **Parameters**: 
  - `value`: The string to validate
- **Returns**: True if the string is a valid UUIDv7 format, false otherwise

###### `getTimestamp(uuid: UUID7): Date`

Extracts the creation timestamp from a UUIDv7.

- **Parameters**: 
  - `uuid`: The UUIDv7 from which to extract the timestamp
- **Returns**: A Date object representing when the UUID was created

###### `compare(a: UUID7, b: UUID7): number`

Compares two UUIDv7 strings for chronological ordering.

- **Parameters**: 
  - `a`: The first UUID to compare
  - `b`: The second UUID to compare
- **Returns**: -1 if a < b, 1 if a > b, or 0 if they are equal

## UUIDv7 Format

UUIDv7 follows the format: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`

- **First 48 bits**: Unix timestamp in milliseconds
- **Version nibble**: Always `7`
- **Variant bits**: `8`, `9`, `a`, or `b`
- **Remaining bits**: Random data

This structure ensures that UUIDs are naturally sortable by creation time while maintaining uniqueness through random components.

## Requirements

- Node.js (any recent version)
- TypeScript 4.0+ (for branded types support)

## Dependencies

- `uuidv7`: ^1.1.0

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Changelog

### 1.0.0
- Initial release
- Type-safe UUID7 generation and validation
- Comprehensive utility methods
- Full TypeScript support