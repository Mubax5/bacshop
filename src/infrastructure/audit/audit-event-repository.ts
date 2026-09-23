import type { AuditEvent } from "@/domain/reseller/types";

export interface AuditEventRepository {
  append(event: Omit<AuditEvent, "id" | "createdAt">): Promise<AuditEvent>;
  listForActor(actorId: string): Promise<AuditEvent[]>;
}

/** In-memory append-only development adapter. It exposes no update/delete operation. */
export class SeedAuditEventRepository implements AuditEventRepository {
  private readonly events: AuditEvent[] = [];
  async append(event: Omit<AuditEvent, "id" | "createdAt">): Promise<AuditEvent> {
    const stored = Object.freeze({ ...event, details: Object.freeze({ ...event.details }), id: `audit-${this.events.length + 1}`, createdAt: new Date(0).toISOString() });
    this.events.push(stored);
    return stored;
  }
  async listForActor(actorId: string) { return this.events.filter((event) => event.actorId === actorId).map((event) => ({ ...event, details: { ...event.details } })); }
}

export const developmentAuditEvents = new SeedAuditEventRepository();
