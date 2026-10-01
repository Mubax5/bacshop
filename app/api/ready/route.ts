import { getReadinessResponse } from "@/infrastructure/observability/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  return getReadinessResponse();
}
