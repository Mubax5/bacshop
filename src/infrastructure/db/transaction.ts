import { randomInt } from "node:crypto";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type TransactionDatabase = Pick<PrismaClient, "$transaction">;

export function isTransactionConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; cause?: unknown };
  return candidate.code === "P2034" || candidate.code === "40001" || candidate.code === "40P01";
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
