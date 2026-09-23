export type ResellerTier = "bronze" | "silver" | "gold";

export type AccessContext =
  | { kind: "guest" }
  | { kind: "customer"; userId: string }
  | { kind: "reseller-pending"; userId: string }
  | {
      kind: "reseller-approved";
      userId: string;
      tier: ResellerTier;
      surface: "retail-store" | "reseller-center";
    }
  | { kind: "reseller-suspended"; userId: string }
  | { kind: "admin"; userId: string };

export function assertAccessContext(context: unknown): asserts context is AccessContext {
  if (!context || typeof context !== "object" || !("kind" in context)) {
    throw new Error("A valid access context is required");
  }

  const candidate = context as Record<string, unknown>;
  const userKinds = [
    "customer",
    "reseller-pending",
    "reseller-approved",
    "reseller-suspended",
    "admin",
  ];
  if (candidate.kind === "guest") return;
  if (!userKinds.includes(String(candidate.kind)) || typeof candidate.userId !== "string" || !candidate.userId) {
    throw new Error("A valid access context is required");
  }
  if (candidate.kind === "reseller-approved") {
    if (!["bronze", "silver", "gold"].includes(String(candidate.tier))) {
      throw new Error("A valid reseller tier is required");
    }
    if (candidate.surface !== "retail-store" && candidate.surface !== "reseller-center") {
      throw new Error("A valid access context is required");
    }
  }
}
