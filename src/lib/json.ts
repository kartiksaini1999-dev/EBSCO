import type { Prisma } from "@prisma/client";

// Prisma's generated types want `InputJsonValue` for Json columns, which
// doesn't structurally match our domain types even though they're plain
// JSON-serializable objects/arrays. Centralize the cast here.
export function toJson<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
