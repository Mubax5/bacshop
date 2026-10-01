import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const responseHeaders = { "cache-control": "no-store", "content-type": "application/json" };

export function GET() {
  return NextResponse.json({ status: "ok", service: "bacshop" }, { status: 200, headers: responseHeaders });
}
