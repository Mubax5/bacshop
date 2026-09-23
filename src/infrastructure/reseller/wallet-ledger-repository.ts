import type { WalletEntryKind, WalletLedgerEntry } from "@/domain/reseller/types";
import type { AuditEventRepository } from "@/infrastructure/audit/audit-event-repository";
import { developmentAuditEvents } from "@/infrastructure/audit/audit-event-repository";

export interface LedgerMutation {
  resellerId: string;
  amount: number;
  reference: string;
  kind: WalletEntryKind;
}

export interface WalletLedgerRepository {
  credit(input: LedgerMutation): Promise<{ duplicate: boolean; entry?: WalletLedgerEntry }>;
  debit(input: LedgerMutation): Promise<{ duplicate: boolean; entry?: WalletLedgerEntry }>;
  getBalance(resellerId: string): Promise<number>;
  listForReseller(resellerId: string): Promise<WalletLedgerEntry[]>;
}

/** Append-only deterministic adapter; balances are always calculated from entries. */
export class SeedWalletLedgerRepository implements WalletLedgerRepository {
  private readonly entries: WalletLedgerEntry[] = [];
  private readonly references = new Map<string, WalletLedgerEntry>();
  constructor(private readonly options: { audit?: AuditEventRepository; seedDemoBalance?: boolean } = {}) {
    if (options.seedDemoBalance !== false) {
      const entry: WalletLedgerEntry = Object.freeze({ id: "ledger-opening-demo", resellerId: "reseller-demo-1", amount: 250000, direction: "credit", kind: "credit", reference: "development-opening-balance", createdAt: new Date(0).toISOString() });
      this.entries.push(entry);
      this.references.set(`${entry.resellerId}:${entry.reference}`, entry);
    }
  }

  credit(input: LedgerMutation) { return this.append(input, "credit"); }
  debit(input: LedgerMutation) { return this.append(input, "debit"); }

  private async append(input: LedgerMutation, direction: WalletLedgerEntry["direction"]) {
    if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || !input.resellerId || !input.reference) throw new Error("Invalid wallet ledger entry");
    const key = `${input.resellerId}:${input.reference}`;
    const previous = this.references.get(key);
    if (previous) return { duplicate: true, entry: previous };
    if (direction === "debit" && await this.getBalance(input.resellerId) < input.amount) throw new Error("Insufficient reseller balance");
    const entry = Object.freeze({ ...input, id: `ledger-${this.entries.length + 1}`, direction, createdAt: new Date(0).toISOString() });
    this.entries.push(entry);
    this.references.set(key, entry);
    await this.options.audit?.append({ actorId: input.resellerId, action: direction === "debit" ? "wallet.purchase-debit" : `wallet.${input.kind}`, targetId: input.reference, details: { amount: input.amount, direction, kind: input.kind } });
    return { duplicate: false, entry };
  }

  async getBalance(resellerId: string) {
    return this.entries.filter((entry) => entry.resellerId === resellerId).reduce((balance, entry) => balance + (entry.direction === "credit" ? entry.amount : -entry.amount), 0);
  }
  async listForReseller(resellerId: string) { return this.entries.filter((entry) => entry.resellerId === resellerId).map((entry) => ({ ...entry })); }
}

export const developmentWalletLedger = new SeedWalletLedgerRepository({ audit: developmentAuditEvents });
