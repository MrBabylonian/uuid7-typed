import { V7Generator } from "uuidv7";

/**
 * A branded type representing a validated UUIDv7 string.
 * 
 * This type uses TypeScript's branded/opaque type pattern to distinguish
 * validated UUIDv7 strings from regular strings at compile time. While it's
 * still a string at runtime, TypeScript treats it as a distinct type, preventing
 * accidental misuse of unvalidated strings where a UUID is expected.
 * 
 * UUIDv7 format: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx`
 * - First 48 bits: Unix timestamp in milliseconds
 * - Version nibble: Always `7`
 * - Variant bits: `8`, `9`, `a`, or `b`
 * - Remaining bits: Random data
 * 
 * @example
 * ```typescript
 * // Create via generator (recommended)
 * const uuid: UUID7 = UUID7Generator.create();
 * 
 * // Parse from existing string
 * const parsed: UUID7 = UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-426614174000");
 * 
 * // Type safety in action
 * function getUser(id: UUID7) { ... }
 * getUser(uuid);           // ✅ Works
 * getUser("random-string"); // ❌ TypeScript error!
 * ```
 */
type UUID7 = string & { readonly __brand: unique symbol; };

/**
 * A utility class for generating and managing UUIDv7 identifiers with type safety.
 * 
 * UUIDv7 is a time-ordered UUID variant that combines a timestamp with random data,
 * making it ideal for database primary keys and distributed systems where ordering matters.
 * This class provides a type-safe wrapper around UUIDv7 generation with comprehensive
 * validation and utility methods.
 * 
 * @example
 * ```typescript
 * // Generate a single UUID
 * const uuid: UUID7 = UUID7Generator.create();
 * console.log(uuid); // "01234567-89ab-7def-8123-456789abcdef"
 * 
 * // Generate multiple UUIDs
 * const uuids = UUID7Generator.createMany(5);
 * 
 * // Validate and convert from string
 * const validated = UUID7Generator.fromString("01234567-89ab-7def-8123-456789abcdef");
 * ```
 */
class UUID7Generator {
  /** Regular expression pattern for validating UUIDv7 format compliance */
  private static readonly validateUUID7: RegExp =
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /** Internal UUIDv7 generator instance from the uuidv7 library */
  private static readonly generator = new V7Generator();

  /** Private constructor to prevent instantiation - this is a static utility class */
  private constructor() { }

  /**
   * Generates a new UUIDv7 with guaranteed uniqueness and time-ordering properties.
   * 
   * This method creates a fresh UUIDv7 that includes a timestamp component, making it
   * naturally sortable by creation time. The generated UUID is validated to ensure
   * it meets the UUIDv7 specification requirements.
   * 
   * @returns A type-safe UUIDv7 string that can be used as a unique identifier
   * @throws {Error} When UUID generation fails or produces an invalid format
   * 
   * @example
   * ```typescript
   * const id = UUID7Generator.create();
   * console.log(id); // "01234567-89ab-7def-8123-456789abcdef"
   * ```
   */
  static create(): UUID7 {
    const value = UUID7Generator.generator.generateOrAbort()?.toString() ?? "";

    if (!value || !UUID7Generator.validateUUID7.test(value)) {
      throw new Error(`Invalid UUIDv7 format: ${value}`);
    }
    return value as UUID7;
  }

  /**
   * Generates multiple UUIDv7 identifiers in a single operation.
   * 
   * This method efficiently creates an array of unique UUIDv7 strings, each with
   * time-ordering properties. All generated UUIDs will have slightly different
   * timestamps, ensuring natural ordering when sorted.
   * 
   * @param count The number of UUIDs to generate (must be a non-negative integer)
   * @returns An array containing the requested number of type-safe UUIDv7 strings
   * @throws {Error} When count is negative or not an integer
   * 
   * @example
   * ```typescript
   * // Generate 5 UUIDs for batch processing
   * const ids = UUID7Generator.createMany(5);
   * console.log(ids.length); // 5
   * 
   * // Generate no UUIDs (empty array)
   * const empty = UUID7Generator.createMany(0);
   * console.log(empty); // []
   * ```
   */
  static createMany(count: number): UUID7[] {
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error(`Count must be a non-negative integer: ${count}`);
    }
    return Array.from({ length: count }, () => UUID7Generator.create());
  }

  /**
   * Compares two UUIDv7 strings for chronological ordering.
   * 
   * Since UUIDv7 includes timestamp information, this comparison naturally orders
   * UUIDs by their creation time, making it useful for sorting operations.
   * 
   * @param a The first UUID to compare
   * @param b The second UUID to compare
   * @returns -1 if a < b, 1 if a > b, or 0 if they are equal
   * 
   * @example
   * ```typescript
   * const older = UUID7Generator.create();
   * const newer = UUID7Generator.create();
   * const result = UUID7Generator.compare(older, newer);
   * console.log(result); // -1 (older comes before newer)
   * ```
   */
  static compare(a: UUID7, b: UUID7): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Converts a string to a type-safe UUIDv7 with strict validation.
   * 
   * This method validates that the input string conforms to the UUIDv7 format
   * specification and returns a type-safe UUID7 instance. Use this when you need
   * to ensure the string is a valid UUIDv7 or fail fast with an error.
   * 
   * @param value The string to validate and convert
   * @returns A type-safe UUIDv7 instance
   * @throws {Error} When the input string is not a valid UUIDv7 format
   * 
   * @example
   * ```typescript
   * const uuid = UUID7Generator.fromString("01234567-89ab-7def-8123-456789abcdef");
   * console.log(uuid); // Type-safe UUID7
   * 
   * // This will throw an error
   * UUID7Generator.fromString("invalid-uuid");
   * ```
   */
  static fromString(value: string): UUID7 {
    if (!UUID7Generator.validateUUID7.test(value)) {
      throw new Error(`Invalid UUIDv7 format: ${value}`);
    }
    return value as UUID7;
  }

  /**
   * Safely attempts to convert a string to a UUIDv7 without throwing errors.
   * 
   * This method provides a non-throwing alternative to fromString(), returning
   * null instead of throwing an error when the input is invalid. Useful for
   * scenarios where you want to handle invalid inputs gracefully.
   * 
   * @param value The string to validate and potentially convert
   * @returns A type-safe UUIDv7 instance if valid, or null if invalid
   * 
   * @example
   * ```typescript
   * const valid = UUID7Generator.tryFromString("01234567-89ab-7def-8123-456789abcdef");
   * console.log(valid); // UUID7 instance
   * 
   * const invalid = UUID7Generator.tryFromString("not-a-uuid");
   * console.log(invalid); // null
   * ```
   */
  static tryFromString(value: string): UUID7 | null {
    return UUID7Generator.isValid(value) ? (value as UUID7) : null;
  }

  /**
   * Extracts the creation timestamp from a UUIDv7.
   * 
   * UUIDv7 embeds a millisecond-precision timestamp in its first 48 bits,
   * allowing you to determine when the UUID was created. This is particularly
   * useful for debugging, auditing, or time-based operations.
   * 
   * @param uuid The UUIDv7 from which to extract the timestamp
   * @returns A Date object representing when the UUID was created
   * 
   * @example
   * ```typescript
   * const uuid = UUID7Generator.create();
   * const timestamp = UUID7Generator.getTimestamp(uuid);
   * console.log(timestamp); // Date object close to current time
   * ```
   */
  static getTimestamp(uuid: UUID7): Date {
    const timestampHex = uuid.slice(0, 8) + uuid.slice(9, 13);
    const timestampMs = parseInt(timestampHex, 16);
    return new Date(timestampMs);
  }

  /**
   * Validates whether a string conforms to the UUIDv7 format specification.
   * 
   * This method performs format validation using a regular expression that checks
   * for proper UUIDv7 structure, including the version digit (7) and variant bits.
   * It serves as a type guard, allowing TypeScript to narrow the type when used
   * in conditional statements.
   * 
   * @param value The string to validate
   * @returns True if the string is a valid UUIDv7 format, false otherwise
   * 
   * @example
   * ```typescript
   * if (UUID7Generator.isValid(someString)) {
   *   // TypeScript now knows someString is a UUID7
   *   const timestamp = UUID7Generator.getTimestamp(someString);
   * }
   * 
   * console.log(UUID7Generator.isValid("01234567-89ab-7def-8123-456789abcdef")); // true
   * console.log(UUID7Generator.isValid("not-a-uuid")); // false
   * ```
   */
  static isValid(value: string): value is UUID7 {
    return UUID7Generator.validateUUID7.test(value);
  }
}

export { type UUID7, UUID7Generator };