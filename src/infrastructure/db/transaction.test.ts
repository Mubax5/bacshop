import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { isTransactionConflict, serializableTransaction } from "./transaction";

describe("serializable database transaction boundary", () => {
  it("retries serialization failures and returns the successful result", async () => {
    const transaction = vi.fn().mockRejectedValueOnce({ code: "P2034" }).mockResolvedValueOnce("saved");
    const database = { $transaction: transaction } as unknown as PrismaClient;
    const pause = vi.fn().mockResolvedValue(undefined);
    expect(await serializableTransaction(database, async () => "saved", { pause })).toBe("saved");
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction.mock.calls[0][1]).toMatchObject({ isolationLevel: "Serializable" });
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("does not retry domain, validation, or unique constraint failures", async () => {
    for (const error of [new Error("Invalid quantity"), { code: "P2002" }]) {
      const transaction = vi.fn().mockRejectedValue(error);
      await expect(serializableTransaction({ $transaction: transaction } as unknown as PrismaClient, async () => true)).rejects.toBe(error);
      expect(transaction).toHaveBeenCalledTimes(1);
    }
  });

  it("limits retry attempts and does not swallow the final conflict", async () => {
    const error = { code: "40001" };
    const transaction = vi.fn().mockRejectedValue(error);
    await expect(serializableTransaction({ $transaction: transaction } as unknown as PrismaClient, async () => true, { attempts: 2, pause: async () => {} })).rejects.toBe(error);
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("recognizes only explicit retryable transaction errors", () => {
    expect(isTransactionConflict({ code: "40P01" })).toBe(true);
    expect(isTransactionConflict({ code: "P2002" })).toBe(false);
    expect(isTransactionConflict(null)).toBe(false);
  });
});
