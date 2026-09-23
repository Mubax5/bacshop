import type { AccessContext } from "@/domain/access/types";
import type { AuditEventRepository } from "@/infrastructure/audit/audit-event-repository";
import { developmentAuditEvents } from "@/infrastructure/audit/audit-event-repository";
import type { TopUpProvider } from "@/infrastructure/reseller/top-up-provider";
import { developmentTopUpProvider } from "@/infrastructure/reseller/top-up-provider";

export async function requestWalletTopUp(input: { context: AccessContext; amount: number; requestId: string; provider?: TopUpProvider; audit?: AuditEventRepository }) {
  if (input.context.kind !== "reseller-approved" || input.context.surface !== "reseller-center") throw new Error("Unauthorized reseller balance access");
  if (!Number.isSafeInteger(input.amount) || input.amount < 10000 || input.amount > 10000000 || !input.requestId) throw new Error("Jumlah top-up tidak valid.");
  const result = await (input.provider ?? developmentTopUpProvider).createRequest({ resellerId: input.context.userId, amount: input.amount, requestId: input.requestId });
  await (input.audit ?? developmentAuditEvents).append({ actorId: input.context.userId, action: "wallet.top-up-requested", targetId: result.reference, details: { amount: input.amount, status: result.status } });
  return result;
}
