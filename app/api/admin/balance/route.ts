import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable, validAdminMutation } from "@/application/admin/csrf";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await validAdminMutation(request, form))) redirect("/admin/balance?error=csrf");
  const admin = await requireAdmin("/admin/balance", "balance:write");
  if (productionAdminOperationsUnavailable()) return new Response("Admin operations unavailable", { status: 503 });
  try {
    await developmentAdminOperations.adjustBalance(admin, String(form.get("resellerId") ?? ""), Number(form.get("amount")), String(form.get("reason") ?? ""));
  } catch {
    redirect("/admin/balance?error=update");
  }
  redirect("/admin/balance?saved=1");
}
