import { randomInt } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type TransactionDatabase = Pick<PrismaClient, "$transaction">;

export function isTransactionConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; meta?: unknown };
  if (candidate.code === "P2034" || retryableSqlState(candidate.code)) return true;
  // Prisma raw queries wrap adapter SQLSTATEs in P2010, unlike model writes.
  // Retry only explicit serialization/deadlock codes, never arbitrary raw errors.
  if (candidate.code !== "P2010" || !candidate.meta || typeof candidate.meta !== "object") return false;
  const meta = candidate.meta as { code?: unknown; driverAdapterError?: unknown };
  if (retryableSqlState(meta.code)) return true;
  if (!meta.driverAdapterError || typeof meta.driverAdapterError !== "object") return false;
  const adapter = meta.driverAdapterError as { cause?: unknown };
  if (!adapter.cause || typeof adapter.cause !== "object") return false;
  return retryableSqlState((adapter.cause as { originalCode?: unknown }).originalCode);
}

function retryableSqlState(code: unknown): boolean {
  return code === "40001" || code === "40P01";
}

/** Retry only DB serialization conflicts. Provider requests must run outside this callback. */
export async function serializableTransaction<T>(
  database: TransactionDatabase,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  options: { attempts?: number; pause?: (milliseconds: number) => Promise<void> } = {},
): Promise<T> {
  const attempts = options.attempts ?? 4;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 8) throw new Error("Invalid transaction retry limit");
  const pause = options.pause ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await database.$transaction(operation, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });
    } catch (error) {
      if (!isTransactionConflict(error) || attempt + 1 >= attempts) throw error;
      await pause(25 * 2 ** attempt + randomInt(25));
    }
  }
  throw new Error("Transaction retry limit exceeded");
}
