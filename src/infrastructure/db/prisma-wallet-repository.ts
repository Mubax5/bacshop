import type { Prisma, PrismaClient, LedgerEntry, WalletEntryType } from "@/generated/prisma/client";
import type { WalletLedgerEntry } from "@/domain/reseller/types";
import type { LedgerMutation, WalletLedgerRepository } from "@/infrastructure/reseller/wallet-ledger-repository";
import { serializableTransaction } from "./transaction";

const entryTypes: Record<LedgerMutation["kind"], WalletEntryType> = { "top-up": "TOP_UP", purchase: "PURCHASE", refund: "REFUND", credit: "ADMIN_CREDIT" };
const mapEntry = (entry: LedgerEntry, resellerId: string): WalletLedgerEntry => ({
  id: entry.id, resellerId, amount: entry.amount, direction: entry.direction === "CREDIT" ? "credit" : "debit",
  kind: entry.type === "TOP_UP" ? "top-up" : entry.type === "PURCHASE" ? "purchase" : entry.type === "REFUND" ? "refund" : "credit",
  reference: entry.reference, createdAt: entry.createdAt.toISOString(),
});

async function balanceFor(transaction: Prisma.TransactionClient, walletId: string) {
  const groups = await transaction.ledgerEntry.groupBy({ by: ["direction"], where: { walletId }, _sum: { amount: true } });
  const balance = groups.reduce((sum, group) => sum + (group.direction === "CREDIT" ? 1 : -1) * (group._sum.amount ?? 0), 0);
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error("Invalid wallet ledger balance");
  return balance;
}

/** Shared transaction primitive lets purchase, order, ledger and audit commit together. */
export async function appendWalletLedger(
  transaction: Prisma.TransactionClient,
  input: LedgerMutation,
  direction: "credit" | "debit",
  context: { actorId: string; reason: string },
): Promise<{ duplicate: boolean; entry: WalletLedgerEntry }> {
  if (!Number.isSafeInteger(input.amount) || input.amount < 1 || input.amount > 2147483647 || !input.resellerId || !input.reference || input.reference.length > 255 || !context.actorId || !context.reason.trim()) throw new Error("Invalid wallet mutation");
  const profile = await transaction.resellerProfile.findUnique({ where: { userId: input.resellerId }, select: { id: true, status: true } });
  if (!profile) throw new Error("Reseller wallet is unavailable");
  if (input.kind === "purchase" && profile.status !== "APPROVED") throw new Error("Reseller purchasing is unavailable");
  const wallet = await transaction.wallet.upsert({ where: { resellerProfileId: profile.id }, create: { resellerProfileId: profile.id }, update: {} });
  await transaction.$queryRaw`SELECT id FROM wallets WHERE id = ${wallet.id}::uuid FOR UPDATE`;
  const previous = await transaction.ledgerEntry.findUnique({ where: { walletId_reference: { walletId: wallet.id, reference: input.reference } } });
  const entryType = entryTypes[input.kind];
  const dbDirection = direction === "credit" ? "CREDIT" : "DEBIT";
  if (previous) {
    if (previous.amount !== input.amount || previous.direction !== dbDirection || previous.type !== entryType) throw new Error("Wallet reference was reused for a different mutation");
    return { duplicate: true, entry: mapEntry(previous, input.resellerId) };
  }
  if (direction === "debit" && await balanceFor(transaction, wallet.id) < input.amount) throw new Error("Insufficient reseller balance");
  const saved = await transaction.ledgerEntry.create({ data: { walletId: wallet.id, resellerProfileId: profile.id, type: entryType, direction: dbDirection, amount: input.amount, reference: input.reference, reason: context.reason, actorUserId: context.actorId } });
  await transaction.auditEvent.create({ data: { actorUserId: context.actorId, action: `wallet.${input.kind}.${direction}`, entityType: "wallet", entityId: wallet.id, reason: context.reason, afterData: { ledgerEntryId: saved.id, amount: input.amount, direction, reference: input.reference } } });
  return { duplicate: false, entry: mapEntry(saved, input.resellerId) };
}

export class PrismaWalletLedgerRepository implements WalletLedgerRepository {
  constructor(private readonly database: PrismaClient, private readonly context: { actorId: string; reason: string }) {}

  credit(input: LedgerMutation) { return serializableTransaction(this.database, (transaction) => appendWalletLedger(transaction, input, "credit", this.context)); }
  debit(input: LedgerMutation) { return serializableTransaction(this.database, (transaction) => appendWalletLedger(transaction, input, "debit", this.context)); }

  async getBalance(resellerId: string) {
    const wallet = await this.database.wallet.findFirst({ where: { resellerProfile: { userId: resellerId } }, select: { id: true } });
    return wallet ? balanceFor(this.database, wallet.id) : 0;
  }

  async listForReseller(resellerId: string) {
    const entries = await this.database.ledgerEntry.findMany({ where: { resellerProfile: { userId: resellerId } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    return entries.map((entry) => mapEntry(entry, resellerId));
  }
}
