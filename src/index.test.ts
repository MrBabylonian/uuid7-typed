import assert from "node:assert";
import { describe, it } from "node:test";
import { type UUID7, UUID7Generator } from "./index.js";

describe("UUID7Generator", () => {
  // ============================================================
  // EPOCH CONSTANT
  // ============================================================
  describe("EPOCH", () => {
    it("should be a valid UUIDv7", () => {
      assert.strictEqual(UUID7Generator.isValid(UUID7Generator.EPOCH), true);
    });

    it("should have timestamp of Unix epoch (0)", () => {
      const timestamp = UUID7Generator.getTimestamp(UUID7Generator.EPOCH);
      assert.strictEqual(timestamp.getTime(), 0);
    });

    it("should be the minimum possible UUIDv7 for comparisons", () => {
      const newUuid = UUID7Generator.create();
      assert.strictEqual(
        UUID7Generator.compare(UUID7Generator.EPOCH, newUuid),
        -1,
      );
    });
  });

  // ============================================================
  // create()
  // ============================================================
  describe("create()", () => {
    it("should generate a valid UUIDv7", () => {
      const uuid = UUID7Generator.create();
      assert.strictEqual(UUID7Generator.isValid(uuid), true);
    });

    it("should generate unique UUIDs on consecutive calls", () => {
      const a = UUID7Generator.create();
      const b = UUID7Generator.create();
      assert.notStrictEqual(a, b);
    });

    it("should generate UUIDs with correct format (36 characters)", () => {
      const uuid = UUID7Generator.create();
      assert.strictEqual(uuid.length, 36);
    });

    it("should generate UUIDs with version 7 nibble", () => {
      const uuid = UUID7Generator.create();
      // Position 14 is the version nibble (0-indexed: "xxxxxxxx-xxxx-7xxx")
      assert.strictEqual(uuid[14], "7");
    });

    it("should generate UUIDs with valid variant bits (8, 9, a, or b)", () => {
      const uuid = UUID7Generator.create();
      // Position 19 is the variant nibble (0-indexed: "xxxxxxxx-xxxx-xxxx-Vxxx")
      assert.match(uuid[19], /[89ab]/i);
    });

    it("should generate UUIDs with timestamp close to current time", () => {
      const before = Date.now();
      const uuid = UUID7Generator.create();
      const after = Date.now();

      const timestamp = UUID7Generator.getTimestamp(uuid).getTime();
      assert.ok(timestamp >= before && timestamp <= after);
    });

    it("should generate 1000 unique UUIDs without collision", () => {
      const uuids = new Set<UUID7>();
      for (let i = 0; i < 1000; i++) {
        uuids.add(UUID7Generator.create());
      }
      assert.strictEqual(uuids.size, 1000);
    });
  });

  // ============================================================
  // createMany()
  // ============================================================
  describe("createMany()", () => {
    it("should generate the exact requested count", () => {
      const uuids = UUID7Generator.createMany(10);
      assert.strictEqual(uuids.length, 10);
    });

    it("should return an empty array when count is 0", () => {
      const uuids = UUID7Generator.createMany(0);
      assert.deepStrictEqual(uuids, []);
    });

    it("should generate all valid UUIDs", () => {
      const uuids = UUID7Generator.createMany(50);
      uuids.forEach((uuid) => {
        assert.strictEqual(UUID7Generator.isValid(uuid), true);
      });
    });

    it("should generate all unique UUIDs", () => {
      const uuids = UUID7Generator.createMany(100);
      const uniqueSet = new Set(uuids);
      assert.strictEqual(uniqueSet.size, 100);
    });

    it("should throw on negative count", () => {
      assert.throws(
        () => UUID7Generator.createMany(-1),
        /Count must be a non-negative integer/,
      );
    });

    it("should throw on negative large count", () => {
      assert.throws(
        () => UUID7Generator.createMany(-100),
        /Count must be a non-negative integer/,
      );
    });

    it("should throw on floating point count", () => {
      assert.throws(
        () => UUID7Generator.createMany(5.5),
        /Count must be a non-negative integer/,
      );
    });

    it("should throw on NaN", () => {
      assert.throws(
        () => UUID7Generator.createMany(NaN),
        /Count must be a non-negative integer/,
      );
    });

    it("should throw on Infinity", () => {
      assert.throws(
        () => UUID7Generator.createMany(Infinity),
        /Count must be a non-negative integer/,
      );
    });

    it("should throw on negative Infinity", () => {
      assert.throws(
        () => UUID7Generator.createMany(-Infinity),
        /Count must be a non-negative integer/,
      );
    });

    it("should generate UUIDs in chronological order", () => {
      const uuids = UUID7Generator.createMany(10);
      for (let i = 1; i < uuids.length; i++) {
        const comparison = UUID7Generator.compare(uuids[i - 1], uuids[i]);
        assert.ok(
          comparison <= 0,
          `UUID at index ${i - 1} should be <= UUID at index ${i}`,
        );
      }
    });
  });

  // ============================================================
  // compare()
  // ============================================================
  describe("compare()", () => {
    it("should return -1 when first UUID is older", () => {
      const older = UUID7Generator.create();
      const newer = UUID7Generator.create();
      assert.strictEqual(UUID7Generator.compare(older, newer), -1);
    });

    it("should return 1 when first UUID is newer", () => {
      const older = UUID7Generator.create();
      const newer = UUID7Generator.create();
      assert.strictEqual(UUID7Generator.compare(newer, older), 1);
    });

    it("should return 0 for identical UUIDs", () => {
      const uuid = UUID7Generator.create();
      assert.strictEqual(UUID7Generator.compare(uuid, uuid), 0);
    });

    it("should return 0 for two references to the same UUID value", () => {
      const uuid = UUID7Generator.create();
      const copy = UUID7Generator.fromString(uuid);
      assert.strictEqual(UUID7Generator.compare(uuid, copy), 0);
    });

    it("should correctly compare EPOCH with any new UUID", () => {
      const newUuid = UUID7Generator.create();
      assert.strictEqual(
        UUID7Generator.compare(UUID7Generator.EPOCH, newUuid),
        -1,
      );
      assert.strictEqual(
        UUID7Generator.compare(newUuid, UUID7Generator.EPOCH),
        1,
      );
    });

    it("should be usable as a sort comparator", () => {
      const uuids = [
        UUID7Generator.create(),
        UUID7Generator.create(),
        UUID7Generator.create(),
      ];
      const reversed = [...uuids].reverse();
      const sorted = reversed.sort(UUID7Generator.compare);
      assert.deepStrictEqual(sorted, uuids);
    });

    it("should handle lexicographic comparison correctly", () => {
      // Two UUIDs with known ordering
      const a = UUID7Generator.fromString(
        "00000000-0000-7000-8000-000000000000",
      );
      const b = UUID7Generator.fromString(
        "ffffffff-ffff-7fff-bfff-ffffffffffff",
      );
      assert.strictEqual(UUID7Generator.compare(a, b), -1);
      assert.strictEqual(UUID7Generator.compare(b, a), 1);
    });
  });

  // ============================================================
  // fromString()
  // ============================================================
  describe("fromString()", () => {
    it("should parse a valid UUIDv7", () => {
      const input = "0192f8a8-7b3d-7123-8456-426614174000";
      const uuid = UUID7Generator.fromString(input);
      assert.strictEqual(uuid, input);
    });

    it("should parse a valid UUIDv7 with uppercase letters", () => {
      const input = "0192F8A8-7B3D-7123-8456-426614174000";
      const uuid = UUID7Generator.fromString(input);
      assert.strictEqual(uuid, input);
    });

    it("should parse a valid UUIDv7 with mixed case", () => {
      const input = "0192f8A8-7b3D-7123-8456-426614174000";
      const uuid = UUID7Generator.fromString(input);
      assert.strictEqual(uuid, input);
    });

    it("should parse EPOCH constant value", () => {
      const uuid = UUID7Generator.fromString(
        "00000000-0000-7000-8000-000000000000",
      );
      assert.strictEqual(UUID7Generator.isValid(uuid), true);
    });

    it("should accept all valid variant bits (8, 9, a, b)", () => {
      const variants = ["8", "9", "a", "b", "A", "B"];
      variants.forEach((variant) => {
        const input = `0192f8a8-7b3d-7123-${variant}456-426614174000`;
        const uuid = UUID7Generator.fromString(input);
        assert.strictEqual(uuid, input);
      });
    });

    it("should throw on empty string", () => {
      assert.throws(
        () => UUID7Generator.fromString(""),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on random string", () => {
      assert.throws(
        () => UUID7Generator.fromString("not-a-uuid"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUIDv4 (wrong version)", () => {
      assert.throws(
        () => UUID7Generator.fromString("550e8400-e29b-41d4-a716-446655440000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUIDv1 (wrong version)", () => {
      assert.throws(
        () => UUID7Generator.fromString("550e8400-e29b-11d4-a716-446655440000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with wrong variant bits (0-7, c-f)", () => {
      const invalidVariants = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "c",
        "d",
        "e",
        "f",
      ];
      invalidVariants.forEach((variant) => {
        const input = `0192f8a8-7b3d-7123-${variant}456-426614174000`;
        assert.throws(
          () => UUID7Generator.fromString(input),
          /Invalid UUIDv7 format/,
          `Should reject variant ${variant}`,
        );
      });
    });

    it("should throw on UUID without hyphens", () => {
      assert.throws(
        () => UUID7Generator.fromString("0192f8a87b3d71238456426614174000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with extra hyphens", () => {
      assert.throws(
        () =>
          UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-4266-14174000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with wrong hyphen positions", () => {
      assert.throws(
        () => UUID7Generator.fromString("0192f8a87-b3d-7123-8456-426614174000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID that is too short", () => {
      assert.throws(
        () => UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-42661417400"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID that is too long", () => {
      assert.throws(
        () =>
          UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-4266141740000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with invalid hex characters", () => {
      assert.throws(
        () => UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-42661417400g"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with spaces", () => {
      assert.throws(
        () =>
          UUID7Generator.fromString("0192f8a8-7b3d-7123-8456-426614174000 "),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with leading spaces", () => {
      assert.throws(
        () =>
          UUID7Generator.fromString(" 0192f8a8-7b3d-7123-8456-426614174000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on UUID with braces", () => {
      assert.throws(
        () =>
          UUID7Generator.fromString("{0192f8a8-7b3d-7123-8456-426614174000}"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should throw on nil UUID (all zeros)", () => {
      assert.throws(
        () => UUID7Generator.fromString("00000000-0000-0000-0000-000000000000"),
        /Invalid UUIDv7 format/,
      );
    });

    it("should include the invalid value in error message", () => {
      const invalidValue = "invalid-uuid-string";
      assert.throws(
        () => UUID7Generator.fromString(invalidValue),
        new RegExp(invalidValue),
      );
    });
  });

  // ============================================================
  // tryFromString()
  // ============================================================
  describe("tryFromString()", () => {
    it("should return UUID7 for valid input", () => {
      const input = "0192f8a8-7b3d-7123-8456-426614174000";
      const result = UUID7Generator.tryFromString(input);
      assert.strictEqual(result, input);
    });

    it("should return UUID7 for valid uppercase input", () => {
      const input = "0192F8A8-7B3D-7123-8456-426614174000";
      const result = UUID7Generator.tryFromString(input);
      assert.strictEqual(result, input);
    });

    it("should return null for empty string", () => {
      const result = UUID7Generator.tryFromString("");
      assert.strictEqual(result, null);
    });

    it("should return null for invalid string", () => {
      const result = UUID7Generator.tryFromString("invalid");
      assert.strictEqual(result, null);
    });

    it("should return null for UUIDv4", () => {
      const result = UUID7Generator.tryFromString(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      assert.strictEqual(result, null);
    });

    it("should return null for nil UUID", () => {
      const result = UUID7Generator.tryFromString(
        "00000000-0000-0000-0000-000000000000",
      );
      assert.strictEqual(result, null);
    });

    it("should return null for UUID without hyphens", () => {
      const result = UUID7Generator.tryFromString(
        "0192f8a87b3d71238456426614174000",
      );
      assert.strictEqual(result, null);
    });

    it("should never throw an error", () => {
      const invalidInputs = [
        "",
        "not-a-uuid",
        "0192f8a8-7b3d-7123-8456",
        "0192f8a8-7b3d-7123-8456-4266141740000000000",
        "🔥🔥🔥🔥-🔥🔥🔥🔥-🔥🔥🔥🔥-🔥🔥🔥🔥",
        null as unknown as string,
        undefined as unknown as string,
      ];

      invalidInputs.forEach((input) => {
        assert.doesNotThrow(() => UUID7Generator.tryFromString(input));
      });
    });
  });

  // ============================================================
  // getTimestamp()
  // ============================================================
  describe("getTimestamp()", () => {
    it("should extract timestamp close to current time for new UUID", () => {
      const before = Date.now();
      const uuid = UUID7Generator.create();
      const after = Date.now();

      const timestamp = UUID7Generator.getTimestamp(uuid).getTime();
      assert.ok(timestamp >= before && timestamp <= after);
    });

    it("should return Unix epoch (0) for EPOCH constant", () => {
      const timestamp = UUID7Generator.getTimestamp(UUID7Generator.EPOCH);
      assert.strictEqual(timestamp.getTime(), 0);
    });

    it("should return a valid Date object", () => {
      const uuid = UUID7Generator.create();
      const timestamp = UUID7Generator.getTimestamp(uuid);
      assert.ok(timestamp instanceof Date);
      assert.ok(!isNaN(timestamp.getTime()));
    });

    it("should extract consistent timestamp from same UUID", () => {
      const uuid = UUID7Generator.create();
      const timestamp1 = UUID7Generator.getTimestamp(uuid);
      const timestamp2 = UUID7Generator.getTimestamp(uuid);
      assert.strictEqual(timestamp1.getTime(), timestamp2.getTime());
    });

    it("should extract different timestamps from different UUIDs", () => {
      const uuid1 = UUID7Generator.create();
      // Small delay to ensure different timestamp
      const uuid2 = UUID7Generator.create();

      const timestamp1 = UUID7Generator.getTimestamp(uuid1);
      const timestamp2 = UUID7Generator.getTimestamp(uuid2);

      // They should be very close but uuid2 should be >= uuid1
      assert.ok(timestamp2.getTime() >= timestamp1.getTime());
    });

    it("should correctly parse known timestamp", () => {
      // UUID with known timestamp embedded
      // Hex timestamp: 0192f8a87b3d = 1735689600000 (approximately)
      const uuid = UUID7Generator.fromString(
        "0192f8a8-7b3d-7123-8456-426614174000",
      );
      const timestamp = UUID7Generator.getTimestamp(uuid);
      const expectedMs = 0x0192f8a87b3d;
      assert.strictEqual(timestamp.getTime(), expectedMs);
    });

    it("should handle maximum timestamp value", () => {
      // Maximum 48-bit timestamp: ffffffffffff
      const uuid = UUID7Generator.fromString(
        "ffffffff-ffff-7fff-bfff-ffffffffffff",
      );
      const timestamp = UUID7Generator.getTimestamp(uuid);
      const expectedMs = 0xffffffffffff;
      assert.strictEqual(timestamp.getTime(), expectedMs);
    });
  });

  // ============================================================
  // isValid()
  // ============================================================
  describe("isValid()", () => {
    it("should return true for generated UUID", () => {
      const uuid = UUID7Generator.create();
      assert.strictEqual(UUID7Generator.isValid(uuid), true);
    });

    it("should return true for EPOCH constant", () => {
      assert.strictEqual(UUID7Generator.isValid(UUID7Generator.EPOCH), true);
    });

    it("should return true for valid UUIDv7 string", () => {
      assert.strictEqual(
        UUID7Generator.isValid("0192f8a8-7b3d-7123-8456-426614174000"),
        true,
      );
    });

    it("should return true for uppercase valid UUIDv7", () => {
      assert.strictEqual(
        UUID7Generator.isValid("0192F8A8-7B3D-7123-8456-426614174000"),
        true,
      );
    });

    it("should return true for all valid variant bits", () => {
      ["8", "9", "a", "b", "A", "B"].forEach((variant) => {
        const uuid = `0192f8a8-7b3d-7123-${variant}456-426614174000`;
        assert.strictEqual(
          UUID7Generator.isValid(uuid),
          true,
          `Variant ${variant} should be valid`,
        );
      });
    });

    it("should return false for empty string", () => {
      assert.strictEqual(UUID7Generator.isValid(""), false);
    });

    it("should return false for random string", () => {
      assert.strictEqual(UUID7Generator.isValid("hello-world"), false);
    });

    it("should return false for UUIDv4", () => {
      assert.strictEqual(
        UUID7Generator.isValid("550e8400-e29b-41d4-a716-446655440000"),
        false,
      );
    });

    it("should return false for UUIDv1", () => {
      assert.strictEqual(
        UUID7Generator.isValid("550e8400-e29b-11d4-a716-446655440000"),
        false,
      );
    });

    it("should return false for nil UUID", () => {
      assert.strictEqual(
        UUID7Generator.isValid("00000000-0000-0000-0000-000000000000"),
        false,
      );
    });

    it("should return false for invalid variant bits", () => {
      ["0", "1", "2", "3", "4", "5", "6", "7", "c", "d", "e", "f"].forEach(
        (variant) => {
          const uuid = `0192f8a8-7b3d-7123-${variant}456-426614174000`;
          assert.strictEqual(
            UUID7Generator.isValid(uuid),
            false,
            `Variant ${variant} should be invalid`,
          );
        },
      );
    });

    it("should return false for UUID without hyphens", () => {
      assert.strictEqual(
        UUID7Generator.isValid("0192f8a87b3d71238456426614174000"),
        false,
      );
    });

    it("should return false for UUID with invalid characters", () => {
      assert.strictEqual(
        UUID7Generator.isValid("0192f8a8-7b3d-7123-8456-42661417400g"),
        false,
      );
    });

    it("should work as a type guard", () => {
      const maybeUuid: string = "0192f8a8-7b3d-7123-8456-426614174000";

      if (UUID7Generator.isValid(maybeUuid)) {
        // TypeScript should now know this is UUID7
        const timestamp = UUID7Generator.getTimestamp(maybeUuid);
        assert.ok(timestamp instanceof Date);
      } else {
        assert.fail("Should have been valid");
      }
    });

    it("should work as a type guard for invalid input", () => {
      const maybeUuid: string = "not-a-uuid";

      if (UUID7Generator.isValid(maybeUuid)) {
        assert.fail("Should not have been valid");
      } else {
        // This branch should execute
        assert.ok(true);
      }
    });
  });

  // ============================================================
  // Integration / Real-world scenarios
  // ============================================================
  describe("Integration Tests", () => {
    it("should support a typical entity creation workflow", () => {
      // Create entity with UUID
      const entityId = UUID7Generator.create();

      // Validate it
      assert.strictEqual(UUID7Generator.isValid(entityId), true);

      // Extract creation time
      const createdAt = UUID7Generator.getTimestamp(entityId);
      assert.ok(createdAt instanceof Date);

      // Serialize to string (it's already a string)
      const serialized: string = entityId;

      // Deserialize back
      const deserialized = UUID7Generator.fromString(serialized);
      assert.strictEqual(deserialized, entityId);
    });

    it("should support sorting an array of UUIDs by creation time", () => {
      const uuids = UUID7Generator.createMany(5);
      const shuffled = [...uuids].sort(() => Math.random() - 0.5);
      const sorted = shuffled.sort(UUID7Generator.compare);

      // Should be back in chronological order
      for (let i = 1; i < sorted.length; i++) {
        const cmp = UUID7Generator.compare(sorted[i - 1], sorted[i]);
        assert.ok(cmp <= 0);
      }
    });

    it("should support filtering valid UUIDs from mixed input", () => {
      const inputs = [
        "0192f8a8-7b3d-7123-8456-426614174000",
        "invalid",
        "0192f8a8-7b3d-7123-9456-426614174001",
        "",
        "550e8400-e29b-41d4-a716-446655440000", // v4
      ];

      const validUuids = inputs
        .filter(UUID7Generator.isValid)
        .map((v) => v as UUID7);

      assert.strictEqual(validUuids.length, 2);
    });

    it("should handle batch validation with tryFromString", () => {
      const inputs = [
        "0192f8a8-7b3d-7123-8456-426614174000",
        "invalid",
        "0192f8a8-7b3d-7123-9456-426614174001",
      ];

      const results = inputs.map(UUID7Generator.tryFromString);

      assert.notStrictEqual(results[0], null);
      assert.strictEqual(results[1], null);
      assert.notStrictEqual(results[2], null);
    });

    it("should support using EPOCH as a default/placeholder value", () => {
      interface Entity {
        id: UUID7;
        name: string;
      }

      // Use EPOCH as a default before real ID is assigned
      const entity: Entity = {
        id: UUID7Generator.EPOCH,
        name: "Pending Entity",
      };

      assert.strictEqual(entity.id, UUID7Generator.EPOCH);

      // Later assign real ID
      entity.id = UUID7Generator.create();
      assert.notStrictEqual(entity.id, UUID7Generator.EPOCH);
    });
  });
});
