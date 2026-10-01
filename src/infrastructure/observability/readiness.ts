import { NextResponse } from "next/server";
import { checkDatabaseReadiness } from "@/infrastructure/db/client";
import { logger } from "./logger";

const responseHeaders = { "cache-control": "no-store", "content-type": "application/json" };

export type ReadinessCheck = () => Promise<boolean> | boolean;

/** The endpoint exposes status only; dependency details stay in safe logs. */
export async function getReadinessResponse(check: ReadinessCheck = checkDatabaseReadiness) {
  try {
    const ready = await check();
    if (ready) return NextResponse.json({ status: "ready" }, { status: 200, headers: responseHeaders });
  } catch (error) {
    logger.warn("readiness check failed", { operation: "readiness", error });
  }
  return NextResponse.json({ status: "not_ready" }, { status: 503, headers: responseHeaders });
}
