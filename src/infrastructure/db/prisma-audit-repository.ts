import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { AuditEvent } from "@/domain/reseller/types";
import type { AuditEventRepository } from "@/infrastructure/audit/audit-event-repository";
import { safeLogContext } from "@/infrastructure/observability/logger";

type AuditRow = Prisma.AuditEventGetPayload<{ select: { id: true; actorUserId: true; action: true; entityType: true; entityId: true; reason: true; afterData: true; createdAt: true } }>;
const secretName = /(password|hash|secret|token|cookie|authorization|credential|(?:server|api|client).?key|signature|totp|recovery|webhook|payload|connection|database.?url|headers)/i;

function safeDetails(details: Readonly<Record<string, string | number | boolean>>): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (secretName.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") safe[key] = value;
  }
  return safeLogContext(safe) as Record<string, string | number | boolean>;
}

function mapAudit(row: AuditRow): AuditEvent {
  const details = row.afterData && typeof row.afterData === "object" && !Array.isArray(row.afterData)
    ? Object.fromEntries(Object.entries(row.afterData).filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")) as Readonly<Record<string, string | number | boolean>>
    : {};
  return { id: row.id, actorId: row.actorUserId ?? "system", action: row.action, targetId: row.entityId ?? "", details, createdAt: row.createdAt.toISOString() };
}

/** Append-only audit adapter. Metadata is reduced to safe primitive values before persistence. */
export class PrismaAuditEventRepository implements AuditEventRepository {
  constructor(private readonly database: PrismaClient) {}

  async append(event: Omit<AuditEvent, "id" | "createdAt">): Promise<AuditEvent> {
    const details = safeDetails(event.details);
    const entityType = typeof details.entityType === "string" && details.entityType ? details.entityType : "domain";
    const reason = typeof details.reason === "string" ? details.reason : null;
    const row = await this.database.auditEvent.create({
      data: { actorUserId: event.actorId === "system" ? null : event.actorId || null, action: event.action, entityType, entityId: event.targetId || null, reason, afterData: details },
    });
    return mapAudit(row);
  }

  async listForActor(actorId: string): Promise<AuditEvent[]> {
    const rows = await this.database.auditEvent.findMany({ where: { actorUserId: actorId === "system" ? null : actorId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    return rows.map(mapAudit);
  }
}
