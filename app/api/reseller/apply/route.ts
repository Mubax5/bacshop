import { validBrowserMutation } from "@/application/auth/browser-mutation";
import { getConfig } from "@/infrastructure/config/env";
import { NextResponse } from "next/server";
import { getCustomerSession } from "@/application/auth/require-customer";
import { submitResellerApplication } from "@/application/reseller/submit-reseller-application";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.redirect(new URL("/auth/sign-in?returnTo=/reseller-program", getConfig().appOrigin), 303);
  const form = await request.formData();
  if (!(await validBrowserMutation(request, form))) return new Response("Permintaan tidak valid. Muat ulang halaman dan coba lagi.", { status: 403 });
  try {
    await submitResellerApplication({
      userId: session.userId,
      fullName: String(form.get("fullName") ?? ""),
      businessName: String(form.get("businessName") ?? ""),
      contact: String(form.get("contact") ?? ""),
    });
  } catch {
    return NextResponse.redirect(new URL("/reseller-program?error=invalid", getConfig().appOrigin), 303);
  }
  return NextResponse.redirect(new URL("/reseller-program?status=pending", getConfig().appOrigin), 303);
}
